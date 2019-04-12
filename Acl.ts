import {AnyJson, JsonObject, nbLogger} from "./Head";
import {User} from "./User";
import {Group} from "./Group";

/**
 * @namespace AclPermission
 * @description AclPermissionの定義。
 * Deprecatedである。代わりに {@link Acl}のメンバを使用すること。・
 * @deprecated
 */
export const AclPermission = {
    /**
     * 読み込み権限(r)
     * @const
     */
    READ: "r",

    /**
     * 書き込み権限(w)
     * @const
     */
    WRITE: "w",

    /**
     * 作成権限(c)
     * @const
     */
    CREATE: "c",

    /**
     * 更新権限(u)
     * @const
     */
    UPDATE: "u",

    /**
     * 削除権限(d)
     * @const
     */
    DELETE: "d",

    /**
     * 管理権限(admin)
     * @const
     */
    ADMIN: "admin",

    /**
     * オーナ(owner)
     * @const
     */
    OWNER: "owner"
};

/**
 * @namespace AclGroup
 * @description AclGroupの定義。
 * Deprecatedである。代わりに {@link Acl}のメンバを使用すること。・
 * @deprecated
 */
export const AclGroup = {
    /**
     * 認証ユーザ (g:authenticated)
     */
    AUTHENTICATED: "g:authenticated",

    /**
     * 全ユーザ (g:anonymous)
     */
    ANONYMOUS: "g:anonymous"
};

export interface AclJson {
    owner?: string;
    r?: string[];
    w?: string[];
    c?: string[];
    u?: string[];
    d?: string[];
    admin?: string[];

    // index signature
    [index:string]: string|string[];
}

/**
 * @class Acl
 * @classdesc ACLクラス
 * @example
 * var acl1 = new Nebula.Acl();
 * var acl2 = new Nebula.Acl({"r": [Nebula.Acl.AUTHENTICATED]});
 * @param {Object} json JSON表記のACL。省略時は全エントリが空の状態で生成される。
 */
export class Acl {
    /**
     * 読み込み権限(r)
     * @memberOf Acl
     * @const
     */
    static READ = "r";

    /**
     * 書き込み権限(w)
     * @memberOf Acl
     * @const
     */
    static WRITE = "w";

    /**
     * 作成権限(c)
     * @memberOf Acl
     * @const
     */
    static CREATE = "c";

    /**
     * 更新権限(u)
     * @memberOf Acl
     * @const
     */
    static UPDATE = "u";

    /**
     * 削除権限(d)
     * @memberOf Acl
     * @const
     */
    static DELETE = "d";

    /**
     * 管理権限(admin)
     * @memberOf Acl
     * @const
     */
    static ADMIN = "admin";

    /**
     * オーナ(owner)
     * @memberOf Acl
     * @const
     */
    static OWNER = "owner";

    /**
     * ログイン認識した全ユーザ (g:authenticated)
     * @memberOf Acl
     * @const
     */
    static AUTHENTICATED = "g:authenticated";

    /**
     * ログインしていないユーザを含む全ユーザ (g:anonymous)
     * @memberOf Acl
     * @const
     */
    static ANONYMOUS = "g:anonymous";

    private _acl: AclJson;

    // index signature
    [index:string]: any;

    /**
     * @private
     */
    constructor(json?: AclJson | Acl) {
        nbLogger("Acl(), json=" + json);
        this._acl = {
            r: [],
            w: [],
            c: [],
            u: [],
            d: [],
            admin: []
        };
        if (json) {
            for (const key of [Acl.OWNER, Acl.READ, Acl.WRITE, Acl.CREATE, Acl.UPDATE, Acl.DELETE, Acl.ADMIN]) {
                if (json[key]) {
                    this._acl[key] = json[key];
                }
            }
        }
    }


    /**
     * @method
     * @memberOf Acl
     * @description
     *      対象権限にユーザIDまたはグループ名を追加する
     * @example
     * var acl = new Nebula.Acl();
     * var user = new Nebula.User();
     * var group = new Group("MyGroup");
     * ....
     * acl.addEntry(Nebula.Acl.READ, user);
     * acl.addEntry(Nebula.Acl.WRITE, "USER_01");
     * acl.addEntry(Nebula.Acl.CREATE, group);
     * acl.addEntry(Nebula.Acl.UPDATE, "g:GROUP_A");
     * acl.addEntry(Nebula.Acl.DELETE, Nebula.Acl.AUTHENTICATED);
     * @param {String} permission エントリを追加する対象権限
     *      <br />以下のいずれかの値を指定する。
     *      <ul>
     *      <li>{@link Acl.READ}
     *      <li>{@link Acl.WRITE}
     *      <li>{@link Acl.CREATE}
     *      <li>{@link Acl.UPDATE}
     *      <li>{@link Acl.DELETE}
     *      <li>{@link Acl.ADMIN}
     *      </ul>
     * @param {Object} entry ユーザまたはグループ情報
     * 以下のいずれかを指定する。
     * <p>
     * ・ユーザを指定する場合
     * <ul>
     *   <li>{@link User} インスタンス
     *   <li>ユーザIDの文字列
     * </ul>
     *
     * ・グループを指定する場合
     * <ul>
     *   <li>{@link Group} インスタンス
     *   <li>グループ名に g: を付けた文字列。<br>(例) グループ名が GROUP_A の場合、 g:GROUP_A
     *   <li>{@link Acl.AUTHENTICATED} : ログイン認証された全ユーザ
     *   <li>{@link Acl.ANONYMOUS} : ログインしていないユーザを含む全ユーザ
     * </ul>
     * @return {Boolean} 正常追加した場合 true、 パラメータが不正の場合 false を返す
     */
    addEntry(permission: string, entry: string | User | Group): boolean {
        const entries = this._acl[permission] as string[];
        if (!entries) {
            return false;
        }

        if (!entry) {
            return false;
        }

        let add: string = null;
        if (entry instanceof User) {
            add = entry._id;
        } else if (entry instanceof Group) {
            add = "g:" + entry.groupname;
        } else {
            add = entry;
        }

        let exist = false;
        for (const target of entries) {
            if (target === add) {
                exist = true;
                break;
            }
        }

        if (!exist) {
            entries.push(add);
            nbLogger("Acl.addEntry(), added entry=" + add);
            return true;
        }

        return false;
    }

    /**
     * @method
     * @memberOf Acl
     * @description
     *      対象権限からにユーザIDまたはグループ名を削除する
     * @example
     * var acl = new Nebula.Acl();
     * var user = new Nebula.User();
     * var group = new Group("MyGroup");
     * ....
     * acl.removeEntry(Nebula.Acl.READ, user);
     * acl.removeEntry(Nebula.Acl.WRITE, "USER_01");
     * acl.removeEntry(Nebula.Acl.CREATE, group);
     * acl.removeEntry(Nebula.Acl.UPDATE, "g:GROUP_A");
     * acl.removeEntry(Nebula.Acl.DELETE, Nebula.Acl.AUTHENTICATED);
     * @param {String} permission エントリを削除する対象権限
     *      <br />以下のいずれかの値を指定する。
     *      <ul>
     *      <li>{@link Acl.READ}
     *      <li>{@link Acl.WRITE}
     *      <li>{@link Acl.CREATE}
     *      <li>{@link Acl.UPDATE}
     *      <li>{@link Acl.DELETE}
     *      <li>{@link Acl.ADMIN}
     *      </ul>
     * @param {Object} entry ユーザまたはグループ情報。
     * 以下のいずれかを指定する。
     * <p>
     * ・ユーザを指定する場合
     * <ul>
     *   <li>{@link User} インスタンス
     *   <li>ユーザIDの文字列
     * </ul>
     *
     * ・グループを指定する場合
     * <ul>
     *   <li>{@link Group} インスタンス
     *   <li>グループ名に g: を付けた文字列。<br>(例) グループ名が GROUP_A の場合、 g:GROUP_A
     *   <li>{@link Acl.AUTHENTICATED} : ログイン認証された全ユーザ
     *   <li>{@link Acl.ANONYMOUS} : ログインしていないユーザを含む全ユーザ
     * </ul>
     */
    removeEntry(permission: string, entry: string | User | Group) {
        const entries = this._acl[permission] as string[];
        if (!entries) {
            return false;
        }

        if (!entry) {
            return false;
        }

        let remove: string = null;
        if (entry instanceof User) {
            remove = entry._id;
        } else if (entry instanceof Group) {
            remove = "g:" + entry.groupname;
        } else {
            remove = entry as string;
        }

        for (let i = 0; i < entries.length; i++) {
            const target = entries[i];
            if (target === remove) {
                entries.splice(i, 1);
                nbLogger("Acl.removeEntry(), removed entry=" + remove);
                break;
            }
        }
    }

    /**
     * @method
     * @memberOf Acl
     * @description 所有者のユーザIDを設定する
     * @private
     */
    _setOwner(owner: string) {
        this._acl[Acl.OWNER] = owner;
    }


    /**
     * @method
     * @memberOf Acl
     * @description
     *      所有者のユーザIDを取得する
     * @example
     * var acl = ....;
     * ....
     * var userId = acl.getOwner();
     * @return
     *      {String} ユーザIDの文字列を返す。所有者がない場合は、null を返す。
     */
    getOwner(): string {
        if (this._acl.owner) {
            return this._acl.owner;
        }
        return null;
    }


    /**
     * @method
     * @memberOf Acl
     * @description
     *      対象権限のユーザIDおよびグループ名のエントリ一覧を取得する
     * @example
     * var acl = ....;
     *
     * var entries = acl.getEntries(permission);
     * for (var i = 0; i < entries.length; i++) {
     *     entry = entries[i];
     *     ....;
     * }
     * @param {String} permission 取得するエントリ一覧の対象権限
     *      <br />以下のいずれかの値を指定する。
     *      <ul>
     *      <li>{@link Acl.READ}
     *      <li>{@link Acl.WRITE}
     *      <li>{@link Acl.CREATE}
     *      <li>{@link Acl.UPDATE}
     *      <li>{@link Acl.DELETE}
     *      <li>{@link Acl.ADMIN}
     *      </ul>
     * @return {Object} ユーザIDまたはグループ名の文字列の配列を返す。
     *      エントリがない場合は、空配列を返す。
     *      <br />グループ名には、g: が先頭に付加されている。
     */
    getEntries(permission:string): string[] {
        const entries = this._acl[permission] as string[];
        if (!entries) {
            return null;
        }
        return entries;
    }


    /**
     * @method
     * @memberOf Acl
     * @description ACLのJSONオブジェクトを直接設定する
     * @private
     */
    _set(acl: AclJson) {
        this._acl = acl;
    }

    /**
     * @method
     * @memberOf Acl
     * @description 指定のエントリが含まれているかどうか
     * @private
     */
    _hasEntry(permission:string, target: string):boolean {
        const entries = this._acl[permission];

        if (entries) {
            for (const entry of entries) {
                if (entry === target) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @method
     * @memberOf Acl
     * @description ACLのJSONオブジェクトを文字列に変換する
     * @private
     */
    _toString(keyName?: string): string {
        return JSON.stringify(this._toJsonObject(keyName));
    }

    /**
     * @method
     * @memberOf Acl
     * @description ACLのJSONオブジェクトを返す
     * @param keyName "ACL", "contentACL" のいずれかを指定すると、そのキーに ACL が格納される
     * @private
     */
    _toJsonObject(keyName?: string): JsonObject {
        if (keyName === "ACL" || keyName === "contentACL") {
            const json: AnyJson = {};
            json[keyName] = this._acl;
            return json;
        } else {
            return this._acl;
        }
    }
}
