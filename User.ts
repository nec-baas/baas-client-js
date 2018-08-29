import {NebulaService} from "./NebulaService";
import {Nebula} from "./Nebula";
import {_createError, _errorText, _promisify, Callbacks, JsonObject, nbError, nbLogger} from "./Head";
import {_SdeRequest} from "./SdeRequest";
import {ApiRequest, HttpRequest, QueryParams} from "./HttpRequest";
import {AccountLink} from "./AccountLink";

import {Promise} from "es6-promise";

export interface LoginInfo {
    username?: string;
    email?: string;
    token?: string;
    password?: string;
}

export interface UserJson {
    _id?: string;
    username?: string;
    email?: string;
    password?: string;
    options?: JsonObject;
    groups?: string[];
    createdAt?: string;
    updatedAt?: string;
    lastLoginAt?: string;
    etag?: string;
    sessionToken?: string;
    expire?: number;
    clientCertUser?: boolean;
    federated?: boolean;
    token?: string; // login() argument でのみ使用
    primaryLinkedUserId?: string;

    [index: string]: any;
}

export interface UserQuery {
    _id?: string;
    username?: string;
    email?: string;
    skip?: number;
    limit?: number;
    countQuery?: boolean;
}

/**
 * User 基底クラス
 * @private
 */
export class User implements UserJson {
    _service: NebulaService;

    private __id: string;
    private _username: string;
    private _email: string;
    private _password: string;
    private _options: JsonObject;
    private _groups: string[];
    private _createdAt: string;
    private _updatedAt: string;
    private _lastLoginAt: string;
    private _etag: string;
    private _sessionToken: string;
    private _expire: number;
    private _clientCertUser: boolean;
    private _federated: boolean;
    private _primaryLinkedUserId: string;

    [index: string]: any;

    /**
     * @class User
     * @classdesc ユーザ管理 クラス
     * @description ユーザオブジェクトを生成する。
     * <p>
     * 生成しただけの状態では、まだサーバには登録されていない。ユーザ登録は {@link User#register} で実施する。
     * @example
     *     var user = new Nebula.User();
     * @return {Object} 新規ユーザオブジェクトのインスタンス
     */
    constructor(service: NebulaService = Nebula) {
        this._service = service;
        this.__id = null;
        this._username = null;
        this._email = null;
        this._password = null;
        this._options = null;
        this._groups = null;
        this._createdAt = null;
        this._updatedAt = null;
        this._lastLoginAt = null;
        this._etag = null;
        this._sessionToken = null;
        this._expire = null;
        this._clientCertUser = null;
        this._federated = false;
        this._primaryLinkedUserId = null;
    }

    /**
     * ユーザID
     * @type String
     * @name User#_id
     */
    get _id():string { return this.__id; }
    set _id(value: string) { this.__id = value; }

    /**
     * ユーザ名
     * @type String
     * @name User#username
     */
    get username():string { return this._username; }
    set username(value: string) { this._username = value; }

    /**
     * E-mail アドレス
     * @type String
     * @name User#email
     */
    get email(): string { return this._email; }
    set email(value: string) { this._email = value; }

    /**
     * パスワード
     * @type String
     * @name User#password
     */
    get password(): string { return this._password; }
    set password(value: string) { this._password = value; }

    /**
     * オプション (JSON)
     * @type Object
     * @name User#options
     */
    get options(): JsonObject { return this._options; }
    set options(value: JsonObject) { this._options = value; }

    /**
     * 所属グループ一覧 (read only)
     * @type String[]
     * @name User#groups
     */
    get groups(): string[] { return this._groups; }
    set groups(value: string[]) { this._groups = value; }

    /**
     * 作成日時
     * @type String
     * @name User#createdAt
     */
    get createdAt(): string { return this._createdAt; }
    set createdAt(value: string) { this._createdAt = value; }

    /**
     * 更新日時
     * @type String
     * @name User#updatedAt
     */
    get updatedAt(): string { return this._updatedAt; }
    set updatedAt(value: string) { this._updatedAt = value; }

    /**
     * 最終ログイン日時
     * @type String
     * @name User#lastLoginAt
     */
    get lastLoginAt(): string { return this._lastLoginAt; }
    set lastLoginAt(value: string) { this._lastLoginAt = value; }

    /**
     * ETag
     * @type String
     * @name User#etag
     */
    get etag(): string { return this._etag; }
    set etag(value: string) { this._etag = value; }

    /**
     * セッショントークン
     * @type String
     * @name User#sessionToken
     */
    get sessionToken(): string { return this._sessionToken; }
    set sessionToken(value: string) { this._sessionToken = value; }

    /**
     * セッショントークン有効期限(unix time [秒])
     * @type String
     * @name User#expire
     */
    get expire(): number { return this._expire; }
    set expire(value: number) { this._expire = value; }

    /**
     * クライアント証明書認証ユーザの場合は true<br>
     * (ブラウザ、またはNode.jsのみ対応)
     * @type boolean
     * @name User#clientCertUser
     */
    get clientCertUser(): boolean { return this._clientCertUser; }
    set clientCertUser(value: boolean) { this._clientCertUser = value; }

    /**
     * 外部認証連携有りの場合は true<br>
     * (ブラウザ、またはNode.jsのみ対応)
     * @type boolean
     * @name User#federated
     * @default false
     */
    get federated(): boolean { return this._federated; }
    set federated(value: boolean) { this._federated = value; }

    /**
     * プライマリリンクユーザID<br>
     * OpenID Connect認証でユーザ自動生成時のリンクユーザID<br>
     * (ブラウザ、またはNode.jsのみ対応)
     * @type String
     * @name User#primaryLinkedUserId
     * @default null
     */
    get primaryLinkedUserId(): string { return this._primaryLinkedUserId; }
    set primaryLinkedUserId(value: string) { this._primaryLinkedUserId = value; }


    protected _setUserInfo(response: string) {
        nbLogger("User._setUserInfo#start");

        let jsonObj: UserJson;
        try {
            jsonObj = JSON.parse(response);
        } catch (undefined) {
            nbError("User._setUserInfo#json error.");
            jsonObj = null;
        }

        if (jsonObj !== null) {
            if (jsonObj._id !== undefined) {
                this._id = jsonObj._id;
            }
            if (jsonObj.username !== undefined) {
                this.username = jsonObj.username;
            }
            if (jsonObj.email !== undefined) {
                this.email = jsonObj.email;
            }
            if (jsonObj.password !== undefined) {
                this.password = jsonObj.password;
            }
            if (jsonObj.options !== undefined) {
                this.options = jsonObj.options;
            }
            if (jsonObj.groups !== undefined) {
                this.groups = jsonObj.groups;
            }
            if (jsonObj.createdAt !== undefined) {
                this.createdAt = jsonObj.createdAt;
            }
            if (jsonObj.updatedAt !== undefined) {
                this.updatedAt = jsonObj.updatedAt;
            }
            if (jsonObj.lastLoginAt !== undefined) {
                this.lastLoginAt = jsonObj.lastLoginAt;
            }
            if (jsonObj.etag !== undefined) {
                this.etag = jsonObj.etag;
            }
            if (jsonObj.sessionToken !== undefined) {
                this.sessionToken = jsonObj.sessionToken;
            }
            if (jsonObj.expire !== undefined) {
                this.expire = jsonObj.expire;
            }
            if (jsonObj.clientCertUser !== undefined) {
                this.clientCertUser = jsonObj.clientCertUser;
            }
            if (jsonObj.federated !== undefined) {
                this.federated = jsonObj.federated;
            }
            if (jsonObj.primaryLinkedUserId !== undefined) {
                this.primaryLinkedUserId = jsonObj.primaryLinkedUserId;
            }
        }
    }

    /**
     * @method
     * @memberOf User
     * @description ユーザプロパティ設定 (Deprecated)
     * <p>
     * ・ユーザオブジェクトのプロパティを設定する。<br>
     * ・設定可能なプロパティの詳細は、各メソッドの説明を参照のこと。<br>
     * ・本メソッドは deprecated である。各フィールドの setter を直接使用すること。<br>
     * @param {String} property プロパティ名。
     * 指定可能なプロパティ名は以下のとおり。
     * <ul>
     *     <li>_id :         ユーザID
     *     <li>username:     ユーザ名
     *     <li>email:        E-mailアドレス
     *     <li>password:     パスワード
     *     <li>options:      オプション情報 (JSON)
     *     <li>createdAt:    ユーザ登録日時
     *     <li>updatedAt:    ユーザ更新日時
     *     <li>sessionToken: セッショントークン
     *     <li>expire:       セッショントークン有効期限(unix time [秒])
     *     <li>clientCertUser: クライアント証明書ユーザ (ブラウザ、またはNode.jsのみ対応)
     *     <li>federated:    外部認証連携有無
     *     <li>primaryLinkedUserId: プライマリリンクユーザID
     * </ul>
     * @param {String} value プロパティ値
     * @return {User} this
     * @deprecated
     */
    set(property: string, value: any): void {
        switch (property) {
            case "_id":
                this._id = value;
                break;
            case  "username":
                this.username = value;
                break;
            case "email":
                this.email = value;
                break;
            case "password":
                this.password = value;
                break;
            case "options":
                this.options = value;
                break;
            case "createdAt":
                this.createdAt = value;
                break;
            case "updatedAt":
                this._updatedAt = value;
                break;
            case "sessionToken":
                this.sessionToken = value;
                break;
            case "expire":
                this.expire = value;
                break;
            case "clientCertUser":
                this.clientCertUser = value;
                break;
            case "federated":
                this.federated = value;
                break;
            case "primaryLinkedUserId":
                this.primaryLinkedUserId = value;
                break;

            default:
                nbError("Invalid property: " + property);
                throw new Error("Invalid property: " + property);
        }
    }

    /**
     * @method
     * @memberOf User
     * @description ユーザプロパティ取得 (Deprecated)
     * <p>
     * ・ユーザオブジェクトのプロパティを取得する。<br>
     * ・取得可能なプロパティの詳細は、各メソッドの説明を参照のこと。<br>
     * ・本メソッドは deprecated である。各フィールドの getter を直接使用すること。
     * @param {String} property プロパティ名。
     * 指定可能なプロパティ名は以下のとおり(APIによって取得可能なプロパティは異なる)。
     * <ul>
     *     <li>_id :         ユーザID
     *     <li>username:     ユーザ名
     *     <li>email:        E-mailアドレス
     *     <li>password:     パスワード
     *     <li>options:      オプション情報 (JSON)
     *     <li>groups:       所属グループ一覧 (配列)
     *     <li>createdAt:    ユーザ登録日時
     *     <li>updatedAt:    ユーザ更新日時
     *     <li>sessionToken: セッショントークン
     *     <li>expire:       セッショントークン有効期限(unix time [秒])
     *     <li>clientCertUser: クライアント証明書ユーザ (ブラウザ、またはNode.jsのみ対応)
     *     <li>federated:    外部認証連携有無
     *     <li>primaryLinkedUserId: プライマリリンクユーザID
     * </ul>
     * @return {String} value プロパティ値
     * @deprecated
     */
    get(property: string): any {
        switch (property) {
            case "_id":
                return this._id;
            case "username":
                return this.username;
            case "email":
                return this.email;
            case "password":
                return this.password;
            case "options":
                return this.options;
            case "groups":
                return this.groups;
            case "createdAt":
                return this.createdAt;
            case "updatedAt":
                return this.updatedAt;
            case "sessionToken":
                return this.sessionToken;
            case "expire":
                return this.expire;
            case "clientCertUser":
                return this.clientCertUser;
            case "federated":
                return this.federated;
            case "primaryLinkedUserId":
                return this.primaryLinkedUserId;

            default:
                nbError("Invalid property");
                throw new Error("Invalid property name");
        }
    }

    /**
     * @method
     * @memberOf User
     * @description ユーザを登録する。
     * <p>
     * ユーザ登録に必要なユーザプロパティは、以下の通り。
     * <ul>
     *     <li>email     : E-mailアドレス（必須）
     *     <li>password  : パスワード（必須）
     *     <li>username  : ユーザ名（オプション）
     *     <li>options   : オプション(オプション)。JSON形式で記述された任意のオブジェクトを指定できる。
     * </ul>
     *  クライアント証明書認証用のユーザの登録を行う場合のユーザプロパティは以下の通りとする
     *  clientCertUserをtrueに設定した場合、email/passwordは無視する。
     *  (ブラウザ、またはNode.jsのみ対応)
     * <ul>
     *     <li>username          : ユーザ名（必須）
     *     <li>clientCertUser    : クライアント証明書ユーザ trueを設定すること(必須)
     *     <li>options           : オプション(オプション) optionsには、JSON形式で記述された任意のオブジェクトを指定できる。
     *  </ul>
     * @param {Callbacks} callbacks 応答コールバック。
     * <p>
     * 処理が成功した場合、success の呼び出しにて通知する。
     * なお、処理が成功した状態ではまだログインは実施していない。
     * 引数は以下の通り。
     * <pre>
     *     user : ユーザオブジェクトのインスタンス
     *     処理の成功により、以下のユーザオブジェクトのプロパティが追加格納される
     *         (プロパティ名)
     *         _id         : 登録したユーザのID
     *         createdAt   : 登録日付
     *         updatedAt   : 最終更新日付
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    register(callbacks?: Callbacks): Promise<User> {
        nbLogger("User.register#start");

        let request: ApiRequest;
        if (this._service.isOffline()) {
            request = new _SdeRequest("NebulaUser", "register");
        } else {
            const path = "/users";
            nbLogger("User.register#REST API Request path = " + path);
            request = new HttpRequest(this._service, path);
            request.setMethod("POST");
            request.setContentType("application/json");
        }

        let registerParams: JsonObject;
        if (this.clientCertUser === true) {
            registerParams = {
                clientCertUser: true,
                username: this.username
            };
        } else {
            registerParams = {
                email: this.email,
                password: this.password
            };
            if (this.username != null) {
                registerParams.username = this.username;
            }
        }

        if (this.options !== null) {
            registerParams.options = this.options;
        }

        request.setData(registerParams);

        const promise = request.execute()
                .then((response) => {
                    nbLogger("User.register#success callback start");
                    nbLogger("User.register#response = " + response);
                    this._setUserInfo(response);
                    return this;
                })
                .catch((error) => {
                    nbLogger("User.register#error callback start");
                    nbLogger(("User.register#error = " + (_errorText(error))));
                    return Promise.reject(error);
                });

        nbLogger("User.register#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @method
     * @memberOf User
     * @description ログイン
     * @param {Object} userInfo ユーザ情報。
     * JSON 形式で指定する。null は指定できない。
     * <pre>
     *     {
     *         "email"         : "foo@example.com",
     *         "password"      : "passwOrd"
     *     }
     *  </pre>
     * <pre>
     *     {
     *         "token"         : "TOKEN"
     *     }
     *  </pre>
     *  <ul>
     *     <li>email       : E-mailアドレス（※）
     *     <li>username    : ユーザ名（※）
     *     <li>token       : ワンタイムトークン（※）
     *     <li>password    : パスワード（E-mailアドレス、ユーザ名指定時は必須）
     *   </ul>
     *  (Y) email か username か token のいずれかを指定する。
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(user)
     *             user : ログインしたユーザオブジェクトのインスタンス
     *             処理の成功により、以下のユーザオブジェクトのプロパティが格納される
     *                 (プロパティ名)
     *                 _id          : ログインしたユーザのID
     *                 sessionToken : セッショントークン
     *                 expire       : ログインの有効期限 (unix time [秒])
     *                 (以下の情報はオフライン機能無効時のみ取得可)
     *                 username     : ユーザ名
     *                 email        : E-mail
     *                 options      : オプション情報(JSON)
     *                 groups       : ユーザが所属するグループ名の配列
     *                 createdAt    : ユーザの作成日時
     *                 updatedAt    : ユーザの更新日時
     *                 lastLoginAt  : ユーザの最終ログイン日時
     *                 etag         : ETag
     *                 federated    : 外部認証連携有無
     *                 primaryLinkedUserId : プライマリリンクユーザID
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static login(userInfo: LoginInfo, callbacks?: Callbacks): Promise<User> { return null; }

    protected static _login(service: NebulaService, userInfo: LoginInfo, callbacks?: Callbacks): Promise<User> {
        nbLogger("User.login#start");
        if (userInfo == null || (userInfo.email == null && userInfo.username == null && userInfo.token == null)) {
            throw new Error("User.login: No username nor email nor token");
        }
        if (userInfo.password == null && userInfo.token == null) {
            throw new Error("User.login: No password nor token");
        }

        let request: ApiRequest;
        if (service.isOffline()) {
            request = new _SdeRequest("NebulaUser", "login");
        } else {
            const path = "/login";
            nbLogger("User.login#REST API Request path = " + path);
            request = new HttpRequest(service, path);
            request.setSessionToken(null);
            request.setMethod("POST");
            request.setContentType("application/json");
        }

        request.setData(userInfo);

        const user = new service.User();

        // Native Bridge では response に _id, session token, expire しか
        // 入らないため、それ以外のパラメータはここで設定しておく。
        user.email = userInfo.email;
        user.username = userInfo.username;

        const promise = request.execute()
            .then((response) => {
                nbLogger("User.login#success callback start");
                nbLogger("User.login#response = " + response);
                user._setUserInfo(response);
                service.setCurrentUser(user);
                return user;
            })
            .catch((error) => {
                nbLogger("User.login#error callback start");
                nbLogger(("User.login#error = " + (_errorText(error))));
                return Promise.reject(error);
            });

        nbLogger("User.login#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @method
     * @memberOf User
     * @description ログアウト
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success()
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static logout(callbacks?: Callbacks): Promise<void> { return null; }

    protected static _logout(service: NebulaService, callbacks?: Callbacks): Promise<void> {
        nbLogger("User.logout#start");

        let request: ApiRequest;
        if (service.isOffline()) {
            request = new _SdeRequest("NebulaUser", "logout");
        } else {
            const path = "/login";
            nbLogger("User.logout#REST API Request path = " + path);
            request = new HttpRequest(service, path);
            request.setMethod("DELETE");
            request.setContentType("application/json");
        }

        const promise = request.execute()
                .then((response) => {
                    nbLogger("User.logout#success callback start");
                    nbLogger("User.logout#response = " + response);
                    service.removeCurrentUser();
                    return;
                })
                .catch((error) => {
                    nbLogger("User.logout#error callback start");
                    nbLogger(("User.logout#error = " + (_errorText(error))));
                    service.removeCurrentUser();
                    return Promise.reject(error);
                });

        nbLogger("User.logout#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @method
     * @memberOf User
     * @description カレントユーザ取得
     * <p>
     * ・カレント（ログイン中）のユーザを取得する。<br>
     * ・本情報はクライアントにキャッシュされている情報のため、サーバの最新情報とは一致しない場合がある。
     * @param {Callbacks} callbacks 応答コールバック (Deprecated)
     * <pre>
     * ・callbacks は、成功時と失敗時の応答コールバックを指定する。
     *   callbacks 引数は後方互換性維持のためにのみ存在するので、通常指定する必要はない。
     *     {
     *         success : function(user) {
     *             // 成功時の処理
     *         },
     *         error : function(error) {
     *             // 失敗時の処理
     *         }
     *     }
     * ・処理が成功した場合、success コールバックを呼び出す。引数は、返り値と同じ。
     * ・本 API は失敗することはないため、error が呼ばれることはない。
     * </pre>
     * @return {User} ユーザオブジェクトのインスタンス。カレントユーザが存在しない場合は null が返る。
     * <p>
     * 返り値に設定されるプロパティは以下のとおり。
     * <ul>
     *     <li>_id          : ユーザID
     *     <li>sessionToken : セッショントークン
     *     <li>expire       : セッショントークン有効期限 (unix time [秒])
     * </ul>
     * 以下の情報はオフライン機能無効時のみ取得可
     * <ul>
     *     <li>username     : ユーザ名
     *     <li>email        : E-mailアドレス
     *     <li>options      : オプション
     *     <li>groups       : 所属グループ一覧
     * </ul>
     */
    static current(callbacks?: Callbacks): User { return null; }

    protected static _current(service: NebulaService, callbacks?: Callbacks): User {
        let user: User = null;
        const _currentObj = service.getCurrentUser();

        if (_currentObj !== null) {
            user = new service.User();
            user._setUserInfo(JSON.stringify(_currentObj));
        }

        if (callbacks && callbacks.success) {
            callbacks.success(user);
        }

        return user;
    }

    /**
     * @method
     * @memberOf User
     * @description カレントユーザ強制設定
     * <p>
     * ・カレント（ログイン中）のユーザを強制設定する。<br>
     * ・すでにカレントユーザが存在する(ログイン中)の場合は、指定したプロパティだけが上書きされる。<br>
     * ・本情報はクライアントにキャッシュされる。<br>
     * ・本 API はオフラインモードでは使用できない。<br>
     * ・本 API は通常のアプリケーションで使用するべきものではない。<br>
     * @param {Object} userInfo ユーザ情報(JSON)。null を指定した場合は、カレントユーザを削除する。
     * <p>
     * userInfo の書式は以下の通りとする。
     * 指定したプロパティだけが上書き設定される。
     * <ul>
     *     <li>_id          : ユーザID
     *     <li>sessionToken : セッショントークン
     *     <li>expire       : セッショントークン有効期限 (unix time [秒])
     *     <li>username     : ユーザ名
     *     <li>email        : E-mailアドレス
     *     <li>options      : オプション
     *     <li>groups       : 所属グループ一覧
     * </ul>
     */
    static saveCurrent(userInfo: UserJson): void {}

    protected static _saveCurrent(service: NebulaService, userInfo: UserJson): void {
        if (service.isOffline()) {
            throw new Error("Not supported in offline mode");
        }

        if ((userInfo === null)) {
            service.removeCurrentUser();
        } else {
            const newInfo = service.getCurrentUser() || {};
            for (const key in userInfo) {
                if (userInfo.hasOwnProperty(key)) {
                    newInfo[key] = userInfo[key];
                }
            }

            const user = new service.User();
            user._setUserInfo(JSON.stringify(newInfo));
            service.setCurrentUser(user);
        }
    }

    /**
     * @method
     * @memberOf User
     * @description カレントユーザ取得(サーバ問合せ)
     * <p>
     * ・カレント（ログイン中）のユーザを取得する。サーバへの問い合わせが発生する。
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(user)
     *             user : ユーザオブジェクトのインスタンス。
     *             カレントユーザが存在しない場合は、null が返る。
     *         　　user に設定されるプロパティは以下のとおり。
     *                 (プロパティ名)
     *                 _id         : ユーザID
     *                 username    : ユーザ名
     *                 email       : E-mailアドレス
     *                 options     : オプション
     *                 groups      : 所属グループ一覧 (注: '_id' を指定して検索した場合のみ。オフライン機能有効時は無効。)
     *                 createdAt   : ユーザ登録日時
     *                 updatedAt   : 最終更新日時
     *                 lastLoginAt : 最終ログイン日時
     *                 etag        : ETag
     *                 federated   : 外部認証連携有無
     *                 primaryLinkedUserId : プライマリリンクユーザID
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static queryCurrent(callbacks?: Callbacks): Promise<User> { return null; }

    protected static _queryCurrent(service: NebulaService, callbacks?: Callbacks): Promise<User> {
        nbLogger("User.queryCurrent#start");

        let request: ApiRequest;
        if (service.isOffline()) {
            const _currentObj = service.getCurrentUser();
            if (_currentObj === null) {
                return _promisify(Promise.resolve(null), callbacks);
            }
            request = new _SdeRequest("NebulaUser", "current");
        } else {
            const path = "/users/current";
            nbLogger("User.queryCurrent#REST API Request path = " + path);
            request = new HttpRequest(service, path);
            // REST APIは、session tokenが必須だが、クライアント証明書認証の
            // セッショントークンが付与されないことがあるため、optional扱いとする
            // request.setSessionToken(_currentObj.sessionToken);
            request.setMethod("GET");
            request.setContentType("application/json");
        }

        const promise = request.execute()
                .then((response) => {
                    nbLogger("User.queryCurrent#success callback start");
                    nbLogger("User.queryCurrent#response = " + response);
                    const user = new service.User();
                    user._setUserInfo(response);
                    return user;
                })
                .catch((error) => {
                    nbLogger("User.queryCurrent#error callback start");
                    nbLogger(("User.queryCurrent#error = " + (_errorText(error))));
                    return Promise.reject(error);
                });

        nbLogger("User.queryCurrent#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @method
     * @memberOf User
     * @description ユーザ検索
     * @param {Object} conditions 検索条件。<p>
     * JSON 形式で指定する。省略した場合は全件検索となる。
     * 検索用プロパティは以下の通り。
     * <ul>
     *     <li>_id        : ユーザのID（※）
     *     <li>email      : E-mailアドレス（※）
     *     <li>username   : ユーザ名（※）
     *     <li>skip       : スキップカウント
     *     <li>limit      : 件数上限(0は無制限、デフォルトは100)
     *     <li>countQuery : 全件検索時に全件数をカウントする場合は true (デフォルトは false)
     * </ul>
     * (※) _id かemail かusername のいずれか1つを指定する。
     * いずれも指定しない場合は全件検索となる。
     * 全件検索時は skip/limit で検索範囲を指定する。
     * (ただし skip/limit はオフライン有効時は無効)
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     conditions.countQuery が false の場合、success の書式は以下の通りとなる。
     *         success(users)
     *             users : 取得したユーザオブジェクトインスタンスの配列
     *             処理の成功により、配列毎に以下のユーザオブジェクトのプロパティが更新される
     *                 (プロパティ名)
     *                 username    : ユーザ名
     *                 email       : E-mailアドレス
     *                 options     : オプション
     *                 groups      : 所属グループ一覧 (注: '_id' を指定して検索した場合のみ。オフライン機能有効時は無効。)
     *                 createdAt   : ユーザ登録日付
     *                 updatedAt   : 最終更新日付
     *                 lastLoginAt : 最終ログイン日時(マスターキー使用時のみ)
     *                 etag        : ETag
     *                 federated   : 外部認証連携有無
     *                 primaryLinkedUserId : プライマリリンクユーザID
     *
     *     conditions.countQuery が true の場合、success の書式は以下の通りとなる。
     *         success(json)
     *             json.users : 取得したユーザオブジェクトインスタンスの配列。内容は上記 users と同じ。
     *             json.count : 全件数
     *
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static query(conditions: UserQuery, callbacks?: Callbacks): Promise<User[]> { return null; }

    protected static _query(service: NebulaService, conditions: UserQuery, callbacks?: Callbacks): Promise<User[]> {
        nbLogger("User.query#start");

        let request: ApiRequest;
        if (service.isOffline()) {
            request = new _SdeRequest("NebulaUser", "query");

            if (conditions !== null) {
                request.setData(conditions);
            }
        } else {
            let path = "/users";
            const queryParams: JsonObject = {};

            if (conditions) {
                if (conditions._id) {
                    path = "/users/" + encodeURIComponent(conditions._id);
                } else if (conditions.email) {
                    queryParams.email = conditions.email;
                } else if (conditions.username) {
                    queryParams.username = conditions.username;
                }
                if (conditions.skip != null) {
                    queryParams.skip = conditions.skip;
                }
                if (conditions.limit != null) {
                    queryParams.limit = conditions.limit;
                }
            } // note: conditions 不正時は例外を throw する


            nbLogger("User.query#REST API Request path = " + path);
            request = new HttpRequest(service, path);
            request.setMethod("GET");
            request.setQueryParams(queryParams);
            request.setContentType("application/json");
        }

        const promise = request.execute()
                .then((response) => {
                    nbLogger("User.query#success callback start");
                    nbLogger("User.query#response = " + response);
                    const obj = JSON.parse(response);
                    let objArray: JsonObject[] = [];
                    const userArray: User[] = [];
                    let i = 0;

                    if (obj.results === undefined) {
                        objArray.push(obj);
                    } else {
                        objArray = obj.results;
                    }

                    while (i < objArray.length) {
                        const user = new service.User();
                        user._setUserInfo(JSON.stringify(objArray[i]));
                        userArray.push(user);
                        i++;
                    }

                    if (conditions != null && conditions.countQuery) {
                        return {
                            users: userArray,
                            count: obj.count
                        };
                    } else {
                        return userArray;
                    }
                })
                .catch((error) => {
                    nbLogger("User.query#error callback start");
                    nbLogger(("User.query#error = " + (_errorText(error))));
                    return Promise.reject(error);
                });

        nbLogger("User.query#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @method
     * @memberOf User
     * @description ユーザ情報更新
     * @param {User} user 更新するユーザオブジェクトのインスタンス。
     * <p>
     * user にnull は指定できない。
     * 更新に必要なインスタンスのプロパティは、以下の通り。
     * <ul>
     *     <li>_id      : 更新するユーザのID（※）
     *     <li>email    : 更新するE-mailアドレス（オプション）
     *     <li>password : 更新するパスワード（オプション）
     *     <li>username : 更新するユーザ名（オプション）
     *     <li>options  : オプション(オプション)　optionsには、JSON形式で記述された任意のオブジェクトを指定できる。
     * </ul>
     * (※) ユーザID は、ユーザ登録が成功した場合にSDK がユーザプロパティに設定する。
     * <p>
     * カレントユーザ以外を更新する場合は、SDK 初期化時のアプリケーションキーにアプリケーションのマスターキーを指定すること。
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(user)
     *             user : 更新したユーザオブジェクトのインスタンス
     *             処理の成功により、以下のユーザオブジェクトのプロパティが更新される
     *                 (プロパティ名)
     *                 username    : 更新されたユーザ名
     *                 email       : 更新されたE-mailアドレス
     *                 updatedAt   : 最終更新日付
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static update(user: User, callbacks?: Callbacks): Promise<User> { return null; }

    protected static _update(service: NebulaService, user: User, callbacks?: Callbacks): Promise<User> {
        if (!(user instanceof User)) {
            throw new Error("User.update: not User instance");
        }
        if (user._service !== service) {
            throw new Error("Service does not match");
        }
        return user._update(callbacks);
    }

    protected _update(callbacks?: Callbacks): Promise<User> {
        let path: string;
        let request: ApiRequest;
        let error: any;
        nbLogger("User.update#start");

        if (this._id === null) {
            nbLogger("User.update: no user id");
            error = _createError(400, "Bad Request (local)", "no user id.");
            return _promisify(Promise.reject(error), callbacks);
        }

        const updateParams: JsonObject = {};

        if (this._service.isOffline()) {
            request = new _SdeRequest("NebulaUser", "update");
            updateParams._id = this._id;
        } else {
            path = "/users/" + this._id;
            nbLogger("User.update#REST API Request path = " + path);
            request = new HttpRequest(this._service, path);
            request.setMethod("PUT");
            request.setContentType("application/json");
            delete updateParams._id;
        }

        if (this.email !== null) {
            updateParams.email = this.email;
        }

        if (this.username !== null) {
            updateParams.username = this.username;
        }

        if (this.password !== null) {
            updateParams.password = this.password;
        }

        if (this.options !== null) {
            updateParams.options = this.options;
        }

        request.setData(updateParams);

        const promise = request.execute()
                .then((response) => {
                    nbLogger("User.update#success callback start");
                    nbLogger("User.update#response = " + response);
                    this._setUserInfo(response);
                    return this;
                })
                .catch((error) => {
                    nbLogger("User.update#error callback start");
                    nbLogger(("User.update#error = " + (_errorText(error))));
                    return Promise.reject(error);
                });

        nbLogger("User.update#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @method
     * @memberOf User
     * @description ユーザを削除する。
     * @param {Object} user 削除するユーザオブジェクトのインスタンス。
     * user にnull は指定できない。
     * ユーザ削除に必要なインスタンスのプロパティは、以下の通り。
     * <ul>
     *     <li>_id : 更新するユーザのID
     * </ul>
     * ユーザID は、ユーザ登録が成功した場合にSDK がユーザプロパティに設定する。
     * <p>
     * カレントユーザ以外を削除する場合は、SDK 初期化時のアプリケーションキーにアプリケーションのマスターキーを指定すること。
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success()
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * @since v4.0.1
     */
    static remove(user: User, callbacks?: Callbacks): Promise<void> { return null; }

    protected static _remove(service: NebulaService, user: User, callbacks?: Callbacks): Promise<void> {
        if (!(user instanceof User)) {
            throw new Error("User.remove: not User instance");
        }
        if (user._service !== service) {
            throw new Error("User.remove: service does not match");
        }

        return user._remove(callbacks);
    }

    private _remove(callbacks?: Callbacks): Promise<void> {
        nbLogger("User.remove#start");

        if (this._id === null) {
            nbLogger("User.remove: no user id.");
            const error = _createError(400, "Bad argument (local)", "no user id.");
            return _promisify(Promise.reject(error), callbacks);
        }

        let request: ApiRequest;
        if (this._service.isOffline()) {
            request = new _SdeRequest("NebulaUser", "delete");

            request.setData({
                _id: this._id
            });
        } else {
            const path = "/users/" + this._id;
            nbLogger("User.remove#REST API Request path = " + path);
            request = new HttpRequest(this._service, path);
            request.setMethod("DELETE");
        }

        const promise = request.execute()
                .then((response) => {
                    nbLogger("User.remove#success callback start");
                    nbLogger("User.remove#response = " + response);
                    const _currentUser = this._service.getCurrentUser();

                    if (_currentUser !== null) {
                        if (this._id === _currentUser._id) {
                            nbLogger("User.remove#delete user is current user");
                            this._service.removeCurrentUser();
                        }
                    }

                    return;
                })
                .catch((error) => {
                    nbLogger("User.remove#error callback start");
                    nbLogger(("User.remove#error = " + (_errorText(error))));
                    return Promise.reject(error);
                });

        nbLogger("User.remove#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @method
     * @memberOf User
     * @name delete
     * @description ユーザ削除 (Deprecated)
     * <p>
     * 本APIは Deprecated である。{@link User.remove}を使用すること。
     * @deprecated since v4.0.1
     */

    /**
     * @method
     * @memberOf User
     * @description ユーザパスワードリセット
     * <p>
     * ・ユーザパスワードのリセットを行う。<br>
     * ・ユーザパスワードのリセットは一定の時間内にリクエストできる回数に制限がある。
     * @param {Object} userInfo ユーザ情報。
     * JSON 形式で指定する。null は指定できない。
     * 以下いずれかのプロパティを指定すること。
     * <ul>
     *     <li>email       : E-mailアドレス
     *     <li>username    : ユーザ名
     * </ul>
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success()
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static resetPassword(userInfo: UserJson, callbacks?: Callbacks): Promise<void> { return null; }

    protected static _resetPassword(service: NebulaService, userInfo: UserJson, callbacks?: Callbacks): Promise<void> {
        nbLogger("User.resetPassword#start");
        if (userInfo == null || (userInfo.email == null && userInfo.username == null)) {
            throw new Error("User.resetPassword: bad arguments");
        }

        let request: ApiRequest;
        if (service.isOffline()) {
            request = new _SdeRequest("NebulaUser", "resetPassword");
        } else {
            const path = "/request_password_reset";
            nbLogger("User.resetPassword#REST API Request path = " + path);
            request = new HttpRequest(service, path);
            request.setSessionToken(null);
            request.setMethod("POST");
            request.setContentType("application/json");
        }

        let resetParams: JsonObject;
        if (((userInfo.email !== undefined) && (userInfo.username !== undefined))) {
            resetParams = {
                email: userInfo.email,
                username: userInfo.username
            };
        } else if (((userInfo.email !== undefined) && (userInfo.username === undefined))) {
            resetParams = {
                email: userInfo.email
            };
        } else if (((userInfo.email === undefined) && (userInfo.username !== undefined))) {
            resetParams = {
                username: userInfo.username
            };
        }

        request.setData(resetParams);

        const promise = request.execute()
                .then((response) => {
                    nbLogger("User.resetPassword#success callback start");
                    nbLogger("User.resetPassword#response = " + response);
                    return;
                })
                .catch((error) => {
                    nbLogger("User.resetPassword#error callback start");
                    nbLogger(("User.resetPassword#error = " + (_errorText(error))));
                    return Promise.reject(error);
                });

        nbLogger("User.delete#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @method
     * @memberOf User
     * @description OpenID Connectリンク情報取得
     * <p>
     * ・ユーザに設定された OpenID Connect リンク情報を取得する。<br>
     * ・本 API はオフラインモードでは使用できない。<br>
     * @param {Object} user リンク情報取得するユーザオブジェクトのインスタンス。<br>
     * null は指定できない。<br>
     * リンク情報取得に必要なインスタンスのプロパティは、以下の通り。
     * <ul>
     *     <li>_id : リンク情報取得するユーザのID
     * </ul>
     * <p>
     * カレントユーザ以外のリンク情報を取得する場合は、SDK 初期化時のアプリケーションキーにアプリケーションのマスターキーを指定すること。
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(links)
     *             links : リンク情報 (Nebula.AccountLink インスタンス) の配列
     *             リンク情報が存在しない場合は、空が返る。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * @since v6.5.0
     */
    static getAccountLinks(user: User, callbacks?: Callbacks): Promise<AccountLink[]> { return null; }

    protected static _getAccountLinks(service: NebulaService, user: User, callbacks?: Callbacks): Promise<AccountLink[]> {
        if (!(user instanceof User)) {
            throw new Error("User.getAccountLinks: not User instance");
        }
        if (user._service !== service) {
            throw new Error("User.getAccountLinks: Service does not match");
        }

        return user._getAccountLinks(callbacks);
    }

    protected _getAccountLinks(callbacks?: Callbacks): Promise<AccountLink[]> {
        nbLogger("User.getAccountLinks#start");

        if (this._service.isOffline()) {
            throw new Error("User.getAccountLinks: offline mode is not supported");
        }
        if (this._id === null) {
            throw new Error("User.getAccountLinks: no user id");
        }

        const path = "/users/" + this._id + "/links";
        nbLogger("User.getAccountLinks#REST API Request path = " + path);
        const request: ApiRequest = new HttpRequest(this._service, path);
        request.setMethod("GET");

        const promise = request.execute()
                .then((response) => {
                    nbLogger("User.getAccountLinks#response = " + response);
                    const resObj = JSON.parse(response);
                    const resArray = resObj.results;
                    const links: AccountLink[] = [];

                    if (resArray != null) {
                        for (const obj of resArray) {
                            const link = new AccountLink();
                            link._setAccountLink(obj);
                            links.push(link);
                        }
                    }

                    return links;
                })
                .catch((error) => {
                    nbLogger(("User.getAccountLinks#error = " + (_errorText(error))));
                    return Promise.reject(error);
                });

        nbLogger("User.getAccountLinks#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @method
     * @memberOf User
     * @description OpenID Connectリンク情報削除
     * <p>
     * ・ユーザに設定された OpenID Connect リンク情報を削除する。<br>
     * ・本 API はオフラインモードでは使用できない。<br>
     * @param {Object} user リンク情報削除するユーザオブジェクトのインスタンス。<br>
     * null は指定できない。<br>
     * リンク情報削除に必要なインスタンスのプロパティは、以下の通り。
     * <ul>
     *     <li>_id : リンク情報削除するユーザのID
     * </ul>
     * <p>
     * カレントユーザ以外のリンク情報を削除する場合は、SDK 初期化時のアプリケーションキーにアプリケーションのマスターキーを指定すること。
     * @param {string} linkedUserId 削除するリンクユーザID。<br>
     * null は指定できない。<br>
     * user の primaryLinkedUserId と一致した場合は、例外をスローする。
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *   success の引数は無し。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * @since v6.5.0
     */
    static deleteAccountLink(user: User, linkedUserId: string, callbacks?: Callbacks): Promise<void> { return null; }

    protected static _deleteAccountLink(service: NebulaService, user: User, linkedUserId: string, callbacks?: Callbacks): Promise<void> {
        if (!(user instanceof User)) {
            throw new Error("User.deleteAccountLink: not User instance");
        }
        if (user._service !== service) {
            throw new Error("User.deleteAccountLink: Service does not match");
        }
        if (linkedUserId == null) {
            throw new Error("User.deleteAccountLink: no linkedUserId");
        }

        return user._deleteAccountLink(linkedUserId, callbacks);
    }

    protected _deleteAccountLink(linkedUserId: string, callbacks?: Callbacks): Promise<void> {
        nbLogger("User.deleteAccountLink#start");

        if (this._service.isOffline()) {
            throw new Error("User.deleteAccountLink: offline mode is not supported");
        }
        if (this._id === null) {
            throw new Error("User.deleteAccountLink: no user id");
        }
        if (this.primaryLinkedUserId !== null && this.primaryLinkedUserId === linkedUserId) {
            // primaryLinkedUserId が null でない場合のみチェック
            throw new Error("User.deleteAccountLink: linkedUserId is primaryLinkedUserId");
        }

        const path = "/users/" + this._id + "/links/" + linkedUserId;
        nbLogger("User.deleteAccountLink#REST API Request path = " + path);
        const request: ApiRequest = new HttpRequest(this._service, path);
        request.setMethod("DELETE");

        const promise = request.execute()
                .then((response) => {
                    nbLogger("User.deleteAccountLink#response = " + response);
                    return;
                })
                .catch((error) => {
                    nbLogger(("User.deleteAccountLink#error = " + (_errorText(error))));
                    return Promise.reject(error);
                });

        nbLogger("User.deleteAccountLink#end");
        return _promisify(promise, callbacks);
    }
}
