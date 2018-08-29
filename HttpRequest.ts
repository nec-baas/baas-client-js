import {NebulaService, ProxyServer} from "./NebulaService";
import {JsonObject, nbLogger} from "./Head";
import {http2} from "./NodeSupport";

import * as _tls from "tls";

import {Promise} from "es6-promise";
import {Buffer} from "buffer";

/**
 * APIリクエストインタフェース。
 * HttpRequest, _SdeRequest が implement する
 * @private
 */
export interface ApiRequest {
    execute(): Promise<any>;
    setData(data: any): void;
    setMethod?(method: string): void;
    setContentType?(type: string): void;
    setQueryParam?(key: string, value: any): void;
    setQueryParams?(params: any): void;
    setSessionToken?(token: string): void;
}

export interface Headers {
    [index: string]: string;
}

export interface QueryParams {
    [index: string]: string;
}

/**
 * XHRが定義されているか調べる
 * @returns {boolean}
 * @private
 */
export const _hasXhr = (): boolean => {
    return typeof XMLHttpRequest !== "undefined";
}

export abstract class HttpRequestExecutor {
    _req: HttpRequest;
    _resolve: any;
    _reject: any;

    static _xhrFactory: (req: HttpRequest) => HttpRequestExecutor;
    static _nodeFactory: (req: HttpRequest) => HttpRequestExecutor;

    constructor(req: HttpRequest) {
        this._req = req;

        this._resolve = req._resolve;
        this._reject = req._reject;
    }

    /**
     * リクエスト実行
     * @param {string} method
     * @param {string} url
     * @param {Headers} headers
     * @param {any} body
     * @param {number} timeout
     * @param {string} responseType
     * @param {boolean} receiveResponseHeaders
     */
    abstract execute(method: string, url: string, headers: Headers, body: any, timeout: number,
                     responseType: string, receiveResponseHeaders: boolean): void;

    /**
     * HttpRequestExecutor のファクトリメソッド
     * @param {HttpRequest} req
     * @return {HttpRequestExecutor}
     */
    static create(req: HttpRequest): HttpRequestExecutor {
        if (_hasXhr()) {
            return this._xhrFactory(req);
        } else {
            return this._nodeFactory(req);
        }
    }

    static setXhrFactory(factory: (req: HttpRequest) => HttpRequestExecutor) {
        this._xhrFactory = factory;
    }

    static setNodeFactory(factory: (req: HttpRequest) => HttpRequestExecutor) {
        this._nodeFactory = factory;
    }
}

/*
 * HTTPリクエスト クラス
 */
export class HttpRequest implements ApiRequest {
    private _service: any;
    private _method: string;
    private _url: string;
    private _headers: Headers;
    private _contentType: string;
    private _responseType: string;
    private _queryParams: QueryParams;
    private _data: any;
    private _sessionToken: string;
    private _timeout: number;

    _resolve: any;
    _reject: any;

    private _receiveResponseHeaders: boolean;
    private _responseHeaders: object;

    private _useHttp2: boolean = false;

    private static _defaultTimeout = 0;
    static _httpAgent: any;
    static _httpsAgent: any;
    static _httpsAgentOptions: _tls.SecureContextOptions;
    static _proxy: ProxyServer;

    static getProxy(): ProxyServer {
        return HttpRequest._proxy;
    }

    static setProxy(proxy: ProxyServer) {
        HttpRequest._proxy = proxy;
    }

    static setHttpAgent(agent: any) {
        HttpRequest._httpAgent = agent;
    }

    static setHttpsAgent(agent: any, options?: any) {
        HttpRequest._httpsAgent = agent;
        HttpRequest._httpsAgentOptions = options;
    }

    // internal use only
    get service(): any {
        return this._service;
    }

    /**
     * @description レスポンスヘッダ(Node.js のみ)
     * @name HttpRequest#responseHeaders
     * @type {Object}
     */
    get responseHeaders(): object {
        return this._responseHeaders;
    }

    set responseHeaders(value: object) {
        this._responseHeaders = value;
    }

    /**
     * @memberOf HttpRequest
     * @description デフォルト通信タイムアウト値を設定する
     * @param {number} timeout タイムアウト値(ミリ秒)
     */
    static setDefaultTimeout(timeout: number) {
        this._defaultTimeout = timeout;
    }

    /**
     * @memberOf HttpRequest
     * @description デフォルト通信タイムアウト値を取得する
     * @return {number} タイムアウト値(ミリ秒)
     */
    static getDefaultTimeout(): number {
        return this._defaultTimeout;
    }

    /**
     * @memberOf HttpRequest
     * @description HTTP2 の使用・不使用状態を返す
     * @returns {boolean} HTTP2を使用する場合は true
     */
    get useHttp2(): boolean {
        return this._useHttp2;
    }

    /**
     * @memberOf HttpRequest
     * @description HTTP2 の使用・不使用を指定する。
     * HTTP2 を使用する場合は、Node.js v8.x 以上が必要。
     * @param {boolean} value HTTP2を使用する場合は true
     */
    set useHttp2(value: boolean) {
        if (value && http2 == null) {
            throw new Error("No http2 support.");
        }
        this._useHttp2 = value;
    }

    /**
     * @class HttpRequest
     * @classdesc HTTPリクエストクラス
     * @description コンストラクタ。
     * <p>
     * ユーザがログイン中の場合、自動的に SessionToken が設定される。
     * @param {NebulaService} service NebulaService
     * @param {string} path パス
     * @param {Object} option オプション。noprefix プロパティに true を設定すると、パスプレフィクス("/1/{tenantId}")を付与しない。
     */
    constructor(service: NebulaService, path: string, option?: JsonObject) {
        nbLogger("HttpRequest#start:path = " + path);
        this._service = service;
        this._url = this._service.getBaseUri();

        if (!(option && option.noprefix)) {
            this._url += "/" + this._service.getRestApiVersion() + "/" + this._service.getTenantID();
        }

        // path に含まれるグループ名やファイル名(日本語の場合あり)は、 encodeURIComponent で事前に encode されている。
        // クエリパラメータ(?, &, =) などは素通し
        this._url = encodeURI(this._url) + path;

        this._headers = {};
        this._contentType = null;
        this._responseType = null;
        this._queryParams = null;
        this._data = null;
        this._receiveResponseHeaders = false;
        this._timeout = HttpRequest.getDefaultTimeout();

        const _currentObj = this._service.getCurrentUser();

        if (_currentObj === null) {
            this._sessionToken = null;
        } else {
            this._sessionToken = _currentObj.sessionToken;
        }
    }

    /**
     * @memberOf HttpRequest
     * @description レスポンスヘッダ受信設定を行う。
     * <p>
     * true に設定すると、execute 成功時の応答は
     * {body: ..., headers: {...}, status: statusCode}
     * 形式となる。
     * <p>
     * ブラウザ(XHR)の場合は、headers は文字列(全ヘッダ連結したもの)、
     * Node.js の場合は headers はヘッダ名をキーとした Object となる。
     * @param {boolean} receive true の場合はレスポンスヘッダを受信する
     * @return {HttpRequest} this
     */
    setReceiveResponseHeaders(receive: boolean): HttpRequest {
        this._receiveResponseHeaders = receive;
        return this;
    }

    /**
     * @memberOf HttpRequest
     * @description HTTP リクエストを実行する。
     * X-Application-Id, X-Application-Key, X-Session-Token ヘッダは自動的に付与される。
     * @return {Promise} Promise
     */
    execute(): Promise<any> {
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
            this._headers["X-Application-Id"] = this._service.getAppID();
            this._headers["X-Application-Key"] = this._service.getAppKey();

            // ヘッダ
            if (this._contentType !== null) {
                this._headers["Content-Type"] = this._contentType;
            }

            if (this._sessionToken !== null) {
                this._headers["X-Session-Token"] = this._sessionToken;
            }

            let url = this._url;

            // クエリパラメータ
            if (this._queryParams) {
                const p: string[] = [];

                for (const key of Object.keys(this._queryParams)) {
                    if (this._queryParams.hasOwnProperty(key)) {
                        p.push(encodeURIComponent(key) + "=" + encodeURIComponent(this._queryParams[key]));
                    }
                }

                if (p.length > 0) {
                    url += "?" + p.join("&");
                }
            }

            // ボディ
            let body: any;
            if (!(this._data != null)) {
                body = null;
            } else if (
                (typeof this._data === "string") ||
                (typeof Blob !== "undefined" && Blob !== null && this._data instanceof Blob) ||
                (typeof Buffer !== "undefined" && Buffer !== null && Buffer.isBuffer(this._data))) {
                body = this._data;
            } else {
                body = JSON.stringify(this._data);
            }

            const executor = HttpRequestExecutor.create(this);
            executor.execute(this._method, url, this._headers, body, this._timeout,
                this._responseType, this._receiveResponseHeaders);
        });
    }


    /**
     * @memberOf HttpRequest
     * @description HTTP メソッドを設定する
     * @param {string} method メソッド
     * @return {HttpRequest} this
     */
    setMethod(method: string): HttpRequest {
        this._method = method;
        return this;
    }

    /**
     * @memberOf HttpRequest
     * @description Content-Type 設定する
     * @param {string} contentType Content-Type
     * @return {HttpRequest} this
     */
    setContentType(contentType: string): HttpRequest {
        this._contentType = contentType;
        return this;
    }

    /**
     * @memberOf HttpRequest
     * @description クエリパラメータを設定する。以前設定されていた値は消去される。
     * @param {Object} params パラメータ(Object形式)
     * @return {HttpRequest} this
     */
    setQueryParams(params: QueryParams): HttpRequest {
        this._queryParams = params;
        return this;
    }

    /**
     * @memberOf HttpRequest
     * @description クエリパラメータを追加する。以前設定されていた値に追加される。
     * @param {Object} params パラメータ(Object形式)
     * @return {HttpRequest} this
     */
    addQueryParams(params: QueryParams): HttpRequest {
        if (params) {
            for (const key of Object.keys(params)) {
                this.setQueryParam(key, params[key]);
            }
        }
        return this;
    }

    /**
     * @memberOf HttpRequest
     * @description クエリパラメータ(1件)を設定する
     * @param {string} key パラメータ名
     * @param {Object} value 値
     * @return {HttpRequest} this
     */
    setQueryParam(key: string, value: any): HttpRequest {
        if (!this._queryParams) {
            this._queryParams = {};
        }

        this._queryParams[key] = value;
        return this;
    }

    /**
     * @memberOf HttpRequest
     * @description 送信データを設定する。
     * <p>
     * 文字列を指定した場合は文字列がそのまま設定される。
     * Objectを指定した場合は JSON 文字列に変換される。
     * Blob および Buffer を指定した場合は、バイナリデータが設定される。
     * @param {Object} data データ
     * @return {HttpRequest} this
     */
    setData(data: any): HttpRequest {
        this._data = data;
        return this;
    }

    /**
     * @memberOf HttpRequest
     * @description SessionToken を設定する。
     * <p>
     * 通常は本クラスのインスタンス生成時点で自動的に SessionToken は設定されている(ユーザログイン済みの場合)
     * @param {string} sessionToken セッショントークン文字列
     * @return {HttpRequest} this
     */
    setSessionToken(sessionToken: string): HttpRequest {
        this._sessionToken = sessionToken;
        return this;
    }

    /**
     * @memberOf HttpRequest
     * @description ResponseType を設定する。
     * 指定できるタイプは以下のいずれかで、返却されるレスポンスの型が変化する。
     * デフォルトは "text"。
     * <ul>
     *     <li>text : 文字列</li>
     *     <li>json : JSON。レスポンスは JSON.parse されたもの。</li>
     *     <li>blob : blob (ブラウザのみ)</li>
     *     <li>buffer : Buffer (Node.jsのみ)</li>
     * </ul>
     * @param {string} responseType レスポンスタイプ
     * @return {HttpRequest} this
     */
    setResponseType(responseType: string): HttpRequest {
        this._responseType = responseType;
        return this;
    }

    /**
     * @memberOf HttpRequest
     * @description リクエストヘッダを設定する。
     * <p>注: 1つのヘッダに対して設定できる値は1つのみである。
     * @param {string} header ヘッダ名
     * @param {string} value 値
     * @return {HttpRequest} this
     */
    addRequestHeader(header: string, value: string): HttpRequest {
        if (this._headers[header] !== undefined) {
            nbLogger("HTTP Request Warning : This header already exists.");
        }

        this._headers[header] = value;
        return this;
    }
}

