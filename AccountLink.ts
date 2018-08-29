/** @private */
export interface AccountLinkJson {
    _id: string;
    iss: string;
    sub: string;
    op: string;
}

/**
 * @class AccountLink
 * @classdesc AccountLink クラス
 * @description AccountLink クラスインスタンスを生成する
 * @example
 * var link = new Nebula.AccountLink();
 * @since v6.5.0
 */
export class AccountLink {
    __id: string;
    _iss: string;
    _sub: string;
    _op: string;

    constructor() {}

    /**
     * リンクユーザID
     * @name AccountLink#_id
     * @type string
     */
    get _id():string { return this.__id; }
    set _id(value: string) { this.__id = value; }

    /**
     * Issuer Identifier
     * @name AccountLink#iss
     * @type string
     */
    get iss():string { return this._iss; }
    set iss(value: string) { this._iss = value; }

    /**
     * Subject Identifier
     * @name AccountLink#sub
     * @type string
     */
    get sub():string { return this._sub; }
    set sub(value: string) { this._sub = value; }

    /**
     * OP種別
     * @name AccountLink#op
     * @type string
     */
    get op():string { return this._op; }
    set op(value: string) { this._op = value; }

    /**
     * @memberOf AccountLink
     * @description JSONからAccountLinkインスタンスにデータをセットする
     * @private
     */
    _setAccountLink(obj: AccountLinkJson): AccountLinkJson {
        if (obj._id != null) {
            this.__id = obj._id;
        }

        if (obj.iss != null) {
            this._iss = obj.iss;
        }

        if (obj.sub != null) {
            this._sub = obj.sub;
        }

        if (obj.op != null) {
            this._op = obj.op;
        }

        return this;
    }
}
