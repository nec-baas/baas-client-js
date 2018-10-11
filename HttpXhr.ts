import {_createError, nbError, root} from "./Head";

import {_hasXhr, Headers, HttpRequest, HttpRequestExecutor} from "./HttpRequest";

export const initHttpXhr = () => {
    HttpRequestExecutor.setXhrFactory((req) => new HttpXhr(req));
};

/**
 * XHR 実行クラス
 * @private
 */
export class HttpXhr extends HttpRequestExecutor {
    private _xhr: XMLHttpRequest;
    private _receiveResponseHeaders: boolean;

    constructor(req: HttpRequest) {
        super(req);
        this._onReadyStateChange = this._onReadyStateChange.bind(this);
    }

    setReturnRawMessage(rawMessage: boolean): void {
        throw new Error("Not supported");
    }

    execute(method: string, url: string, headers: Headers, body: any, timeout: number,
            responseType: string, receiveResponseHeaders: boolean, useHttp2 : boolean): void {
        this._receiveResponseHeaders = receiveResponseHeaders;

        this._xhr = this._createXhr();
        this._xhr.open(method, url, true);
        this._xhr.onreadystatechange = this._onReadyStateChange;

        for (const key of Object.keys(headers)) {
            const value = headers[key];
            this._xhr.setRequestHeader(key, value);
        }

        this._xhr.timeout = timeout;
        this._xhr.ontimeout = (e: any) => {
            this._onXhrTimeout(e);
        };

        try {
            const userAgent = root.navigator.userAgent.toLowerCase();

            if (userAgent.match(/msie/) || userAgent.match(/trident/)) {
                this._xhr.setRequestHeader("Pragma", "no-cache");
                this._xhr.setRequestHeader("Cache-Control", "no-cache");
                this._xhr.setRequestHeader("If-Modified-Since", "Thu, 01 Jun 1970 00:00:00 GMT");
            } else {
            }
        } catch (e) {
        }

        if (responseType != null) {
            this._xhr.responseType = responseType as XMLHttpRequestResponseType;
        }

        this._xhr.send(body);
    }

    // internal use only
    static closeHttp2Session(authority: string): void {
        throw new Error("not support");
    }

    /**
     * XHRを生成する
     * @returns {XMLHttpRequest}
     * @private
     */
    _createXhr(): XMLHttpRequest {
        if (!_hasXhr()) {
            throw new Error("No XMLHttpRequest");
        }
        return new XMLHttpRequest();
    }

    /**
     * XHR状態変更ハンドラ
     * @returns {any}
     * @private
     */
    _onReadyStateChange(): any {
        const xhr = this._xhr;

        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                const body = (xhr.response != null) ? xhr.response : xhr.responseText;
                if (this._receiveResponseHeaders) {
                    return this._resolve({
                        body,
                        headers: xhr.getAllResponseHeaders(),
                        status: xhr.status
                    });
                } else {
                    return this._resolve(body);
                }
            } else {
                const error: any = _createError(xhr.status, xhr.statusText, "");

                if (xhr.responseType !== "blob") {
                    error.responseText = xhr.responseText;
                }

                if (xhr.status === 0) {
                    error.statusText = "Not Found";
                    error.responseText = "Not found anything that matches the request URI.";
                }

                nbError("HTTP Request Error: " + error.message + " " + error.responseText);
                return this._reject(error);
            }
        }
    }

    /**
     * XHRタイムアウトハンドラ
     * @private
     */
    _onXhrTimeout(e: any) {
        const error = _createError(0, "Timeout error", e.toString());
        nbError("HTTP Response Error: Timeout Error: " + e.toString());
        this._reject(error);
    }
}

// factory を投入する
HttpRequestExecutor.setXhrFactory((req) => {
    return new HttpXhr(req);
});
