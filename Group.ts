import {Acl, AclJson} from "./Acl";
import {NebulaService} from "./NebulaService";
import {_errorText, _promisify, AnyJson, Callbacks, JsonObject, nbError, nbLogger} from "./Head";
import {ApiRequest, HttpRequest} from "./HttpRequest";
import {_SdeRequest} from "./SdeRequest";
import {Nebula} from "./Nebula";

import {Promise} from "es6-promise";
import {User} from "./User";

export interface GroupJson {
    _id: string;
    name: string;
    users: string[];
    groups: string[];
    ACL: AclJson;
    createdAt: string;
    updatedAt: string;
    etag: string;

    //[index:string]: any;
}

export interface GroupQuery {
    groupname: string;
}

/**
 * グループ実装
 * @private
 */
export class Group {
    _service: NebulaService;

    __id: string;
    _groupname: string;
    _users: string[];
    _groups: string[];
    _acl: Acl;
    _createdAt: string;
    _updatedAt: string;
    _etag: string;
    
    [index:string]: any;

    /**
     * @class Group
     * @classdesc グループ管理クラス
     * @description グループオブジェクトを生成する
     * <p>
     * ・オブジェクトを生成しただけでは、まだサーバにグループ登録されていない。グループ登録は、{@link Group#save} で実施する。<br>
     * ・グループはアプリ毎ではなく、テナント毎に作成される。
     * @example
     *      var group = new Nebula.Group("group1");
     * @param {String} groupname グループ名。
     * グループ名に使用できる文字は、１バイト英数のみ。
     * @return {Group} 新規グループオブジェクトのインスタンス
     */
    constructor(groupname: string, service: NebulaService = Nebula) {
        this._service = service;

        this._id = null;
        this.groupname = null;
        this.users = [];
        this.groups = [];
        this.acl = null;
        this.createdAt = null;
        this.updatedAt = null;
        this.etag = null;

        if (((typeof groupname) === "string") && groupname !== "") {
            this.groupname = groupname;
        }
    }

    /**
     * グループID
     * @type String
     * @name Group#_id
     */
    get _id(): string { return this.__id; }
    set _id(value: string) { this.__id = value; }

    /**
     * グループ名
     * @type String
     * @name Group#groupname
     */
    get groupname(): string { return this._groupname; }
    set groupname(value: string) { this._groupname = value; }

    /**
     * ユーザIDの一覧(配列)
     * @type String[]
     * @name Group#users
     */
    get users(): string[] { return this._users; }
    set users(value: string[]) { this._users = value; }

    /**
     * グループ名の一覧(配列)
     * @type String[]
     * @name Group#groups
     */
    get groups(): string[] { return this._groups; }
    set groups(value: string[]) { this._groups = value; }

    /**
     * ACL
     * @type Acl
     * @name Group#acl
     */
    get acl(): Acl { return this._acl; }
    set acl(value: Acl) {
        if (value != null && !(value instanceof Acl)) {
            throw new Error("acl is not Acl instance!");
        }
        this._acl = value;
    }

    /**
     * 作成日時
     * @type String
     * @name Group#createdAt
     */
    get createdAt(): string { return this._createdAt; }
    set createdAt(value: string) { this._createdAt = value; }

    /**
     * 更新日時
     * @type String
     * @name Group#updatedAt
     */
    get updatedAt(): string { return this._updatedAt; }
    set updatedAt(value: string) { this._updatedAt = value; }

    /**
     * ETag
     * @type String
     * @name Group#etag
     */
    get etag(): string { return this._etag; }
    set etag(value: string) { this._etag = value; }

    protected _setGroupInfo(response: string) {
        let jsonObj: GroupJson;
        try {
            jsonObj = JSON.parse(response);
        } catch (undefined) {
            nbError("Group._setGroupInfo#json error.");
            return;
        }

        if (jsonObj._id !== undefined) {
            this._id = jsonObj._id;
        }

        if (jsonObj.name !== undefined) {
            this.groupname = jsonObj.name;
        }

        if (jsonObj.users !== undefined) {
            this.users = jsonObj.users;
        }

        if (jsonObj.groups !== undefined) {
            this.groups = jsonObj.groups;
        }

        if (jsonObj.ACL !== undefined) {
            this.acl = new Acl();
            this.acl._set(jsonObj.ACL);

            if (jsonObj.ACL.owner !== undefined) {
                this.acl._setOwner(jsonObj.ACL.owner);
            }
        }

        if (jsonObj.createdAt !== undefined) {
            this.createdAt = jsonObj.createdAt;
        }

        if (jsonObj.updatedAt !== undefined) {
            this.updatedAt = jsonObj.updatedAt;
        }

        if (jsonObj.etag !== undefined) {
            return this.etag = jsonObj.etag;
        }
    }

    /**
     * @memberOf Group
     * @description グループプロパティ設定 (Deprecated)
     * <p>
     * ・グループオブジェクトのプロパティを設定する。<br>
     * ・設定可能なプロパティの詳細は、各メソッドの説明を参照のこと。<br>
     * ・本メソッドは Deprecated である。各フィールドの setter を使用すること。
     * @param {String} property プロパティ名
     * @param {String} value プロパティ値
     * @return {Group} this
     * @deprecated since 5.0.0
     */
    set(property: string, value: string|string[]|Acl) {
        switch (property) {
            case "_id":
                this._id = value as string;
                break;
            case "groupname":
                this.groupname = value as string;
                break;
            case "users":
                this.users = value as string[];
                break;
            case "groups":
                this.groups = value as string[];
                break;
            case "acl":
                this.acl = value as Acl;
                break;
            case "createdAt":
                this.createdAt = value as string;
                break;
            case "updatedAt":
                this.updatedAt = value as string;
                break;
            case "etag":
                this.etag = value as string;
                break;
            default:
                nbError("Invalid property: " + property);
                throw new Error("Invalid property: " + property);
        }
    }

    /**
     * @memberOf Group
     * @description グループプロパティ取得 (Deprecated)
     * <p>
     * ・グループオブジェクトのプロパティを取得する。<br>
     * ・取得可能なプロパティの詳細は、各メソッドの説明を参照のこと。<br>
     * ・本メソッドは Deprecated である。各フィールドの getter を使用すること。
     * @param {String} property プロパティ名
     * @return {String} value プロパティ値
     * @deprecated since 5.0.0
     */
    get(property: string): any {
        switch (property) {
            case "_id":
                return this._id;
            case "groupname":
                return this.groupname;
            case "users":
                return this.users;
            case "groups":
                return this.groups;
            case "acl":
                return this.acl;
            case "createdAt":
                return this.createdAt;
            case "updatedAt":
                return this.updatedAt;
            case "etag":
                return this.etag;
            default:
                nbError("Invalid property: " + property);
                throw new Error("Invalid property: " + property);
        }
    }

    /**
     * @memberOf Group
     * @description グループエントリ追加
     * <p>
     * ・登録するグループにユーザまたはグループを追加する。
     * @param {Object} entry Nebula.User またはNebula.Group のインスタンス
     * <pre>
     * ・entry は、グループに追加する Nebula.User または Nebula.Group のインスタンスを指定する。
     *   各インスタンスには以下のプロパティが設定されていること。
     *     Nebula.User
     *     (プロパティ名)
     *     _id             : ユーザのID（*）
     *     (*) ユーザID は、ユーザ登録が成功した場合にSDK がユーザプロパティに設定する。
     *         ユーザ取得、ログイン、カレントユーザ取得で取得したNebula.User のインスタンスには登録時のユーザID が設定されている。
     *     Nebula.Group
     *     (プロパティ名)
     *     groupname       : 登録済みグループ名
     * </pre>
     * @return {Boolean} value エントリ結果
     * <pre>
     * ・value は、エントリとして追加した場合 true、パラメータが不正の場合false が返る。
     * ・処理の成功により、以下のグループオブジェクトのプロパティが更新される。
     *     (プロパティ名)
     *     users       : グループにエントリされるユーザ(ID)の配列（*）
     *     groups      : グループにエントリされるグループ名の配列（*）
     *     (*) グループプロパティ設定（group.set） でプロパティを設定した場合、エントリ追加した内容は上書きされる。
     * </pre>
     */
    addEntry(entry: User|Group): boolean {
        nbLogger("Group.addEntry#start");
        let _entries: string[] = [];
        let _add: string = null;

        if (entry instanceof this._service.User) {
            _add = entry._id;
            _entries = this.users;
        } else if (entry instanceof this._service.Group) {
            _add = entry.groupname;
            _entries = this.groups;
        } else {
            throw new Error("Group.addEntry: Invalid entry");
        }

        let _exists = false;
        for (const _entry of _entries) {
            if (_entry === _add) {
                _exists = true;
            }
        }

        if (!_exists) {
            _entries.push(_add);
        }

        nbLogger("Group.addEntry#end");
        return true;
    }

    /**
     * @memberOf Group
     * @description グループエントリ削除
     * <p>
     * ・グループからユーザまたはグループを削除する。
     * @param {Object} entry Nebula.User またはNebula.Group のインスタンス
     * <pre>
     * ・entry は、グループから削除する Nebula.User または Nebula.Group のインスタンスを指定する。
     *   各インスタンスには以下のプロパティが設定されていること。
     *     Nebula.User
     *     (プロパティ名)
     *     _id             : ユーザのID（*）
     *     (*) ユーザID は、ユーザ登録が成功した場合にSDK がユーザプロパティに設定する。
     *         ユーザ取得、ログイン、カレントユーザ取得で取得したNebula.User のインスタンスには登録時のユーザID が設定されている。
     *     Nebula.Group
     *     (プロパティ名)
     *     groupname       : 登録済みグループ名
     * </pre>
     * @return {Boolean} value エントリ結果
     * <pre>
     * ・value は、エントリから削除した場合 true、パラメータが不正の場合false が返る。
     * ・処理の成功により、以下のグループオブジェクトのプロパティが更新される。
     *     (プロパティ名)
     *     users       : グループにエントリされるユーザ(ID)の配列（*）
     *     groups      : グループにエントリされるグループ名の配列（*）
     *     (*) グループプロパティ設定（group.set） でプロパティを設定した場合、エントリ追加した内容は上書きされる。
     * </pre>
     */
    removeEntry(entry: User|Group): boolean {
        nbLogger("Group.removeEntry#start");
        let _entries: string[] = [];
        let _remove: string = null;

        if (entry instanceof this._service.User) {
            _remove = entry._id;
            _entries = this.users;
        } else if (entry instanceof this._service.Group) {
            _remove = entry.groupname;
            _entries = this.groups;
        } else {
            throw new Error("Group.removeEntry: Invalid entry");
        }

        for (let i = 0; i < _entries.length; i++) {
            if (_entries[i] === _remove) {
                _entries.splice(i, 1);
                break;
            }
        }

        nbLogger("Group.removeEntry#end");
        return true;
    }

    /**
     * @memberOf Group
     * @description グループ登録・更新
     * <p>
     * ・グループを登録する。<br>
     * ・既に同一名称のグループが登録されている場合は更新となる。<br>
     * ・グループ登録(又は更新)に必要なグループプロパティは、以下の通り。
     * <ul>
     *   <li>groupname   : グループ名（必須）</li>
     *   <li>users       : グループに登録されるユーザ(ID)の配列（※）</li>
     *   <li>groups      : グループに登録されるグループ名の配列（※）      </li>
     *   <li>acl         : グループに設定されるNebula.Acl のインスタンス（オプション)</li>
     *   <li>etag        : グループに設定されるETag値（オプション)</li>
     *  </ul>
     *  (※) グループに登録されるユーザ(ID)とグループ名の配列は、グループ
     *  プロパティ設定で配列を設定する方法とグループエントリの追加／
     *  削除で個別に設定する方法がある。
     *  <br><br>
     * ・ETag値は、グループを登録した場合にサーバで追加され、
     *   グループを更新する度にサーバで変更される固有値である。
     *   ETag値は、グループの "etag"プロパティに格納される。
     *   グループの登録の場合は、etagがないため必ず新規に生成・保存される。<br>
     * ・グループプロパティにETag値が含まれる場合、サーバに保存されているグループのETag値と照合される。
     *   一致しなかった場合は、データ衝突として「409 Conflict」エラーとなり、グループは更新されない。
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(group)
     *             group : 登録したグループオブジェクトのインスタンス
     *             acl を設定しなかった場合は以下のNebula.Acl インスタンスが自動的に設定される。
     *             ・ログイン済みの場合    ：全フィールドが空。
     *                                       オーナ（作成ユーザ）のみアクセス可。
     *             ・未ログイン状態の場合  ：r, w に "g:anonymous" が設定される。
     *                                       誰でも読み書き可。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    save(callbacks?: Callbacks): Promise<Group> {
        nbLogger("Group.save#start");

        if (this.groupname == null) {
            throw new Error("Group.save: no group name");
        }

        const saveParams: JsonObject = {};

        let request: ApiRequest;
        if (this._service.isOffline()) {
            request = new _SdeRequest("NebulaGroup", "save");
            saveParams.groupname = this.groupname;

            if (this.etag != null) {
                saveParams.etag = this.etag;
            }
        } else {
            const path = "/groups/" + encodeURIComponent(this.groupname);
            nbLogger("Group.save#REST API Request path = " + path);
            request = new HttpRequest(this._service, path);

            if (this.etag != null) {
                request.setQueryParam("etag", this.etag);
            }

            request.setMethod("PUT");
            request.setContentType("application/json");
        }

        saveParams.users = this.users;
        saveParams.groups = this.groups;

        if (this.acl !== null) {
            saveParams.ACL = this.acl._toJsonObject();
        }

        request.setData(saveParams);

        const promise = request.execute().then(response => {
            nbLogger("Group.save#success callback start");
            nbLogger("Group.save#response = " + response);
            this._setGroupInfo(response);
            return this;
        }).catch(error => {
            nbLogger("Group.save#error callback start");
            nbLogger(("Group.save#error = " + (_errorText(error))));
            return Promise.reject(error);
        });

        nbLogger("Group.save#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf Group
     * @description グループメンバ追加
     * <p>
     * ・グループにユーザ・子グループを追加する。
     * @param {string[]} userIds 追加するユーザIDの配列
     * @param {string[]} groups 追加するグループ名の配列
     * @param {Callbacks} callbacks 応答コールバック
     * <p>
     * 処理が成功した場合、success の呼び出しにて通知する。
     * success の引数は以下の通り。
     * <pre>
     *     success(group)
     *         group : 変更したグループオブジェクトのインスタンス
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * @since 6.5.0
     */
    addMembers(userIds: string[], groups: string[], callbacks?: Callbacks): Promise<Group> {
        return this._addRemoveMembers("add", userIds, groups, callbacks);
    }

    /**
     * @memberOf Group
     * @description グループメンバ削除
     * <p>
     * ・グループからにユーザ・子グループを削除する
     * @param {string[]} userIds 削除するユーザIDの配列
     * @param {string[]} groups 削除するグループ名の配列
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(group)
     *             group : 変更したグループオブジェクトのインスタンス
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * @since 6.5.0
     */
    removeMembers(userIds: string[], groups: string[], callbacks?: Callbacks): Promise<Group> {
        return this._addRemoveMembers("remove", userIds, groups, callbacks);
    }

    protected _addRemoveMembers(mode: string, userIds: string[], groups: string[], callbacks?: Callbacks): Promise<Group> {
        nbLogger(`Group.${mode}Members#start`);

        if (this.groupname == null) {
            throw new Error("No group name");
        }
        if (this._service.isOffline()) {
            throw new Error("offline mode is not supported.");
        }

        const path = "/groups/" + encodeURIComponent(this.groupname) + `/${mode}Members`;
        const request: ApiRequest  = new HttpRequest(this._service, path);
        request.setMethod("PUT");
        request.setContentType("application/json");

        const body = {
            users: userIds != null ? userIds : [],
            groups: groups != null ? groups : []
        };
        request.setData(body);

        const promise = request.execute().then(response => {
            nbLogger(`Group.${mode}Members#response = ${response}`);
            this._setGroupInfo(response);
            return this;
        }).catch(error => {
            nbLogger(`Group.${mode}Members#error = ${_errorText(error)}`);
            return Promise.reject(error);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf Group
     * @description グループ削除
     * @param {Group} group 削除するグループオブジェクトのインスタンス
     * <pre>
     * ・group にnull は指定できない。
     * ・グループ削除に必要なインスタンスのプロパティは、以下の通りとする。
     *     (プロパティ名)
     *     groupname   : グループ名（必須）
     *     etag        : グループに設定されるETag値（オプション）
     * ・ETag値は、グループ新規保存した場合にサーバで追加され、
     *   グループを更新する度にサーバで変更される固有値である。
     *   ETag値は、グループの "etag"プロパティに格納される。
     * ・etagを指定すると、サーバに保存されているグループのETag値と照合される。
     *   一致しなかった場合は、データ衝突として「409 Conflict」エラーとなり、グループは削除されない。
     *   etagがnullの場合は、ETag値は照合されずグループは無条件で削除される。
     * </pre>
     * @param {Callbacks} callbacks 応答コールバック
     * <p>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *   success の引数は無し。
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * @since v4.0.1
     */
    static remove(group: Group, callbacks?: Callbacks): Promise<void> { return null; }

    protected static _remove(service: NebulaService, group: Group, callbacks?: Callbacks): Promise<void> {
        if (!(group instanceof Group)) {
            throw new Error("Group.remove: not Group instance!");
        }
        if (group._service !== service) {
            throw new Error("Service does not match");
        }
        return group._remove(callbacks);
    }

    protected _remove(callbacks?: Callbacks): Promise<void> {
        nbLogger("Group.remove#start");

        let request: ApiRequest;
        if (this._service.isOffline()) {
            request = new _SdeRequest("NebulaGroup", "delete");

            const deleteParams: JsonObject = {
                groupname: this.groupname
            };

            const etag = this.etag;
            if (etag != null) {
                deleteParams.etag = etag;
            }

            request.setData(deleteParams);
        } else {
            const path = "/groups/" + encodeURIComponent(this.groupname);
            nbLogger("Group.remove#REST API Request path = " + path);
            request = new HttpRequest(this._service, path);

            const etag = this.etag;
            if (etag != null) {
                request.setQueryParam("etag", etag);
            }

            request.setMethod("DELETE");
        }

        const promise = request.execute().then(response => {
            nbLogger("Group.remove#success callback start");
            nbLogger("Group.remove#response = " + response);
            return;
        }).catch(error => {
            nbLogger("Group.remove#error callback start");
            nbLogger(("Group.remove#error = " + (_errorText(error))));
            return Promise.reject(error);
        });

        nbLogger("Group.remove#end");
        return _promisify(promise, callbacks);
    }

    /**
     * @name delete
     * @memberOf Group
     * @function
     * @description グループを削除する (Deprecated)<br>
     * ・本APIは Deprecated である。{@link Group.remove} を使用すること。
     * @deprecated since v4.0.1
     */

    /**
     * @memberOf Group
     * @description グループ検索
     * @param {Object} conditions 取得条件
     * <pre>
     * ・conditions にnull を指定した場合は全グループ一を取得する。
     * ・conditions は、JSON 形式で指定する。
     *     {
     *         "groupname" : "group1"
     *     }
     *     (プロパティ名)
     *     groupname    : グループ名
     * </pre>
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(groups)
     *             groups : 取得した Nebula.Group インスタンスの配列
     *             各要素に以下のグループのプロパティが更新される
     *                 (プロパティ名)
     *                 groupname   : グループ名
     *                 users       : 所属ユーザIDの一覧
     *                 groups      : 所属サブグループ名の一覧
     *                 acl         : ACL
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static query(conditions: GroupQuery, callbacks?: Callbacks): Promise<Group[]> { return null; }

    protected static _query(service: NebulaService, conditions: GroupQuery, callbacks?: Callbacks): Promise<Group[]> {
        nbLogger("Group.query#start");
        let groupname = null;
        if (conditions != null) {
            if (conditions.groupname != null) {
                groupname = conditions.groupname;
            } else {
                throw new Error("Group.query: no groupname in conditions");
            }
        }

        let request: ApiRequest;
        if (service.isOffline()) {
            request = new _SdeRequest("NebulaGroup", "query");

            if (groupname !== null) {
                request.setData({
                    groupname
                });
            }
        } else {
            let path: string;
            if (groupname !== null) {
                path = "/groups/" + encodeURIComponent(groupname);
            } else {
                path = "/groups";
            }

            nbLogger("Group.query#REST API Request path = " + path);
            request = new HttpRequest(service, path);
            request.setMethod("GET");
            request.setContentType("application/json");
        }

        const promise = request.execute().then(response => {
            nbLogger("Group.query#response = " + response);
            const obj: JsonObject = JSON.parse(response);
            let objArray: JsonObject[] = [];
            const groupArray: Group[] = [];

            if (obj.results === undefined) {
                objArray.push(obj);
            } else {
                objArray = obj.results as JsonObject[];
            }

            for (const obj of objArray) {
                const group = new service.Group(obj.name as string);
                group._setGroupInfo(JSON.stringify(obj));
                groupArray.push(group);
            }

            return groupArray;
        }).catch(error => {
            nbLogger(("Group.query#error = " + (_errorText(error))));
            return Promise.reject(error);
        });

        nbLogger("Group.query#end");
        return _promisify(promise, callbacks);
    }
}
