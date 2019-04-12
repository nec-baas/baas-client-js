import {_createError, _errorText, _promisify, Callbacks, JsonObject, nbError, nbLogger} from "./Head";
import {_node_require, http2} from "./NodeSupport";
import {Nebula} from "./Nebula";
import {User, UserJson} from "./User";
import {Group} from "./Group";
import {ObjectBucket} from "./ObjectBucket";
import {FileBucket} from "./FileBucket";
import {declarePushSender, PushSender} from "./push/PushSender";
import {CustomApi, declareCustomApi} from "./CustomApi";
import {Acl, AclGroup, AclPermission} from "./Acl";
import {HttpRequest} from "./HttpRequest";
import {Clause, RegexOption} from "./Clause";
import {ObjectQuery} from "./ObjectQuery";
import {FileMetadata} from "./FileMetadata";
import {BatchRequest} from "./BatchRequest";
import {AccountLink} from "./AccountLink";
import {_SdeRequest} from "./SdeRequest";
import {_SdeNetworkEventListener, NetworkEventListener} from "./SdeNetworkEventListener";
import {_SdeSyncEventListener} from "./SdeSyncEventListener";
import {declareUser} from "./UserDecl";
import {declareGroup} from "./GroupDecl";
import {declareObjectBucket} from "./ObjectBucketDecl";
import {declareFileBucket} from "./FileBucketDecl";

import {Promise} from "es6-promise";
import {Buffer} from "buffer";

declare var require: any;

/**
 * @class ローカルストレージ実装(In Memory, for Node.js)
 * @private
 */
export class LocalStorageInMemory {
    data: any;

    constructor() {
        this.data = {};
    }

    getItem(key: string): any {
        return this.data[key];
    }

    setItem(key: string, value: any): void {
        this.data[key] = value;
    }

    removeItem(key: string): void {
        delete this.data[key];
    }
}

/**
 * クライアント証明書オプション (Node.js only)
 * tls.connect() オプションのサブセット。
 * @private
 */
export interface ClientCertOptions {
    pfx?: string | Buffer;
    passphrase?: string;
    key?: string | string[] | Buffer | Buffer[];
    cert?: string | string[] | Buffer | Buffer[];
    ca?: string | Buffer | Array<string | Buffer>;
}

/**
 * @class _NebulaConfig オブジェクトクラス
 * @private
 */
export class NebulaConfig {
    tenant: string;
    appId: string;
    appKey: string;
    baseUri: string;
    offline = false;
    allowSelfSignedCert = false;
    serviceId: string;
    debugMode = "release";
    clientCertOptions: ClientCertOptions;
    // for http2 support
    enableHttp2: boolean = false;

    constructor(params: any) {
        this.tenant = params.tenant;
        this.appId = params.appId;
        this.appKey = params.appKey;
        this.baseUri = params.baseUri;

        if (this.tenant == null) throw new Error("No tenant");
        if (this.appId == null) throw new Error("No appId");
        if (this.appKey == null) throw new Error("No appKey");
        if (this.baseUri == null) throw new Error("No baseUri");

        if (this.baseUri.slice(-1) === "/") {
            this.baseUri = this.baseUri.slice(0, -1);
        }

        if (params.offline !== undefined && params.offline === true) {
            this.offline = params.offline;
        }

        if (params.allowSelfSignedCert !== undefined && params.allowSelfSignedCert === true) {
            this.allowSelfSignedCert = params.allowSelfSignedCert;
        }

        if (params.serviceId !== undefined) {
            this.serviceId = params.serviceId;
        }

        if (params.debugMode !== undefined) {
            this.debugMode = params.debugMode;
        }
        if (params.enableHttp2 !== undefined) {
            this.enableHttp2 = params.enableHttp2;
        }
    }
}

/**
 * BaaS初期化パラメータ
 */
export interface NebulaInitParam {
    tenant: string;
    appId: string;
    appKey: string;
    baseUri: string;
    offline?: boolean;
    allowSelfSignedCert?: boolean;
    serviceId?: string;
    debugMode?: string;
    enableHttp2?: boolean;
}

/**
 * プロキシサーバ設定
 */
export interface ProxyServer {
    host: string;
    port: number;
}

/**
 * @class NebulaService
 * @classdesc JavaScript SDK メインサービスクラス
 * @description NebulaService コンストラクタ。
 * <p>
 * NebulaService インスタンスを生成する。生成したインスタンス毎に異なるテナント/アプリに接続できる。
 * {@link Nebula} はデフォルトの NebulaService インスタンスである。
 * @example
 * var service2 = new Nebula.NebulaService();
 */
export class NebulaService {
    _config: NebulaConfig;

    [index:string]: any;

    // 以下は NebulaService に設定するエントリポイントの宣言
    User: typeof User;
    Group: typeof Group;
    ObjectBucket: typeof ObjectBucket;
    FileBucket: typeof FileBucket;
    CustomApi: typeof CustomApi;
    PushSender: typeof PushSender;

    Acl: typeof Acl;
    HttpRequest: typeof HttpRequest;
    NebulaService: typeof NebulaService;
    AclPermission: typeof AclPermission;
    AclGroup: typeof AclGroup;
    RegexOption: typeof RegexOption;
    Clause: typeof Clause;
    ObjectQuery: typeof ObjectQuery;
    FileMetadata: typeof FileMetadata;
    _SdeRequest: typeof _SdeRequest;
    _SdeNetworkEventListener: typeof _SdeNetworkEventListener;
    _SdeSyncEventListener: typeof _SdeSyncEventListener;
    BatchRequest: typeof BatchRequest;
    AccountLink: typeof AccountLink;

    _localStorage: any;

    /**
     * @memberOf NebulaService
     * @description バケットモード - オンラインモード
     * @const
     */
    BUCKET_MODE_ONLINE = 0;

    /**
     * @memberOf NebulaService
     * @description バケットモード - レプリカモード
     * @const
     */
    BUCKET_MODE_REPLICA = 1;

    /**
     * @memberOf NebulaService
     * @description バケットモード - ローカルモード
     * @const
     */
    BUCKET_MODE_LOCAL = 2;

    /** @private */
    constructor() {
        declareUser(this);
        declareGroup(this);
        declareObjectBucket(this);
        declareFileBucket(this);
        declareCustomApi(this);
        declarePushSender(this);

        // export all classes/namespaces
        this.NebulaService = NebulaService;
        this.HttpRequest = HttpRequest;
        this.AclPermission = AclPermission;
        this.AclGroup = AclGroup;
        this.Acl = Acl;
        this.RegexOption = RegexOption;
        this.Clause = Clause;
        this.ObjectQuery = ObjectQuery;
        this.FileMetadata = FileMetadata;
        this.BatchRequest = BatchRequest;
        this.AccountLink = AccountLink;

        // SDE
        this._SdeRequest = _SdeRequest;
        this._SdeNetworkEventListener = _SdeNetworkEventListener;
        this._SdeSyncEventListener = _SdeSyncEventListener;
    }

    /**
     * @description REST API のバージョン番号を返す
     * @private
     */
    getRestApiVersion(): number {
        return 1;
    }

    /**
     * @memberOf NebulaService
     * @description テナントIDを取得する
     * @return {string} テナントID
     */
    getTenantID(): string {
        if (this._config === undefined) {
            return null;
        } else {
            return this._config.tenant;
        }
    }

    /**
     * @memberOf NebulaService
     * @description エンドポイントURLを取得する
     * @return {string} エンドポイントURL
     */
    getBaseUri(): string {
        if (this._config === undefined) {
            return null;
        } else {
            return this._config.baseUri;
        }
    }

    /**
     * @memberOf NebulaService
     * @description アプリケーションIDを取得する
     * @return {string} アプリケーションID
     */
    getAppID(): string {
        if (this._config === undefined) {
            return null;
        } else {
            return this._config.appId;
        }
    }

    /**
     * @memberOf NebulaService
     * @description アプリケーションキーを取得する
     * @return {string} アプリケーションキー
     */
    getAppKey(): string {
        if (this._config === undefined) {
            return null;
        } else {
            return this._config.appKey;
        }
    }

    /**
     * @memberOf NebulaService
     * @description アプリケーションキーを変更する
     * @param {string} key アプリケーションキー
     * @return {NebulaService} this
     */
    setAppKey(key: string): NebulaService {
        if (!this._config) {
            throw new Error("Not initialized");
        }

        this._config.appKey = key;
        return this;
    }

    /**
     * @memberOf NebulaService
     * @description サービスIDを返す
     * @return {string} サービスID
     */
    getServiceID(): string {
        if (this._config === undefined) {
            return null;
        } else {
            return this._config.serviceId;
        }
    }

    /**
     * @memberOf NebulaService
     * @description ログ出力レベルを返す
     * @private
     */
    getDebugMode(): string {
        if (this._config === undefined) {
            return null;
        } else {
            return this._config.debugMode;
        }
    }

    /**
     * @memberOf NebulaService
     * @description オフライン機能の有効または無効を返す
     * @private
     */
    isOffline(): boolean {
        return this._config.offline;
    }

    /**
     * @memberOf NebulaService
     * @description 自己署名証明書の有効または無効を返す
     * SDE for SmartDevice、Node.js使用時(https Proxy未使用)の場合のみ有効
     * @private
     */
    isAllowSelfSignedCert(): boolean {
        return this._config.allowSelfSignedCert;
    }

    /**
     * @memberOf NebulaService
     * @description クライアント証明書の設定を行う (Node.js使用時のみ有効)。
     * <p>
     * https Proxyを使用する場合、本設定は無効である。NebulaService#setHttpsProxy()のoptionsに証明書の設定を行うこと。
     * @param {Object} certInfo 証明書情報
     * <p>pfxとpassphrase(またはkeyとcert),ca を指定する。
     * pfxとcert/keyを同時に指定した場合の動作は保証しない。
     * nullを指定した場合は証明書の設定を解除する。
     * @example
     * // p12(pfx)形式のクライアント証明書(証明書/秘密鍵)を指定、p12ファイルのパスフレーズを指定
     * // 信頼するCA証明書として、2件を指定する場合
     * service.setClientCertificate({
     *   pfx: fs.readFileSync('clientCertificate.p12'),
     *   passphrase: 'password',
     *   ca: [fs.readFileSync('caCert1.pem'), fs.readFileSync('caCert2.pem')]
     * });
     *
     * // pem形式のクライアント証明、キーを使用。CA証明書を1件指定
     * service.setClientCertificate({
     *   cert: fs.readFileSync('clientCert.pem'),
     *   key: fs.readFileSync('clientKey.pem'),
     *   ca: fs.readFileSync('caCert1.pem')
     * });
     * @return {NebulaService} this
     */
    setClientCertificate(certInfo: ClientCertOptions): NebulaService {
        this._config.clientCertOptions = certInfo;
        return this;
    }

    /**
     * @memberOf NebulaService
     * @description client証明書の設定が有効または無効を返す(Node.js使用時のみ有効)。
     * <p>
     * https Proxyを使用する場合、本設定は無効である。
     * @returns {boolean} 証明書設定済みならばtrue
     */
    isClientCertSet(): boolean {
        return (this._config.clientCertOptions != null);
    }

    /**
     * @memberOf NebulaService
     * @description カレントユーザのログイン情報を返す。
     * 未ログイン、またはセッショントークンが有効期限切れの場合は null を返す。
     * @returns {Object} ユーザ情報。_id, username, email, sessionToken, expire, options, groups フィールドが含まれる。
     */
    getCurrentUser(): UserJson {
        const _saveStr = this._localStorage.getItem(this._userItemKey());
        if (!_saveStr) {
            return null;
        }

        try {
            let _jsonObj: UserJson = JSON.parse(_saveStr);
            if (!("expire" in _jsonObj) || _jsonObj.expire < new Date().getTime() / 1000) {
                _jsonObj = null;
            }

            return _jsonObj;
        } catch (e) {
            nbLogger("Nebula.getCurrentUser#" + e.message);
            return null;
        }
    }

    /**
     * @memberOf NebulaService
     * @description カレントユーザのログイン情報をセットする。
     * <p>ブラウザでは local storage に永続化され、NebulaService 間で共有される。
     * Node.js では NebulaService 内(メモリ)に個別に保持される。
     * @param user {User} ユーザ
     * @return {NebulaService} this
     */
    setCurrentUser(user: User): NebulaService {
        const _saveObj = {
            _id: user._id,
            username: user.username,
            email: user.email,
            sessionToken: user.sessionToken,
            expire: user.expire,
            options: user.options,
            groups: user.groups
        };

        this._localStorage.setItem(this._userItemKey(), JSON.stringify(_saveObj));
        return this;
    }

    /**
     * @memberOf NebulaService
     * @description セッショントークンをセットする。セッショントークンの有効期限は無期限扱い。
     * <p>ユーザがログイン済みの場合は、セッショントークンのみが変更される。
     * 未ログインの場合は、ダミーユーザが保存される (セッショントークン以外のフィールドは空)。
     * <p>ブラウザでは local storage に永続化され、NebulaService 間で共有される。
     * Node.js では NebulaService 内(メモリ)に個別に保持される。
     * @param {string} sessionToken セッショントークン
     * @return {NebulaService} this
     */
    setSessionToken(sessionToken: string): NebulaService {
        const expire = new Date().getTime() / 1000 + (60 * 60 * 24 * 365 * 100);

        let _json = this.getCurrentUser();
        if (_json === null) { // not logged in
            _json = {
                _id: "",
                username: "",
                email: "",
                sessionToken,
                expire,
                options: {},
                groups: []

            };
        } else {
            // ログイン中の場合は sessionToken だけ入れ替える
            _json.sessionToken = sessionToken;
            _json.expire = expire;
        }

        this._localStorage.setItem(this._userItemKey(), JSON.stringify(_json));
        return this;
    }

    /**
     * @memberOf NebulaService
     * @description カレントユーザのログイン情報を破棄する
     * @return {NebulaService} this
     */
    removeCurrentUser(): NebulaService {
        this._localStorage.removeItem(this._userItemKey());
        return this;
    }

    _userItemKey(): string {
        const serviceId = this.getServiceID();

        // サービスIDが指定されている場合はその値をKeyの生成に使用
        if (serviceId !== undefined) {
            return this.getTenantID() + "_" + this.getAppID() + "_" + serviceId;
        } else {
            //nbLogger("serviceId is 'undefined'");
            return this.getTenantID() + "_" + this.getAppID();
        }
    }

    /**
     * @memberOf NebulaService
     * @description HTTP/2の有効/無効を返却する (Node.js使用時のみ有効)<br>
     * HTTP/2 を使用する場合は、Node.js v8.4 以上が必要。<br>
     * @returns {boolean} HTTP/2を使用する場合は trueを返却する。
     */
    getHttp2(): boolean {
        return this._config.enableHttp2;
    }

    /**
     * @memberOf NebulaService
     * @description HTTP2 の有効/無効を指定する。(Node.js使用時のみ有効)<br>
     * HTTP/2 を使用する場合は、Node.js v8.4 以上が必要。<br>
     * HTTP/2使用時は、Proxy({@link NebulaService#setHttpProxy}、{@link NebulaService#setHttpsProxy})は無効である。
     * @param {boolean} enable HTTP/2を使用する場合はtrueを設定する。
     */
    setHttp2(enable: boolean): void {
        this._config.enableHttp2 = enable;
    }

    /**
     * @memberOf NebulaService
     * @description MBaaS JavaScript SDK 初期化
     * <p>
     * ・MBaaS JavaScript SDK（以降、SDKと称す）を初期化する。<br>
     * ・アプリケーションは、SDK の初回利用またはパラメータ変更を行う際に呼び出さなければならない。
     * </pre>
     * @param {Object} params MBaaS JavaScript SDK 初期化パラメータ
     * <p>初期化パラメータをJSON 形式で指定する。JSONプロパティは以下の通り。
     *  <ul>
     *     <li>tenant (string) （必須）
     *       <p>テナント毎に割り当てられるユニークなID
     *     <li>appId  (string) （必須）
     *       <p>アプリケーション毎に割り当てられるユニークなID
     *     <li>appKey (string) (必須)
     *       <p>アプリケーション毎に割り当てられる秘密キー
     *     <li>baseUri (string)（必須）
     *       <p>MBaaS REST API のエンドポイントURL
     *     <li>offline (boolean)（オプション, 初期値：false）
     *       <p>オフライン機能の指定。
     *       <p>オフライン機能を利用する場合はtrue を指定する。
     *     <li>allowSelfSignedCert (boolean)（オプション, 初期値：false）
     *       <p>自己署名証明書の使用を認める指定。
     *       <p>オフラインモード使用時(SDE for SmartDevice使用時)、
     *       及びNode.js使用時(Https Proxy未使用時)のみ有効。
     *       (Node.jsでHttps Proxy使用時は、NebulaService#setHttpsProxy()を参照して設定を行うこと)
     *       <p>SSL接続に自己署名証明書を使用しているMBaaSサーバを
     *       利用する場合はtrue を指定する。
     *     <li>serviceId  (string)（オプション）
     *       <p>NebulaService毎に割り当てられるユニークなID
     *       <p>マルチテナント機能を使用して複数のNebulaService(インスタンス)を生成する場合等に使用。
     *       本IDはログイン情報キャッシュ時のKey情報に利用される。
     *     <li>debugMode (string)（オプション）
     *       <p>ログ出力レベル。
     *       <p>"release", "debug" のいずれかを指定
     *       <ul>
     *         <li>debug は、コンソール上にデバッグログを出力する。
     *         <li>release は、クリティカルなエラー以外のコンソール上にデバッグログを出力しない。
     *       </ul>
     *     <li>enableHttp2 (boolean)(オプション, 初期値: false)
     *       <p>HTTP/2使用設定
     *       <p>Node.js使用時(v8.4.0以降)のみ有効。
     *       通信にHTTP/2を利用する場合はtrueを指定する。
     * </ul>
     * @return {NebulaService} this
     */
    initialize(params: NebulaInitParam): NebulaService {
        this._config = new NebulaConfig(params);

        if (typeof localStorage !== 'undefined' && localStorage != null) {
            this._localStorage = localStorage;
        } else {
            // ブラウザのlocalStorageを使用できない場合はメモリ上にログインキャッシュ情報を保持する
            this._localStorage = new LocalStorageInMemory();
        }

        if (this._config.offline) {
            if (this !== Nebula) {
                // マルチテナントインスタンスはオフラインモード使用不可
                throw new Error("No offline mode supported for multi-tenant instance.");
            }
            try {
                const request = new _SdeRequest("Nebula", "initialize");

                const initializeParams = {
                    tenant: this.getTenantID(),
                    appId: this.getAppID(),
                    appKey: this.getAppKey(),
                    baseUri: this.getBaseUri(),
                    offline: this.isOffline(),
                    allowSelfSignedCert: this.isAllowSelfSignedCert(),
                    debugMode: this.getDebugMode(),
                    enableHttp2: this.getHttp2()
                };

                request.setData(initializeParams);

                request.execute().then(response => {
                    nbLogger("Nebula.initialize#Success");
                    nbLogger("Nebula.initialize#response = " + response);
                }).catch(error => {
                    nbLogger("Nebula.initialize#Error = " + _errorText(error));
                    this._config.offline = false;
                });
            } catch (e) {
                nbLogger("Nebula.initialize#" + e.message);
                this._config.offline = false;
            }
        }

        return this;
    }

    /**
     * @memberOf NebulaService
     * @description ログインキャッシュ有効期限の設定（オフライン機能限定）
     * <p>
     * ・オフライン用ログインキャッシュ有効期限を設定する。
     * @param {number} expire ログインキャッシュ有効期限（秒）
     * <p>ログインキャッシュ有効期限を指定する。
     * デフォルトは、「259200秒（72時間）」である。
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise<any>} Promise
     */
    setLoginCacheValidTime(expire: number, callbacks?: Callbacks): Promise<void> {
        nbLogger("Nebula.setLoginCacheValidTime#start");

        if (expire <= 0) {
            throw new Error("Nebula.setLoginCacheValidTime: bad expire");
        }

        if (!this.isOffline()) {
            throw new Error("Not offline mode!");
        }
        const request = new _SdeRequest("Nebula", "setLoginCacheValidTime");

        const setLoginCacheValidTimeParams = {
            expire
        };

        request.setData(setLoginCacheValidTimeParams);

        const promise = request.execute().then(() => {
            nbLogger("Nebula.setLoginCacheValidTime#Success");
            return;
        }).catch(error => {
            nbLogger(("Nebula.setLoginCacheValidTime#error = " + (_errorText(error))));
            return Promise.reject(error);
        });

        nbLogger("Nebula.setLoginCacheValidTime#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf NebulaService
     * @description ログインキャッシュ有効期限の取得（オフライン機能限定）
     * <p>
     * ・オフライン用ログインキャッシュ有効期限を取得する。
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise<any>} Promise
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ログインキャッシュ有効期限（秒）
     * <li>失敗時: エラー要因(JSON)
     * </ul>
     */
    getLoginCacheValidTime(callbacks?: Callbacks): Promise<number> {
        nbLogger("Nebula.getLoginCacheValidTime#start");

        if (!this.isOffline()) {
            throw new Error("Not offline mode!");
        }

        const request = new _SdeRequest("Nebula", "getLoginCacheValidTime");

        const promise = request.execute().then(response => {
            nbLogger("Nebula.getLoginCacheValidTime#Success");

            let jsonObj: JsonObject;
            try {
                jsonObj = JSON.parse(response);
            } catch (e) {
                nbError("Nebula.getLoginCacheValidTime#" + e.message);
                jsonObj = null;
            }

            if (jsonObj !== null) {
                return Promise.resolve(jsonObj.expire);
            } else {
                const error = _createError(400, "Bad Response", "Response json error.");
                return Promise.reject(error);
            }
        }).catch(error => {
            nbLogger("Nebula.getLoginCacheValidTime#error callback start");
            nbLogger(("Nebula.getLoginCacheValidTime#error = " + (_errorText(error))));
            return Promise.reject(error);
        });

        nbLogger("Nebula.getLoginCacheValidTime#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf NebulaService
     * @description ネットワークイベントリスナの登録（オフライン機能限定）
     * <p>
     * ・ネットワークの接続状態変更イベントを受け取るリスナーを設定する。
     * @param {Object} listener ネットワークイベントリスナ
     * <ul>
     * <li>listener には、イベント発生時のコールバックを指定する。
     * <pre>
     *     {
     *         onNetworkStateChanged : function(isOnline) {
     *             // ネットワークの接続状態が変更されたときに呼び出される
     *             // isOnline : trueはオンライン状態、falseはオフライン状態
     *         }
     *     }
     * </pre>
     * <li>すでに登録している場合は、上書きされる。
     * <li>登録を取り消す場合は、listener に null を指定する。
     * </ul>
     * @return {NebulaService} this
     */
    setNetworkEventListener(listener: NetworkEventListener): NebulaService {
        nbLogger("Nebula.setNetworkEventListener#start");
        let paramOk = false;
        if (arguments.length === 1) {
            if (listener != null) {
                if (listener.onNetworkStateChanged !== undefined) {
                    paramOk = true;
                }
            }

            if (listener === null) {
                paramOk = true;
            }
        }

        if (!paramOk) {
            nbError("Nebula.setNetworkEventListener#invalid parameter.");
            return;
        }

        if (this.isOffline()) {
            _SdeNetworkEventListener.setCallback(listener);
        } else {
            nbLogger("Nebula.setNetworkEventListener#Disabled Offline");
        }

        nbLogger("Nebula.setNetworkEventListener#end");
        return this;
    }

    /**
     * @memberOf NebulaService
     * @description HTTP プロキシを設定する (Node.js専用)。
     * <p>
     * 注: 本設定はグローバル設定である(NebulaService毎ではない)
     * @param {Object} proxy プロキシ設定。host, port を指定する。
     * @example
     * Nebula.setHttpProxy({ host: 'proxysv.example.com', port: 8080});
     */
    setHttpProxy(proxy: ProxyServer): void {
        let agent: object = null;
        if (proxy != null) {
            NebulaService.verifyProxy(proxy);
            agent = _node_require('tunnel-fork').httpOverHttp({proxy});
        }
        HttpRequest.setProxy(proxy);
        HttpRequest.setHttpAgent(agent);
    }

    /**
     * @memberOf NebulaService
     * @description HTTPS プロキシを設定する (Node.js専用)。
     * <p>
     * 注: 本設定はグローバル設定である(NebulaService毎ではない)
     * @param {Object} proxy プロキシ設定。host, port を指定する。
     * @param {Object} options https.request() に引き渡すオプション(省略可)。
     * <p>
     * クライアント証明書認証に使用する証明書の設定などを行う。
     * 使用方法はExampleを参照のこと。
     * @example
     * // https Proxyを指定する
     * Nebula.setHttpsProxy({ host: 'proxysv.example.com', port: 8080});
     *
     * // p12(pfx)形式のクライアント証明書(証明書/秘密鍵)を指定、p12ファイルのパスフレーズを指定
     * // 信頼するCA証明書として、2件を指定する場合
     * Nebula.setHttpsProxy({ host: 'proxysv.example.com', port: 8080},
     * {
     *   pfx: fs.readFileSync('clientCertificate.p12'),
     *   passphrase: 'password',
     *   ca: [fs.readFileSync('caCert1.pem'), fs.readFileSync('caCert2.pem')]
     * });
     *
     * // pem形式のクライアント証明、キーを使用。CA証明書を1件指定
     * Nebula.setHttpsProxy({ host: 'proxysv.example.com', port: 8080},
     * {
     *   cert: fs.readFileSync('clientCert.pem'),
     *   key: fs.readFileSync('clientKey.pem'),
     *   ca: fs.readFileSync('caCert1.pem')
     * });
     *
     * // 自己署名証明書を使用しているサーバへの接続を許可する
     * Nebula.setHttpsProxy({ host: 'proxysv.example.com', port: 8080},
     * {
     *   rejectUnauthorized: false
     * });
     */
    setHttpsProxy(proxy: ProxyServer, options?: JsonObject): void {
        let agent: any = null;
        if (proxy != null) {
            if(options == null) {
                options = {};
            }
            options.proxy =  proxy as any;
            NebulaService.verifyProxy(proxy);
            agent = _node_require('tunnel-fork').httpsOverHttp(options);
            agent.defaultPort = 443;
        }
        HttpRequest.setProxy(proxy);
        HttpRequest.setHttpsAgent(agent, options);
    }

    private static verifyProxy(proxy: ProxyServer): void {
        if (typeof proxy !== 'object') {
            throw new Error("Bad proxy: not object");
        }
        if (proxy.host == null || typeof proxy.host !== "string") {
            throw new Error("Bad proxy: host");
        }
        if (proxy.port == null || typeof proxy.port !== "number") {
            throw new Error("Bad proxy: port");
        }
    }
}
