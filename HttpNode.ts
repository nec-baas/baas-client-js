import {_createError, nbError, nbLogger} from "./Head";
import {URL, http, https, tls} from "./NodeSupport";

import {Buffer} from "buffer";
import * as _url from "url";
import * as _http from "http";
import {Headers, HttpRequest, HttpRequestExecutor} from "./HttpRequest";

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
    private _responseType: string;
    private _receiveResponseHeaders: boolean;

    constructor(req: HttpRequest) {
        super(req);
    }

    execute(method: string, urlString: string, headers: Headers, body: any, timeout: number,
            responseType: string, receiveResponseHeaders: boolean): void {
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
        const isHttps = (url.protocol === 'https:');

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
            rejectUnauthorized: true
        };

        // クライアント証明書認証用オプション指定
        if (isHttps) {
            // client cert options
            const allowedClientCertOptions = ['pfx', 'passphrase', 'key', 'cert', 'ca'];
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

        const handler = (res: _http.IncomingMessage) => {
            // TODO: 3xx レスポンス対応するならここで実施する必要がある
            const status = res.statusCode;

            // save response headers
            this._req.responseHeaders = res.headers;

            this._setResponseHandlers(status, res);
        };
        const req = isHttps ? https.request(options, handler) : http.request(options, handler);

        // #9694: HTTPタイムアウトを設定
        if (timeout > 0) {
            req.setTimeout(timeout, () => req.abort());
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
}

// factory を投入する
HttpRequestExecutor.setNodeFactory((req) => {
    return new HttpNode(req);
});
