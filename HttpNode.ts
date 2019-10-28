import {_createError, nbError, nbLogger} from "./Head";
import {URL, http, https, tls, fs, util, http2} from "./NodeSupport";

import {Buffer} from "buffer";
import * as _url from "url";
import * as _http from "http";
import * as _util from "util";
import {Headers, HttpRequest, HttpRequestExecutor} from "./HttpRequest";
import {ClientHttp2Session, ClientHttp2Stream, IncomingHttpHeaders} from "http2"; // KEEP
import {Url} from "url"; // KEEP


// node.js: tls.createServer() options
interface TlsCreateServerOptions /*extends tls_t.TlsOptions*/ {
    rejectUnauthorized?: boolean;
}

// node.js: http.request() options
interface HttpRequestOptions extends _http.RequestOptions, TlsCreateServerOptions {
    [index: string]: any;
}

export const initHttpNode = () => {
    HttpRequestExecutor.setNodeFactory((req) => new HttpNode(req));
};

/**
 * Node.js 実行クラス
 * @private
 */
export class HttpNode extends HttpRequestExecutor {
    // for http2 support
    private static _http2Sessions : {[index: string]: ClientHttp2Session}= {};

    private _responseType: string;
    private _receiveResponseHeaders: boolean;
    private _rawMessage: boolean = false;

    constructor(req: HttpRequest) {
        super(req);
    }

    setReturnRawMessage(returnRawMessage: boolean) {
        this._rawMessage = returnRawMessage;
    }

    execute(method: string, urlString: string, headers: Headers, body: any, timeout: number,
            responseType: string, receiveResponseHeaders: boolean, useHttp2 : boolean): void {
        this._responseType = responseType;
        this._receiveResponseHeaders = receiveResponseHeaders;

        let url: _url.Url;
        try {
            url = URL.parse(urlString);
        } catch (e) {
            nbError("Bad URL: " + urlString);
            this._reject(_createError(0, "Bad URL: " + urlString, ""));
            return;
        }
        const isHttps = HttpNode._isHttps(url);

        const options: HttpRequestOptions = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.path, // path + queryString
            headers,
            agent: isHttps ? HttpRequest._httpsAgent : HttpRequest._httpAgent,
            timeout,

            // client cert options with null
            pfx: null,
            passphrase: null,
            key: null,
            cert: null,
            ca: null,
            privateKeyEngine: null,
            privateKeyIdentifier: null,
            rejectUnauthorized: true
        };

        // クライアント証明書認証用オプション指定
        if (isHttps) {
            // client cert options
            const allowedClientCertOptions = ['pfx', 'passphrase', 'key', 'cert', 'ca', 'privateKeyEngine', 'privateKeyIdentifier'];
            // set Client Cert options if exists
            const clientCertOptions = this._req.service._config.clientCertOptions;
            if (clientCertOptions != null) {
                for (const key in clientCertOptions) {
                    //nbLogger("_doNodeRequest() option keys " + key );
                    if (allowedClientCertOptions.indexOf(key) >= 0) {
                        options[key] = clientCertOptions[key];
                    } else {
                        // 許容しないキーが設定されていた
                        nbError('invalid parameter ' + key + ' detected. value: ' + JSON.stringify(clientCertOptions[key]));
                        this._reject(_createError(0, 'invalid parameter: ' + key, ' value: ' + JSON.stringify(clientCertOptions[key])));
                        return;
                    }
                }
            }

            // self signed cert option
            if (this._req.service._config.allowSelfSignedCert) {
                options.rejectUnauthorized = false;
                nbLogger('HTTPS Request Warning : accept self-signed certificate. make sure the risk of this setting.');
            } else {
                options.rejectUnauthorized = true;
            }

            // nbLogger("_doNodeRequest() options " + JSON.stringify(options));
        }

        // httpsOptions verify
        if (isHttps && options.agent != null && HttpRequest._httpsAgentOptions != null) {
            try {
                tls.createSecureContext(HttpRequest._httpsAgentOptions);
            } catch (e) {
                nbError("HttpsAgentOptions invalid. check proxy options " + e.toString());
                const error = _createError(0, "Client Error", e.toString());
                this._reject(error);
                return;
            }
        }

        if (http2 != null && useHttp2) {
            this._sendHttp2Request(url, options, body);
        } else {
            this._sendHttpRequest(url, options, body);
        }
    }

    /**
     * HTTP/2リクエストを送信する
     * @param {module:url.Url} url URL
     * @param {HttpRequestOptions} options ヘッダ等のオプション情報
     * @param body リクエストボディ
     * @private
     */
    private _sendHttp2Request(url: _url.Url, options: HttpRequestOptions, body: any) {
        // create authority, such as "https://test.example.com:1234"
        let authority = url.protocol + '//' + url.hostname;
        if (url.port != null) {
            authority += ':' + url.port;
        }

        // cleanup cached sessions
        const sessions = HttpNode.getHttp2Sessions();
        for (const key in sessions) {
            const session = sessions[key];
            if (session.destroyed == true || session.closed == true) {
                nbLogger('http2 session ' + authority + ' is destroyed or closed state');
                HttpNode.closeHttp2Session(key);
            }
        }

        // ensure session
        let http2Session = HttpNode.getHttp2Session(authority);
        if (http2Session == null) {
            nbLogger('create http2 session: [' + authority + ']');
            // new connection
            const http2SessionOptions: object = {
                allowHTTP1: true,
                pfx: options['pfx'],
                passphrase: options['passphrase'],
                key: options['key'],
                cert: options['cert'],
                ca: options['ca'],
                rejectUnauthorized: options['rejectUnauthorized']
                //agent: options['agent'] // http2 module does not support agent
            };

            // create http2 connection
            http2Session = http2.connect(authority, (HttpNode._isHttps(url) ? http2SessionOptions : undefined));
            HttpNode.setHttp2Session(authority, http2Session);
        }

        // create a http2 stream
        const outgoingHttpHeaders = options.headers;
        outgoingHttpHeaders[':method'] = options.method;
        outgoingHttpHeaders[':path'] = url.path;
        // commented out to avoid printing secret info
        //nbLogger('[request] ' + _util.inspect(outgoingHttpHeaders));
        const http2Stream: ClientHttp2Stream = http2Session.request(outgoingHttpHeaders);

        // set handlers
        if (options.timeout > 0) {
            http2Stream.setTimeout(options.timeout, () => {
                HttpNode._closeStream(http2Stream);
                const error = _createError(0, "HTTP/2 Request timeout: " + options.timeout + "[msec]", "");
                nbError("Timeout detected: " + error);
            });
        }
        if (this._rawMessage) {
            this._resolve(http2Stream); // ClientHttp2Streamを直接返却
        } else {
            this._setHttp2ResponseHandlers(http2Stream);
        }

        if (body != null) {
            if (typeof body === "string" || body instanceof String || body instanceof Buffer) {
                http2Stream.write(body);
            } else {
                http2Stream.write(JSON.stringify(body));
            }
        }
        http2Stream.end();
    }

    /**
     * HTTP/1.1リクエストを送信する
     * @param {module:url.Url} url URL
     * @param {HttpRequestOptions} options ヘッダ等のオプション情報
     * @param body リクエストボディ
     * @private
     */
    private _sendHttpRequest(url: _url.Url, options: HttpRequestOptions, body: any) {
        const handler = (res: _http.IncomingMessage) => {
            if (this._rawMessage) {
                // IncomingMessage 直接返却
                this._resolve(res);
            } else {
                // TODO: 3xx レスポンス対応するならここで実施する必要がある
                const status = res.statusCode;

                // save response headers
                this._req.responseHeaders = res.headers;

                this._setResponseHandlers(status, res);
            }
        };
        const req = HttpNode._isHttps(url) ? https.request(options, handler) : http.request(options, handler);

        // #9694: HTTPタイムアウトを設定
        if (options.timeout > 0) {
            req.setTimeout(options.timeout, () => req.abort());
        }

        req.on('error', (e: Error) => {
            const error = _createError(0, "HTTP request error", e.toString());
            nbError("HTTP Request Error: " + e.toString());
            this._reject(error);
        });

        if (body != null) {
            if (typeof body === "string" || body instanceof String || body instanceof Buffer) {
                req.write(body);
            } else {
                req.write(JSON.stringify(body));
            }
        }
        req.end();
    }

    /**
     * スキームが'https'であるか判定する
     * @param {module:url.Url} url 判定対象のURL
     * @returns {boolean} 'https'ならばtrue
     * @private
     */
    private static _isHttps(url : _url.Url) : boolean {
        return (url.protocol === 'https:');
    }

    /**
     * HTTPレスポンス受信用のハンドラを設定する (Node.js用)
     * @param {number} status ステータスコード
     * @param res Stream(http.IncomingMessageなど)
     * @private
     */
    private _setResponseHandlers(status: number, res: _http.IncomingMessage) {
        const chunks: Buffer[] = [];

        res.on('data', (data: Buffer) => {
            chunks.push(data);
        });
        res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const responseBody = this._parseNodeResponse(buffer);

            if (200 <= status && status < 300) {
                if (this._receiveResponseHeaders) {
                    this._resolve({
                        body: responseBody,
                        headers: res.headers,
                        status
                    });
                } else {
                    this._resolve(responseBody);
                }
            } else {
                const responseText = (this._responseType !== "buffer" && responseBody != null) ? responseBody.toString() : "";
                const error = _createError(status, res.statusMessage, responseText, responseBody);
                nbError("HTTP Response Error: status=" + status + " - " + res.statusMessage);
                this._reject(error);
            }
        });
        res.on('error', (e: Error) => {
            const error = _createError(0, "Client Error", e.toString());
            nbError("HTTP Response Error: Client Error: " + e.toString());
            this._reject(error);
        });
    }

    /**
     * HTTP/2レスポンス受信用のハンドラを設定する (Node.js用)
     * @param stream (http2.ClientHttp2Stream)
     * @private
     */
    private _setHttp2ResponseHandlers(stream: ClientHttp2Stream) {
        const chunks: Buffer[] = [];
        let resHeaders: IncomingHttpHeaders = {};
        let statusCode: number = 0;

        stream.on('response', (headers: IncomingHttpHeaders, flags: number) => {
            // responses including status code and headers
            resHeaders = headers;
            statusCode = Number(headers[http2.constants.HTTP2_HEADER_STATUS]);
            // commented out to avoid printing secret info
            // nbLogger('[response]' + _util.inspect(headers));
        }).on('data', (data: Buffer) => {
            chunks.push(data);
        }).on('end', () => {
            const buffer = Buffer.concat(chunks);
            const responseBody = this._parseNodeResponse(buffer);
            HttpNode._closeStream(stream);
            if (200 <= statusCode && statusCode < 300) {
                if (this._receiveResponseHeaders) {
                    this._resolve({
                        body: responseBody,
                        headers: resHeaders,
                        status: statusCode
                    });
                } else {
                    this._resolve(responseBody);
                }
            } else {
                const statusMessage = (statusCode == 0) ? "Unable to get proper response" : "";
                const responseText = (this._responseType !== "buffer" && responseBody != null) ? responseBody.toString() : "";
                const error = _createError(statusCode, statusMessage, responseText, responseBody);
                nbError("HTTP/2 Response Error: status=" + statusCode);
                this._reject(error);
            }
        }).on('error', (e: Error) => {
            HttpNode._closeStream(stream);
            const error = _createError(0, "HTTP/2 Stream Error", e.toString());
            nbError("HTTP/2 Stream Error: " + e.toString());
            this._reject(error);
        }).on('push', (headers: IncomingHttpHeaders, flags: number) => {
            nbLogger('HTTP/2 Stream push');
            // nbLogger('HTTP/2 Stream push: ' + _util.inspect(headers));
        }).on('finish', () => {
            nbLogger('HTTP/2 Stream finish');
        }).on('altsvc', (alt: string, origin: string, streamId: number) => {
            // available after v9.4.0+
            nbLogger('HTTP/2 Stream altsvc');
            // nbLogger('HTTP/2 Stream altsvc altsvc:' + alt + ' origin:' + origin + ' streamId:' + streamId);
        }).on('aborted', () => {
            nbLogger('HTTP/2 Stream aborted');
        });
    }

    private _parseNodeResponse(buffer: Buffer): Buffer | string | object {
        try {
            switch (this._responseType) {
                default:
                case 'text':
                    return buffer.toString('utf-8');

                case 'json':
                    const s = buffer.toString('utf-8');
                    try {
                        return JSON.parse(s);
                    } catch (e) {
                        return s;
                    }

                case 'buffer':
                    return buffer;
            }
        } catch (e) {
            nbError("bad response: e=" + e.toString());
            return null;
        }
    }

    /**
     * HTTP/2のsessionをcloseする(Node.js用)
     * @param session http2.ClientHttp2Sessionだが、互換性維持のためanyを使用
     * @param {function(): void} callback close完了後のコールバック
     * @private
     */
    private static _closeSession(session: any, callback?: () => void): void {
        if ('close' in session) {
            session.close(callback); // for v8.11.2+
        } else if ('shutdown' in session) {
            const options = {'graceful': true};
            session.shutdown(options, callback); // for v8.4. shutdown() is removed at v8.11.2
        } else {
            // fail safe
            session.destroy();
            session.removeAllListeners();
        }
    }

    /**
     * HTTP/2のstreamをcloseする(Node.js用)
     * node versionによりcloseに使用するAPIが異なるため
     * @param stream http2.ClientHttp2Streamだが、互換性維持のためanyを使用
     * @private
     */
    private static _closeStream(stream: any): void {
        if ('close' in stream) {
            stream.close(); // for v9+
        } else {
            stream.destroy(); // for v8.4
        }
    }

    /**
     * HTTP/2セッションを全て返却する
     * @returns {{index: string, module:http2.ClientHttp2Session}}
     */
    static getHttp2Sessions(): { [index: string]: ClientHttp2Session } {
        return HttpNode._http2Sessions;
    }

    /**
     * 指定したHTTP/2セッションを取得する
     * @param {string} authority
     * @returns {module:http2.ClientHttp2Session} session
     */
    static getHttp2Session(authority: string): ClientHttp2Session {
        let session = null;
        if (authority in HttpNode._http2Sessions) {
            session = HttpNode._http2Sessions[authority];
        }
        return session;
    }

    /**
     * HTTP/2セッションをキャッシュする
     * @param {string} authority
     * @param {module:http2.ClientHttp2Session} session
     */
    static setHttp2Session(authority: string, session: ClientHttp2Session): void {
        HttpNode._http2Sessions[authority] = session;
    }

    /**
     * 指定したHTTP/2セッションをcloseする。
     * @param {string} authority 未指定の場合は、保持するセッションを全てクローズする
     */
    static closeHttp2Session(authority?: string): void {
        if (authority === undefined) {
            for (const key in HttpNode._http2Sessions) {
                HttpNode.closeHttp2Session(key);
            }
            return;
        }
        const session = HttpNode._http2Sessions[authority];
        if (session != null) {
            if (session.destroyed) {
                session.removeAllListeners();
                nbLogger('HTTP/2 session [' + authority + '] is already destroyed');
            } else {
                nbLogger('HTTP/2 session [' + authority + '] is going to close');
                HttpNode._closeSession(session, () => {
                    session.removeAllListeners();
                    nbLogger('HTTP/2 session [' + authority + '] has been closed');
                });
            }
            delete HttpNode._http2Sessions[authority];
        }
    }
}

// factory を投入する
HttpRequestExecutor.setNodeFactory((req) => {
    return new HttpNode(req);
});
