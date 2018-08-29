import {Clause} from "./Clause";
import {_compareObject, _isObject, JsonObject, nbLogger} from "./Head";

/*
 * オブジェクトストレージ クエリクラス
 */
export class ObjectQuery {
    _clause: Clause;
    _limit: number;
    _skip: number;
    _sort: string[];
    _deleteMark: boolean;
    _countQuery: boolean;
    _projection: JsonObject;

    /**
     * @class ObjectQuery
     * @classdesc オブジェクトクエリ
     * @description オブジェクトクエリを生成する
     * @example
     *     var query = new Nebula.ObjectQuery();
     */
    constructor() {
        this._clause = null;
        this._limit = -1;
        this._skip = 0;
        this._sort = [];
        this._deleteMark = false;
        this._countQuery = false;
        this._projection = null;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description 設定されているClauseインスタンスを取得する
     * @return {Clause} clause
     */
    getClause(): Clause {
        return this._clause;
    }


    /**
     * @function
     * @memberOf ObjectQuery
     * @description 設定されている検索上限数を取得する
     * @return {number} 検索上限数
     */
    getLimit(): number {
        return this._limit;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description 設定されているスキップカウントを取得する
     * @return {number} スキップカウント
     */
    getSkipCount(): number {
        return this._skip;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description 設定されているソート順序を取得する。
     * ソート順序は以下のようなキー文字列の配列。降順の場合はキーの先頭が "-" となる。
     * <pre>
     *     ["key1", "-key2"]
     * </pre>
     * @return {string[]}
     * @since 6.5.0
     */
    getSort(): string[] {
        return this._sort;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description 設定されているソート順序を取得する。
     * <p>
     * Deprecated である。{@link ObjectQuery#getSort} を使用すること。
     * <p>
     * ソート順序は以下のように {キー名: 昇順フラグ} の配列。
     * <pre>
     *     [{"key1": true}, {"key2": false}]
     * </pre>
     * @return {array} ソート順序
     * @deprecated since 6.5.0
     */
    getSortOrder(): Array<{[index:string]: boolean}> {
        const result: Array<{[index:string]: boolean}> = [];
        for (let i = 0; i < this._sort.length; i++) {
            const key = this._sort[i];
            const e: {[index:string]: boolean} = {};

            if (key.match(/^-/)) {
                e[key.substr(1)] = false;
            } else {
                e[key] = true;
            }
            result.push(e);
        }
        return result;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description deleteフラグを取得する
     * @private
     */
    _getDeleteMark(): boolean {
        return this._deleteMark;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description 設定されているプロジェクションを取得する
     * @return {Object} プロジェクション
     */
    getProjection(): JsonObject {
        return this._projection;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description deleteフラグをセットする
     * @private
     */
    _setDeleteMark(mark: boolean) {
        if (typeof mark === "boolean") {
            nbLogger("ObjectQuery._setDeleteMark(), mark=" + mark + ", cur=" + this._deleteMark);
            this._deleteMark = mark;
        } else {
            throw new Error("deleteMark must be boolean");
        }
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description 内部データをクエリパラメータ Object に変換する
     * @private
     */
    _toParam() {
        const json = this._toParamJson();
        if (json.where) {
            json.where = JSON.stringify(json.where);
        }
        if (json.projection) {
            json.projection = JSON.stringify(json.projection);
        }
        return json;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description 内部データを JSON Object に変換する
     * @private
     */
    _toParamJson() {
        const json: any = {};
        if (this._clause) {
            json.where = this._clause.json();
        }

        if (this._sort.length > 0) {
            json.order = this._sort.join(",");
        }

        json.skip = this._skip;
        json.limit = this._limit;

        if (this._countQuery) {
            json.count = 1;
        }
        if (this._deleteMark) {
            json.deleteMark = 1;
        }
        if (this._projection) {
            json.projection = this._projection;
        }

        return json;
    }


    /**
     * @function
     * @memberOf ObjectQuery
     * @description QUERY情報(JSON)をNebula.ObjectQueryインスタンスに変換する
     * @private
     */
    static _toObjectQuery(queryJson: any): ObjectQuery {
        const query = new ObjectQuery();

        nbLogger("ObjectQuery._toObjectQuery(), queryJson=" + JSON.stringify(queryJson));
        if (queryJson["limit"] != null) {
            query.setLimit(queryJson["limit"]);
        }

        if (queryJson["skip"] != null) {
            query.setSkipCount(queryJson["skip"]);
        }

        const sort: any = queryJson["sort"];
        if (sort != null) {
            for (const sortKey of Object.keys(sort)) { // TODO: Object ではなく Array のはずでは？
                query.setSortOrder(sortKey, sort[sortKey]);
            }
        }

        const clause: any = queryJson["clause"];
        if (clause != null && Object.keys(clause).length !== 0) {
            query.setClause(new Clause(clause));
        }

        if (queryJson["deleteMark"] != null) {
            query._setDeleteMark(queryJson["deleteMark"]);
        }

        if (queryJson["countQuery"] != null) {
            query._setCountQuery(queryJson["countQuery"]);
        }

        return query;
    }


    /**
     * @function
     * @memberOf ObjectQuery
     * @description NebulaObjectQueryインスタンスを比較する
     * @private
     */
    _equals(that: ObjectQuery): boolean {
        if (this._limit !== that.getLimit()) {
            return false;
        }
        if (this._skip !== that.getSkipCount()) {
            return false;
        }
        if (this._deleteMark !== that._getDeleteMark()) {
            return false;
        }
        if (this._countQuery !== that._isCountQuery()) {
            return false;
        }
        if (this._projection) {
            if (that.getProjection()) {
                if (!_compareObject(this._projection, that.getProjection())) {
                    return false;
                }
            }
            else {
                return false;
            }
        } else {
            if (that.getProjection()) {
                return false;
            }
        }

        if (this._clause) {
            if (that.getClause()) {
                if (!_compareObject(this._clause.json(), that.getClause().json())) {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            if (that.getClause()) {
                return false;
            }
        }

        return _compareObject(this._sort, that.getSortOrder());
    }

    /**
     * @memberOf ObjectQuery
     * @description
     *      検索条件を設定する
     * @example
     *      var clause = Nebula.Clause.lessThan("score", 50);
     *      var query = new Nebula.ObjectQuery();
     *      query.setClause(clause);
     * @param {Clause} clause Nebula.Clauseインスタンス
     *      <br/>null を指定した場合は、すでに設定済みの検索条件をクリアする。
     *      <br/>再度、本メソッドを呼び出した場合、検索条件は上書きされる。
     *      <br/>デフォルトでは、null が設定されている。
     * @return {ObjectQuery} this
     */
    setClause(clause: Clause): ObjectQuery {
        if (clause === null || clause instanceof Clause) {
            this._clause = clause;
        } else {
            throw new Error("clause must be instanceof Nebula.Clause or null");
        }
        return this;
    }

    /**
     * @memberOf ObjectQuery
     * @description
     *      検索上限数を設定する
     * @example
     * var clause = Nebula.Clause.lessThan("score", 50);
     * var query = new Nebula.ObjectQuery()
     *     .setClause(clause)
     *     .setLimit(10);
     * @param {number} limit 検索上限数。
     * <p>
     * -1 以上の値を指定できる。
     * -1を設定した場合は「制限なし」となる。
     * ただし、サーバ側のコンフィグレーションによっては、上限値が制限されている場合がある。この場合、クエリを実行するとサーバからエラーが返る。
     * デフォルトでは、-1 が設定されている。
     * <p>
     * 範囲外の値が設定された場合は、例外をスローする。
     * @return {ObjectQuery} this
     */
    setLimit(limit: number): ObjectQuery {
        if (limit >= -1) {
            this._limit = limit;
        } else {
            throw new Error("Invalid limit range");
        }
        return this;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description スキップカウントを設定する。
     * <p>
     * スキップカウントは検索結果の先頭からのスキップ数を表す。
     * @example
     * // この例では検索結果の5件目から10件を取得する。
     * var clause = Nebula.Clause.lessThan("score", 50);
     * var query = new Nebula.ObjectQuery()
     *     .setClause(clause)
     *     .setLimit(10)
     *     .setSkipCount(5);
     * @param {number} skip スキップカウント
     * <p>
     * skip は、0以上の値が設定可能である。
     * 範囲外の値が設定された場合は、例外をスローする。
     * デフォルトでは、0 が設定されている。
     * @return {ObjectQuery} this
     */
    setSkipCount(skip: number): ObjectQuery {
        if (skip >= 0) {
            this._skip = skip;
        } else {
            throw new Error("Invalid skip range");
        }
        return this;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description ソート順序を設定する。
     * @example
     * var query = new Nebula.ObjectQuery()
     *     .setSort(["key1", "-key2"]);
     * @param {string[]} sort ソートキーの配列。
     * 先に指定したものが高優先となる。
     * <p>それぞれデフォルトは昇順。降順の場合は先頭に "-" を付与する。
     * @return {ObjectQuery} this
     * @since 6.5.0
     */
    setSort(sort: string[]): ObjectQuery {
        this._sort = sort;
        return this;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description ソート順序を設定する。
     * <p>
     * 本メソッドはDeprecated である。{@link ObjectQuery#setSort} を使用すること。
     * <p>
     * 複数のキーを設定する場合は、本メソッドを複数呼び出す。
     * 先に設定したキーのほうが優先順位が高い。
     * <p>
     * ソート順序をクリアするには {@link ObjectQuery#clearSortOrder} を使用する。
     * @example
     * // 以下の例では、score降順 -> name昇順で検索する
     * var query = new Nebula.ObjectQuery()
     *     .setSortOrder("score", false)
     *     .setSortOrder("name", true);
     * @param {string} key ソート対象のキー
     * @param {boolean} isAsc 昇順でソートするかどうかを示す。昇順はtrue, 降順はfalse。
     * @return {ObjectQuery} this
     * @deprecated since 6.5.0
     */
    setSortOrder(key: string, isAsc: boolean): ObjectQuery {
        if (!key) {
            throw new Error("No key");
        }

        if (typeof isAsc !== "boolean") {
            throw new Error("isAsc must be boolean");
        }

        if (isAsc) {
            this._sort.push(key);
        } else {
            this._sort.push("-" + key);
        }

        return this;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description 設定したソート順序をクリアする。<p>
     * Deprecated である。{@link ObjectQuery#setSort} を使用すること。
     * @example
     * var clause = Nebula.Clause.lessThan("score", 50);
     * var query = new Nebula.ObjectQuery()
     *     .setClause(clause)
     *     .setLimit(10)
     *     .setSkipCount(5)
     *     .setSortOrder("name", true);
     * ....
     * query.clearSortOrder("name");
     * @param {string} key クリアするソート対象のキー。省略時は全キーをクリアする。
     * @return {ObjectQuery} this
     * @deprecated since 6.5.0
     */
    clearSortOrder(key: string = null): ObjectQuery {
        if (!key) {
            // clear all
            this._sort = [];
            //throw new Error("No key");
        } else {
            for (let i = 0; i < this._sort.length; i++) {
                const k = this._sort[i];
                if (k === key || k === "-" + key) {
                    this._sort.splice(i, 1);
                    break;
                }
            }
        }
        return this;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description
     *      クエリ件数取得フラグを設定する.
     *      <br><br>
     *      クエリ件数取得フラグは、Nebula.ObjectBucket.query() を実行したときに
     *      クエリに合致した件数を取得するかどうかを表し、trueの場合は取得することを示す。
     *      <br>
     *      クエリ件数取得フラグのデフォルト値は、falseである。
     * @example
     *      var bucket = ....;
     *      var clause = Nebula.Clause.lessThan("score", 50);
     *      var conditions = new Nebula.ObjectQuery();
     *      conditions.setClause(clause);
     *      conditions.setLimit(10);
     *      conditions._setCountQuery(true);
     *      ....
     *      callbacks = {
     *          success: function(objects, count) {
     *              // count にクエリ件数が格納され、は検索条件数には依存せず、
     *              // 全体でクエリ条件に合致するオブジェクトの数がcountに格納される。
     *              // (objectsに格納されてるオブジェクトの数とcountは一致しないことがある)
     *          },
     *          error: function(err) {....}
     *      };
     *      conditions.query(conditions, callbacks);
     * @param {Boolean} countQuery クエリ件数取得フラグ
     *      <br/>true または false を指定する。
     * @private
     */
    _setCountQuery(countQuery: boolean): ObjectQuery {
        if (typeof countQuery === "boolean") {
            this._countQuery = countQuery;
        } else {
            throw new Error("countQuery must be boolean");
        }
        return this;
    }


    /**
     * @function
     * @memberOf ObjectQuery
     * @description
     *      クエリ件数取得フラグを取得する.
     *      <br><br>
     *      クエリ件数取得フラグのデフォルト値は、falseである。
     * @example
     *      var bucket = ....;
     *      ....
     *      var conditions = new Nebula.ObjectQuery();
     *      conditions.setCountQuery(true);
     *      ....
     *      callbacks = {
     *          success: function(objects, count) {
     *              if (conditions.isCountQuery()) {
     *                  ....
     *              }
     *          },
     *          error: function(err) {....}
     *      };
     *      conditions.query(conditions, callbacks);
     * @return
     *      {Boolean} クエリ件数取得フラグ(trueまたはfalse)を返す
     * @private
     */
    _isCountQuery(): boolean {
        return this._countQuery;
    }

    /**
     * @function
     * @memberOf ObjectQuery
     * @description
     *      プロジェクションを指定する。
     * @example
     *      var clause = Nebula.Clause.lessThan("score", 50);
     *      var projection = {"score":1};
     *      var query = new Nebula.ObjectQuery();
     *      query.setClause(clause);
     *      query.setProjection(projection);
     * @param {Object} projectionJson
     *      <br/>null を指定した場合は、すでに設定済みの値をクリアする。
     *      <br/>再度、本メソッドを呼び出した場合は上書きされる。
     *      <br/>デフォルトでは、null が設定されている。
     * @return {ObjectQuery} this
     */
    setProjection(projectionJson: JsonObject): ObjectQuery {
        if (projectionJson && _isObject(projectionJson)) {
            this._projection = projectionJson;
        } else if (projectionJson === null) {
            this._projection = null;
        } else {
            throw new Error("projection must be object or null");
        }
        return this;
    }
}
