import {_errorText, _promisify, Callbacks, nbLogger} from "./Head";
import {Nebula} from "./Nebula";
import {NebulaService} from "./NebulaService";
import {HttpRequest, QueryParams} from "./HttpRequest";

import {Promise} from "es6-promise";

import {Buffer} from "buffer";

/**
 * @private
 */
export class CustomApi {
    _service: NebulaService;
    apiname: string;
    method: string;
    subpath: string;
    path: string;
    responseType: string;
    contentType: string;
    headers: {[index:string]: string};
    queryParams: {[index:string]: string};
    receiveResponseHeaders: boolean;

    /**
     * @class CustomApi
     * @classdesc カスタムAPIクラス
     * @description カスタムAPIクラスインスタンスを生成する
     * @example
     * var customApi = new Nebula.CustomApi("hello", "GET", "sayHello");
     * @param {String} apiname API名
     * @param {String} method メソッド (GET/POST/PUT/DELETE のいずれか)
     * @param {String} subpath サブパス。省略時は null。
     */
    constructor(apiname: string, method: string, subpath?: string, service: NebulaService = Nebula) {
        this._service = service;
        this.apiname = apiname;
        this.method = method;
        this.subpath = subpath;
        this.headers = {};
        this.queryParams = {};
        this.receiveResponseHeaders = false;

        this.path = "/api/" + apiname;
        if (subpath) {
            if (subpath.indexOf("/") !== 0) {
                this.path += "/";
            }
            this.path += subpath;
        }
    }

    /**
     * @memberOf CustomApi
     * @description リクエストヘッダをクリアする (Content-Type を除く)
     * @returns {CustomApi} this
     */
    clearHeaders() {
        this.headers = {};
    }

    /**
     * @memberOf CustomApi
     * @description リクエスト Content-Type を指定する
     * @param contentType Content-Type
     * @returns {CustomApi} this
     */
    setContentType(contentType: string): CustomApi {
        this.contentType = contentType;
        return this;
    }

    /**
     * @memberOf CustomApi
     * @description リクエストヘッダを追加する
     * @param name ヘッダ名
     * @param value ヘッダ値
     * @returns {CustomApi} this
     */
    addHeader(name: string, value: string): CustomApi {
        this.headers[name] = value;
        return this;
    }

    /**
     * @memberOf CustomApi
     * @description クエリパラメータを追加する
     * @param {string} name
     * @param {string} value
     * @returns {CustomApi}
     */
    addQueryParam(name: string, value: string): CustomApi {
        this.queryParams[name] = value;
        return this;
    }

    /**
     * @memberOf CustomApi
     * @desciption 想定するレスポンスをバイナリに設定する。
     * レスポンスは blob または buffer で返却される。
     * @return {CustomApi} this
     */
    setBinaryResponse(): CustomApi {
        if (typeof Blob !== "undefined" && Blob !== null) {
            this.responseType = "blob";
        } else if (typeof Buffer !== "undefined" && Buffer !== null) {
            this.responseType = "buffer";
        } else {
            throw new Error("No blob / buffer");
        }
        return this;
    }

    /**
     * @memberOf CustomApi
     * @description レスポンスヘッダ受信設定を行う(Node.jsのみ)。
     * <p>
     * true に設定すると、execute 成功時の応答は
     * {body: ..., headers: {...}, status: statusCode}
     * 形式となる。
     * <p>
     * ブラウザ(XHR)の場合は、headers は文字列(全ヘッダ連結したもの)、
     * Node.js の場合は headers はヘッダ名をキーとした Object となる。
     * @param receive true の場合はレスポンスヘッダを受信する
     */
    setReceiveResponseHeaders(receive: boolean): CustomApi {
        this.receiveResponseHeaders = receive;
        return this;
    }

    /**
     * @memberOf CustomApi
     * @description カスタムAPIの呼び出し
     * @param {Object} data API呼び出しデータ
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・メソッドが GET/DELETE の場合、データはクエリパラメータに追加格納される。
     *   メソッドが POST/PUT の場合、データはボディに JSON 形式で格納される。
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通り。
     *         success(response)
     *             response : サーバ応答データ。テキストデータの場合は文字列(JSONの場合でも)。
     *                        ファイルの場合は Blob または Buffer オブジェクト。
     *                        レスポンスヘッダ受信設定をしている場合は、オブジェクトが返却され、
     *                        body にサーバ応答データ、headers にヘッダが格納される。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    execute(data: object, callbacks?: Callbacks): Promise<string|object> {
        return this._execute(data, false, callbacks);
    }

    /**
     * @memberOf CustomApi
     * @description
     *      カスタムAPIの呼び出し(raw message版)。Node.js専用。
     *      <p>HTTP/1.1において、処理が成功した場合、Promise には http.IncomingMessage が返される。
     *      <p>http.IncomingMessage に対するイベントハンドラを自身で設定、適切にハンドリングすること。
     *      <p>データ読み込み時は http.IncomingMessage よりレスポンスのステータスを取得、判定を行うこと。
     *      <p>リクエスト送信が失敗した場合、Promise には error が返される。
     *      <p>HTTP/2において、処理が成功した場合、Promise には http2.ClientHttp2Stream が返される。
     *      <p>ClientHttp2Stream に対するイベントハンドラを自身で設定、適切にハンドリングすること。
     *      <p>HTTP/2のステータスコードを取得するには、'response'イベントの':status'を参照する。
     * @example
     *      var customApi = ....;
     *
     *      // for HTTP/1.1
     *      // pipe()を使用する場合
     *      var writable = fs.createWriteStream(....);
     *      customApi.executeRaw()
     *          .then((message) => {
     *              message.pipe(writable);
     *          });
     *
     *      // 'data'を実装する場合
     *      customApi.executeRaw()
     *          .then((message) => {
     *              message.on('data', () => {....});
     *              message.on('end', () => {....});
     *              message.on('error', () => {....});
     *              message.on('close', () => {....});
     *          });
     *
     *      // for HTTP/2
     *      var statusCode;
     *      customApi.executeRaw()
     *          .then((message) => {
     *              message.on('response', (headers, flags) => { statusCode = headers[':status'] });
     *              message.on('data', () => {....});
     *              message.on('end', () => {....});
     *              message.on('error', () => {....});
     *              message.on('close', () => {....});
     *          });
     * @param {Object} data API呼び出しデータ
     * @return {Promise} Promise
     * @since 7.5.0
     */
    executeRaw(data: object): Promise<any> {
        return this._execute(data, true);
    }

    _execute(data: object, rawMessage: boolean, callbacks?: Callbacks): Promise<any> {
        const request = new HttpRequest(this._service, this.path);
        request.setMethod(this.method);

        request.addQueryParams(this.queryParams);
        if (data) {
            if (this.method === "GET" || this.method === "DELETE") {
                request.addQueryParams(data as QueryParams);
            } else {
                request.setData(data);
            }
        }

        if (!rawMessage) {
            if (this.responseType != null) {
                request.setResponseType(this.responseType);
            }
        } else {
            request.rawMessage = true;
        }

        if (this.contentType != null) {
            request.setContentType(this.contentType);
        }
        for (const key of Object.keys(this.headers)) {
            request.addRequestHeader(key, this.headers[key]);
        }
        request.setReceiveResponseHeaders(this.receiveResponseHeaders);

        const promise = request.execute()
            .then((response) => {
                nbLogger("CustomApi#success");
                return response;
            })
            .catch((err) => {
                nbLogger("CustomApi#error " + _errorText(err));
                return Promise.reject(err);
            });

        return _promisify(promise, callbacks);
    }
}

/** @private */
export const declareCustomApi = (_service: NebulaService) => {
    /*
     * カスタムAPI クラス
     */
    _service.CustomApi = class _CustomApi extends CustomApi {
        constructor(apiname: string, method: string, subpath?: string) {
            super(apiname, method, subpath, _service);
        }
    };
};
