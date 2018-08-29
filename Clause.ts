import {_isObject, AnyJson, JsonObject} from "./Head";

export const RegexOption = {
    CASE_INSENSITIVITY: "i"
};

export interface ClauseJson extends JsonObject {
    [index: string]: AnyJson;
}

/**
 * @class Clause
 * @classdesc オブジェクト検索条件 クラス
 * @description Clause インスタンスを生成する
 * @example
 *     var clause = new Nebula.Clause();
 */
export class Clause {
    _clause: ClauseJson;

    /** @private */
    constructor(clause?: ClauseJson) {
        if (clause != null) {
            this._clause = clause;
        } else {
            this._clause = {};
        }
    }

    /**
     * @memberOf Clause
     * @description 条件のパラメータをセットする
     * @private
     */
    _setParams(key: string, operator: string, value: AnyJson, options?: AnyJson): Clause {

        if (operator === null) {
            this._clause[key] = value;
        } else {
            let data: JsonObject = {};
            if (_isObject(this._clause[key])) {
                data = this._clause[key] as JsonObject;
            }

            data[operator] = value;

            if (options) {
                data["$options"] = options;
            }

            this._clause[key] = data;
        }

        return this;
    }

    /**
     * @memberOf Clause
     * @description JSONで表現された条件式を取得する
     * @return {Object} JSON条件式
     */
    json(): ClauseJson {
        return this._clause;
    }

    /**
     * @method
     * @name Clause.equals
     * @description
     *      (key == value) の条件を示す Nebula.Clause インスタンスを生成する
     * @example
     *      var clause = Nebula.Clause.equals("score", 80);
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static equals(key: string, value: AnyJson): Clause {
        return new Clause().equals(key, value);
    }

    /**
     * @method
     * @name Clause#equals
     * @description
     *      (key == value) の条件を追加する
     * @example
     *      var clause = new Nebula.Clause().equals("score", 80);
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} this
     */
    equals(key: string, value: AnyJson): Clause {
        let operator: string = null;
        if (value != null && _isObject(value)) {
            operator = "$eq";
        }
        return this._setParams(key, operator, value);
    }

    /**
     * @memberOf Clause
     * @description
     *      (key != value) の条件を示す Nebula.Clause インスタンスを生成する
     * @example
     *      var clause = Nebula.Clause.notEquals("name", "apple");
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static notEquals(key: string, value: AnyJson): Clause {
        return new Clause().notEquals(key, value);
    }

    /**
     * @memberOf Clause
     * @description
     *      (key != value) の条件を追加する
     * @example
     *      var clause = new Nebula.Clause().notEquals("name", "apple");
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} this
     */
    notEquals(key: string, value: AnyJson): Clause {
        return this._setParams(key, "$ne", value);
    }

    /**
     * @memberOf Clause
     * @description
     *      (key < value) の条件を示す Nebula.Clause インスタンスを生成する
     * @example
     *      var clause = Nebula.Clause.lessThan("score", 30);
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static lessThan(key: string, value: number): Clause {
        return new Clause().lessThan(key, value);
    }

    /**
     * @memberOf Clause
     * @description
     *      (key < value) の条件を追加する
     * @example
     *      var clause = new Nebula.Clause().lessThan("score", 30);
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} this
     */
    lessThan(key: string, value: number): Clause {
        return this._setParams(key, "$lt", value);
    }

    /**
     * @memberOf Clause
     * @description
     *      (key <= value) の条件を示す Nebula.Clause インスタンスを生成する
     * @example
     *      var clause = Nebula.Clause.lessThanOrEqual("score", 30);
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static lessThanOrEqual(key: string, value: number): Clause {
        return new Clause().lessThanOrEqual(key, value);
    }

    /**
     * @memberOf Clause
     * @description
     *      (key <= value) の条件を追加する
     * @example
     *      var clause = new Nebula.Clause().lessThanOrEqual("score", 30);
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} this
     */
    lessThanOrEqual(key: string, value: number): Clause {
        return this._setParams(key, "$lte", value);
    }

    /**
     * @memberOf Clause
     * @description
     *      (key > value) の条件を示す Nebula.Clause インスタンスを生成する
     * @example
     *      var clause = Nebula.Clause.greaterThan("number", 1000);
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static greaterThan(key: string, value: number): Clause {
        return new Clause().greaterThan(key, value);
    }

    /**
     * @memberOf Clause
     * @description
     *      (key > value) の条件を追加する
     * @example
     *      var clause = new Nebula.Clause().greaterThan("number", 1000);
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} this
     */
    greaterThan(key: string, value: number): Clause {
        return this._setParams(key, "$gt", value);
    }

    /**
     * @memberOf Clause
     * @description
     *      (key >= value) の条件を示す Nebula.Clause インスタンスを生成する
     * @example
     *      var clause = Nebula.Clause.greaterThanOrEqual("number", 1000);
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static greaterThanOrEqual(key: string, value: number): Clause {
        return new Clause().greaterThanOrEqual(key, value);
    }

    /**
     * @memberOf Clause
     * @description
     *      (key >= value) の条件を追加すうｒ
     * @example
     *      var clause = Nebula.Clause.greaterThanOrEqual("number", 1000);
     * @param {String} key 比較するキー名
     * @param {Object} value 比較する値
     * @return {Clause} this
     */
    greaterThanOrEqual(key: string, value: number): Clause {
        return this._setParams(key, "$gte", value);
    }

    /**
     * @memberOf Clause
     * @description
     *      key の値が values で指定された中に存在するかの条件を示す Nebula.Clause インスタンスを生成する
     * @name Clause.in
     * @function
     * @example
     *      var targets = [1000, 1003, 1005];
     *      var clause = Nebula.Clause.in("number", targets);
     * @param {String} key 比較するキー名
     * @param {Object} values 比較する値の配列
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static in(key: string, values: AnyJson[]): Clause {
        return new Clause().in(key, values);
    }

    /**
     * @memberOf Clause
     * @description
     *      key の値が values で指定された中に存在するかの条件を追加する
     * @name Clause#in
     * @function
     * @example
     *      var targets = [1000, 1003, 1005];
     *      var clause = new Nebula.Clause().in("number", targets);
     * @param {String} key 比較するキー名
     * @param {Object} values 比較する値の配列
     * @return {Clause} this
     */
    in(key: string, values: AnyJson[]): Clause {
        return this._setParams(key, "$in", values);
    }

    /**
     * @memberOf Clause
     * @description
     *      key の値が values で指定されたすべてを含んでいるかの条件を示す Nebula.Clause インスタンスを生成する
     * @example
     *      var targets = ["ssl", "security"];
     *      var clause = Nebula.Clause.all("tags", targets);
     * @param {String} key 比較するキー名
     * @param {Object} values 比較する値の配列
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static all(key: string, values: AnyJson[]): Clause {
        return new Clause().all(key, values);
    }

    /**
     * @memberOf Clause
     * @description
     *      key の値が values で指定されたすべてを含んでいるかの条件を追加する
     * @example
     *      var targets = ["ssl", "security"];
     *      var clause = new Nebula.Clause().all("tags", targets);
     * @param {String} key 比較するキー名
     * @param {Object} values 比較する値の配列
     * @return {Clause} this
     */
    all(key: string, values: AnyJson[]): Clause {
        return this._setParams(key, "$all", values);
    }

    /**
     * @memberOf Clause
     * @description
     *      key で示したフィールドが存在するかどうかを示す Nebula.Clause インスタンスを生成する
     * @example
     *      var clause = Nebula.Clause.exist("tags", targets);
     * @param {String} key 比較するキー名
     * @param {Boolean} value 存在を確認する場合は true、 存在しないことを確認する場合は false を指定する。
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static exist(key: string, value: boolean): Clause {
        return new Clause().exist(key, value);
    }

    /**
     * @memberOf Clause
     * @description
     *      key で示したフィールドが存在するかどうかの条件を追加する
     * @example
     *      var clause = new Nebula.Clause().exist("tags", targets);
     * @param {String} key 比較するキー名
     * @param {Boolean} value 存在を確認する場合は true、 存在しないことを確認する場合は false を指定する。
     * @return {Clause} this
     */
    exist(key: string, value: boolean): Clause {
        if (typeof value === "boolean") {
            return this._setParams(key, "$exists", value);
        }

        throw new Error("exist: value is not boolean");
    }

    /**
     * @memberOf Clause
     * @description
     *      正規表現による検索条件を示す Nebula.Clause インスタンスを生成する
     * @example
     *      var clause = Nebula.Clause.regex("name", "abc*");
     * @param {String} key 比較するキー名
     * @param {String} expression Perl互換の正規表現の条件文字列
     * @param {Object} option オプション
     *      <br />option には必要に応じて以下の値を指定してもよい。(省略可能)
     *      <pre>Nebula.RegexOption.CASE_INSENSITIVITY   大文字小文字を区別しない</pre>
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static regex(key: string, expression: string, option?: string): Clause {
        return new Clause().regex(key, expression, option);
    }

    /**
     * @memberOf Clause
     * @description
     *      正規表現による検索条件を追加する
     * @example
     *      var clause = new Nebula.Clause().regex("name", "abc*");
     * @param {String} key 比較するキー名
     * @param {String} expression Perl互換の正規表現の条件文字列
     * @param {Object} option オプション
     *      <br />option には必要に応じて以下の値を指定してもよい。(省略可能)
     *      <pre>Nebula.RegexOption.CASE_INSENSITIVITY   大文字小文字を区別しない</pre>
     * @return {Clause} this
     */
    regex(key: string, expression: string, option?: string): Clause {
        return this._setParams(key, "$regex", expression, option);
    }

    /**
     * @memberOf Clause
     * @description
     *      Nebula.Clause インスタンスの key の条件を反転させる
     * @example
     *      var clause = Nebula.Clause.exist("tags", targets);
     *      clause.not("tags");
     * @param {String} key 比較するキー名
     * @return {Clause} Nebula.Clause インスタンス(this)を返す。
     */
    not(key: string): Clause {
        let data: JsonObject;

        if (this._clause === null || !(this._clause[key] != null)) {
            return null;
        } else if (_isObject(this._clause[key])) {
            data = {
                "$not": this._clause[key]
            };

            this._clause[key] = data;
        } else {
            data = {
                "$not": {
                    "$eq": this._clause[key]
                }
            };

            this._clause[key] = data;
        }

        return this;
    }

    /**
     * @memberOf Clause
     * @description
     *      複数の条件を AND条件で結合する
     * @example
     *      var clause1 = Nebula.Clause.equals("name", "AAA");
     *      var clause2 = Nebula.Clause.lessThan("score", 50);
     *      var clause3 = Nebula.Clause.greaterThan("score", 30);
     *      var clause = Nebula.Clause.and(clause1, clause2, clause3);
     * @param {Clause} clauses AND条件をとるNebula.Clauseインスタンス
     *      <br />複数のインスタンスを指定できる
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static and(...clauses: Clause[]): Clause {
        const values = Clause._convertClauseArray(clauses);
        return new Clause()._setParams("$and", null, values);
    }

    /**
     * @memberOf Clause
     * @description
     *      複数の条件を OR条件で結合する
     * @example
     *      var clause1 = Nebula.Clause.equals("name", "AAA");
     *      var clause2 = Nebula.Clause.lessThan("score", 50);
     *      var clause3 = Nebula.Clause.greaterThan("score", 30);
     *      var clause = Nebula.Clause.or(clause1, clause2, clause3);
     * @param {Clause} clauses OR条件をとるNebula.Clauseインスタンス
     *      <br />複数のインスタンスを指定できる
     * @return {Clause} Nebula.Clause インスタンスを返す。
     */
    static or(...clauses: Clause[]): Clause {
        const values = Clause._convertClauseArray(clauses);
        return new Clause()._setParams("$or", null, values);
    }

    /**
     * @memberOf Clause
     * @description Nebula.Clause インスタンスの配列からJSON値の配列を生成する
     * @private
     */
    static _convertClauseArray(clauseArray: Clause[]): AnyJson[] {
        const values: AnyJson[] = [];

        for (const clause of clauseArray) {
            const value = clause.json();

            if (value != null) {
                values.push(value);
            }
        }

        return values;
    }
}
