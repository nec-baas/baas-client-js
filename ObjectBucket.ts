import {BaseBucket} from "./BaseBucket";
import {Nebula} from "./Nebula";
import {NebulaService} from "./NebulaService";
import {_compareObject, _createError, _errorText, _promisify, Callbacks, JsonObject, nbError, nbLogger} from "./Head";
import {Acl} from "./Acl";
import {ApiRequest, HttpRequest, QueryParams} from "./HttpRequest";
import {_SdeRequest} from "./SdeRequest";
import {ObjectQuery} from "./ObjectQuery";
import {_SdeSyncEventListener, ResolveConflictParams, SyncEventListener} from "./SdeSyncEventListener";
import {BatchRequest, BatchResponseJson} from "./BatchRequest";

import {Promise} from "es6-promise";

/**
 * ObjectBucket 実装
 * @private
 */
export class ObjectBucket extends BaseBucket {
    _resolveId: string;

    /**
     * @name ObjectBucket.useLongQuery
     * @description
     *   true に設定すると、クエリはすべて longQuery 扱いとなる。
     *   デフォルトは false。
     * @since 5.0.0
     */
    static useLongQuery = false; // dummy, 実態は ObjectBucket のほうが使われる

    /**
     * 衝突解決ポリシ: 手動解決(ユーザ通知)
     * @name ObjectBucket.CONFLICT_POLICY_MANUAL
     * @const
     */
    static CONFLICT_POLICY_MANUAL = 0;

    /**
     * 衝突解決ポリシ: クライアント優先
     * @name ObjectBucket.CONFLICT_POLICY_CLIENT
     * @const
     */
    static CONFLICT_POLICY_CLIENT = 1;

    /**
     * 衝突解決ポリシ: サーバ優先
     * @name ObjectBucket.CONFLICT_POLICY_SERVER
     * @const
     */
    static CONFLICT_POLICY_SERVER = 2;

    static RESOLVE_CONFLICT_UNDEFINED = -1;
    static RESOLVE_CONFLICT_CLIENT = 1;
    static RESOLVE_CONFLICT_SERVER = 2;

    /**
     * 同期エラー: その他のエラー
     * @name ObjectBucket.SYNC_ERROR_UNDEFINED
     * @const
     */
    static SYNC_ERROR_UNDEFINED = -1;

    /**
     * 同期エラー: PUSHエラー
     * @name ObjectBucket.SYNC_ERROR_PUSH
     * @const
     */
    static SYNC_ERROR_PUSH = 0;

    /**
     * 同期エラー: PULLエラー
     * @name ObjectBucket.SYNC_ERROR_PULL
     * @const
     */
    static SYNC_ERROR_PULL = 1;

    /**
     * 同期エラー: ID衝突
     * @name ObjectBucket.SYNC_ERROR_OVERLAP_ID
     * @const
     */
    static SYNC_ERROR_OVERLAP_ID = 2;

    /**
     * 同期エラー: PUSHエラー後、同期リトライ中
     * @name ObjectBucket.SYNC_ERROR_PUSH_RESYNCING
     * @const
     */
    static SYNC_ERROR_PUSH_RESYNCING = 3;

    /**
     * @class ObjectBucket
     * @classdesc オブジェクトバケット
     * @description ObjectBucket インスタンスを生成する
     * @example
     *    var bucket = new Nebula.ObjectBucket("bucket1");
     * @param {string} name バケットの名前
     * @param {number} mode バケットモード。
     * <p>
     * バケットモードには、以下のいずれかを指定する。
     * <ul>
     *   <li>{@link Nebula.BUCKET_MODE_ONLINE} ： オンラインモード
     *   <li>{@link Nebula.BUCKET_MODE_REPLICA}： レプリカモード
     *   <li>{@link Nebula.BUCKET_MODE_LOCAL} ： ローカルモード
     * </ul>
     * modeを省略した場合や上記以外が指定された場合は、オンラインモードとして処理する。
     */
    constructor(name: string, mode: number = Nebula.BUCKET_MODE_ONLINE, service: NebulaService = Nebula) {
        super(service, name, "object", mode);
        this._resolveId = null;
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットを取得する
     * @example
     *      callbacks = {
     *          success: function(bucket) {....},
     *          error: function(err) {....}
     *      };
     *      Nebula.ObjectBucket.loadBucket("Books", callbacks);
     * @param {string} name 取得するバケットの名前
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(bucket)
     *             bucket : Nebula.ObjectBucketのインスタンス
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 取得に失敗したバケットの名前(nameと同じ)
     *              }
     * </pre>
     * @param {number} mode バケットモード
     * <p>
     * バケットモードには、以下のいずれかを指定する。
     * <ul>
     *   <li>{@link Nebula.BUCKET_MODE_ONLINE} ： オンラインモード
     *   <li>{@link Nebula.BUCKET_MODE_REPLICA}： レプリカモード
     *   <li>{@link Nebula.BUCKET_MODE_LOCAL} ： ローカルモード
     * </ul>
     * modeを省略した場合や上記以外が指定された場合は、オンラインモードとして処理する。
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     *      ただし、modeを指定する場合は、callbacksにnullを指定すること(省略不可)
     */
    static loadBucket(name: string, callbacks?: Callbacks, mode?: number): Promise<ObjectBucket> { return null; }

    protected static _loadBucket(service: NebulaService, name: string, callbacks?: Callbacks, mode?: number): Promise<ObjectBucket> {
        nbLogger("ObjectBucket.loadBucket(), name=" + name + ", callbacks=" + callbacks);
        return BaseBucket._baseLoadBucket("object", service, name, mode, callbacks) as Promise<ObjectBucket>;
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットのバケット名一覧を取得する
     * @example
     *      callbacks = {
     *          success: function(bucketList) {....},
     *          error: function(error) {....}
     *      };
     *      Nebula.ObjectBucket.getBucketList(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(bucketList)
     *             bucketList : バケットの名前の配列
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static getBucketList(callbacks?: Callbacks): Promise<string[]> { return null; }

    protected static _getBucketList(service: NebulaService, callbacks?: Callbacks): Promise<string[]> {
        nbLogger("ObjectBucket.getBucketList(), callbacks=" + callbacks);
        return BaseBucket._baseGetBucketList("object", service, false, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      ローカル上に保存されているオブジェクトバケットのバケット名一覧を取得する.
     *      本APIはオフラインのみで利用可能
     * @example
     *      callbacks = {
     *          success: function(bucketList) {....},
     *          error: function(error) {....}
     *      };
     *      Nebula.ObjectBucket.getLocalBucketList(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(bucketList)
     *             bucketList : バケットの名前の配列
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static getLocalBucketList(callbacks?: Callbacks): Promise<string[]> { return null; }

    protected static _getLocalBucketList(service: NebulaService, callbacks?: Callbacks): Promise<string[]> {
        nbLogger("ObjectBucket.getLocalBucketList(), callbacks=" + callbacks);
        return BaseBucket._baseGetBucketList("object", service, true, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットを保存する.
     *      バケットはテナント毎に作成される。同一テナント内では同一名称のバケットを複数作成できない。
     * @example
     *      var bucket = new Nebula.ObjectBucket("Person");
     *      ....
     *      callbacks = {
     *          success: function(bucket) {....},
     *          error: function(bucket, err) {....}
     *      };
     *      bucket.saveBucket(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(bucket)
     *             bucket : Nebula.ObjectBucket インスタンス
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : Nebula.ObjectBucket インスタンス
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    saveBucket(callbacks?: Callbacks): Promise<ObjectBucket> {
        return super.saveBucket(callbacks) as Promise<ObjectBucket>;
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットを削除する.
     *      バケットを削除する場合、事前にバケット内に格納されている全データを削除しておく必要がある。
     * @example
     *      var bucket = new Nebula.ObjectBucket("Person");
     *      ....
     *      callbacks = {
     *          success: function(bucket) {....},
     *          error: function(bucket, err) {....}
     *      };
     *      bucket.deleteBucket(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(bucket)
     *             bucket : Nebula.ObjectBucket インスタンス
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : Nebula.ObjectBucket インスタンス
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    deleteBucket(callbacks?: Callbacks): Promise<ObjectBucket> {
        return super.deleteBucket(callbacks) as Promise<ObjectBucket>;
    }

    /**
     * @memberOf ObjectBucket
     * @description
     * オブジェクトバケットのACLを設定する。
     * <p>
     * 本メソッドを呼び出しただけでは、サーバに格納されているオブジェクトバケットは更新されない。
     * サーバと同期するには、saveBucket()を呼び出す必要がある。
     * @example
     *      var bucket = ....;
     *      var acl = new Nebula.Acl();
     *      ....
     *      acl.addEntry(....);
     *      ....
     *      bucket.setAcl(acl);
     * @param {Acl} acl Nebula.ACL のインスタンス
     * @return {ObjectBucket} this
     */
    setAcl(acl: Acl): ObjectBucket {
        super.setAcl(acl);
        return this;
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットのACLを取得する。
     *      <p>
     *      オブジェクトバケットのACLを取得するには、loadBucket()を使用してサーバのバケット情報をロードしておく必要がある。
     * @example
     *      var bucket = ....;
     *      ....
     *      var acl = bucket.getAcl();
     * @return
     *      {Acl} オブジェクトバケットのACL
     */
    getAcl(): Acl {
        return super.getAcl();
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットのコンテンツACLを設定する。
     *      <p>本メソッドを呼び出しただけでは、サーバに格納されているオブジェクトバケットは更新されない。
     *      サーバと同期するには、saveBucket()を呼び出す必要がある。
     * @example
     *      var bucket = ....;
     *      var acl = new Nebula.Acl();
     *      ....
     *      acl.addEntry(....);
     *      ....
     *      bucket.setContentAcl(acl);
     * @param {Acl} acl Nebula.ACL のインスタンス
     * @return {ObjectBucket} this
     */
    setContentAcl(acl: Acl): ObjectBucket {
        super.setContentAcl(acl);
        return this;
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットのコンテンツACLを取得する。
     *      <p>オブジェクトバケットのコンテンツACLを取得するには、loadBucket()を使用してサーバのバケット情報をロードしておく必要がある。
     * @example
     *      var bucket = ....;
     *      ....
     *      var acl = bucket.getAcl();
     * @return {Acl} オブジェクトバケットのコンテンツACL
     */
    getContentAcl(): Acl {
        return super.getContentAcl();
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットに「説明文」を設定する。
     *      <p>
     *      本メソッドを呼び出しただけでは、サーバに格納されているオブジェクトバケットは更新されない。
     *      サーバと同期するには、saveBucket()を呼び出す必要がある。
     * @example
     *      var bucket = ....;
     *      ....
     *      bucket.setDescription("このバケットの説明文");
     * @param {string} description オブジェクトバケットの「説明文」
     */
    setDescription(description: string) {
        return super.setDescription(description);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットの「説明文」を取得する。
     *      <p>
     *      オブジェクトバケットの「説明文」を取得するには、loadBucket()を使用してサーバのバケット情報をロードしておく必要がある。
     * @example
     *      var bucket = ....;
     *      ....
     *      var description = bucket.getDescription();
     * @return
     *      {string} オブジェクトバケットに設定されている「説明文」
     */
    getDescription(): string {
        return super.getDescription();
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケット名を取得する
     * @example
     *      var bucket = ....;
     *      ....
     *      var bucketName = bucket.getBucketName();
     * @return
     *      {string} オブジェクトバケット名
     */
    getBucketName(): string {
        return super.getBucketName();
    }

    /**
     * @memberOf ObjectBucket
     * @description バケット名をセットする
     * @private
     */
    _setBucketName(name: string) {
        return super.setBucketName(name);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      バケットモードを取得する
     * @example
     *      var bucket = ....;
     *      ....
     *      var bucketMode = bucket.getBucketMode();
     * @return
     *      {number} バケットモード
     */
    getBucketMode(): number {
        return super.getBucketMode();
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットからオブジェクトを読み込む
     * @example
     *      var bucket = ....;
     *      ....
     *      callbacks = {
     *          success: function(object) {....},
     *          error: function(objectId, err) {....}
     *      };
     *      bucket.load("object_id", callbacks);
     * @param {string} objectId オブジェクトID
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(object)
     *             object : 読み込んだオブジェクト(JSON)
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ
     *                  "data"          : 読み込みに失敗したオブジェクトID
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    load(objectId: string, callbacks?: Callbacks): Promise<JsonObject> {
        nbLogger("ObjectBucket.load()");

        if (objectId == null) {
            nbError("ObjectBucket.load(), Parameter is invalid");
            throw new Error("No objectId");
        }

        let req: ApiRequest;
        if (this._service.isOffline()) {
            req = new _SdeRequest(this.getClassName(), "load");
            const body = {
                bucketName: this.getBucketName(),
                bucketMode: this.getBucketMode(),
                objectId
            };
            req.setData(body);
        } else {
            const path = this.getDataPath("/" + objectId);
            req = new HttpRequest(this._service, path);
            req.setMethod("GET");
            req.setContentType("application/json");
        }

        const promise = req.execute().then((response) => {
            try {
                const resObj = JSON.parse(response);
                nbLogger("ObjectBucket.load(), success : response=" + response);
                return Promise.resolve(resObj);
            } catch (e) {
                nbLogger("ObjectBucket.load(), error : response=" + response);
                const errorResult = _createError(0, "Invalid response from server", e);
                errorResult.data = objectId;
                return Promise.reject(errorResult);
            }
        }, (err) => {
            nbLogger(("ObjectBucket.load(), error: " + (_errorText(err))));
            err.data = objectId;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットからオブジェクトを削除する
     * @example
     *      var bucket = ....;
     *      ....
     *      callbacks = {
     *          success: function(object) {....},
     *          error: function(objectId, err) {....}
     *      };
     *      bucket.remove("object_id", callbacks);
     * @param {string} objectId オブジェクトID
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(objectId)
     *             objectId : 削除に成功したオブジェクトID
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ
     *                  "data"          : 削除に失敗したオブジェクトID
     *              }
     * </pre>
     * @param {string} etag オブジェクトに含まれるETag値。
     *      <p>
     *      ETag値は、オブジェクトを新規保存した場合にサーバで追加され、
     *      オブジェクトを更新する度にサーバで変更される固有値である。
     *      <p>
     *      ETag値は、オブジェクトの "etag"プロパティに格納される。
     *      etagを指定すると、サーバに保存されているオブジェクトのETag値と照合される。
     *      <p>
     *      一致しなかった場合は、データ衝突として「409 Conflict」エラーとなり、オブジェクトは削除されない。
     *      etagを指定しなかった場合、または、nullを指定した場合は、ETag値は照合されずオブジェクトは無条件で削除される。
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * @since v4.0.1
     */
    remove(objectId: string, callbacks?: Callbacks, etag?: string): Promise<string> {
        nbLogger("ObjectBucket.delete)");

        if (!objectId) {
            nbError("ObjectBucket.remove(), Parameter is invalid");
            throw new Error("No objectId");
        }

        let req: ApiRequest;
        if (this._service.isOffline()) {
            req = new _SdeRequest(this.getClassName(), "delete");
            const body: JsonObject = {
                bucketName: this.getBucketName(),
                bucketMode: this.getBucketMode(),
                objectId
            };

            if (etag) {
                body.etag = etag;
            }

            req.setData(body);
        } else {
            const path = this.getDataPath("/" + objectId);
            req = new HttpRequest(this._service, path);
            req.setMethod("DELETE");
            req.setContentType("application/json");

            if (etag) {
                req.setQueryParam("etag", etag);
            }
        }

        const promise = req.execute().then((response) => {
            nbLogger("ObjectBucket.delete(), success");
            return objectId;
        }, err => {
            nbLogger(("ObjectBucket.delete(), error: " + (_errorText(err))));
            err.objectId = objectId;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットからオブジェクトを削除する (Deprecated)<p>
     * 本APIは Deprecated である。{@link ObjectBucket#remove} を使用すること。
     * @deprecated since v4.0.1
     */
    delete(objectId: string, callbacks?: Callbacks, etag?: string): Promise<string> {
        return this.remove(objectId, callbacks, etag);
    }

    /**
     * @memberOf ObjectBucket
     * @description オブジェクトバケットへオブジェクトを保存(upsert)する.
     * <p>
     * オブジェクトに "_id" フィールドが含まれる場合は更新、含まれない場合は挿入処理となる。
     * <p>
     * オブジェクトにETag値が含まれる場合、サーバに保存されているオブジェクトのETag値と照合される。
     * 一致しなかった場合は、データ衝突として「409 Conflict」エラーとなり、オブジェクトは更新されない。
     * <p>
     * ETag値は、オブジェクトを新規保存した場合にサーバで追加され、
     * オブジェクトを更新する度にサーバで変更される固有値である。
     * ETag値は、オブジェクトの "etag"プロパティに格納される。
     * オブジェクトの新規保存の場合は、etagがないため必ず保存される。
     * <p>
     * すでに存在するオブジェクトを保存する場合、オブジェクトに指定したフィールドのみが更新される。
     * 指定しないフィールドは更新されない(フィールドは削除されずそのまま残る)
     * @example
     *      var bucket = ....;
     *      ....
     *      var myObj = {....};
     *      ....
     *      callbacks = {
     *          success: function(object) {....},
     *          error: function(object, err) {....}
     *      };
     *      bucket.save(myObj, callbacks);
     * @param {Object} object 保存するオブジェクト
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(object)
     *             object : 保存に成功したオブジェクト(JSON)
     *                      新規オブジェクトの場合は、以下のフィールドが追加される。
     *                          _id : オブジェクトID
     *                          createdAt : 作成日時
     *                          updatedAt : 更新日時
     *                          ACL : このオブジェクトのACL。指定しなかった場合は追加される
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 保存に失敗したオブジェクトID
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    save(object: JsonObject, callbacks?: Callbacks): Promise<JsonObject> {
        nbLogger("ObjectBucket.save()");
        return this._save(object, !object._id, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description オブジェクトバケットへオブジェクトを保存(insert)する.
     * <p>
     * ETag値は、オブジェクトを新規保存した場合にサーバで追加され、
     * オブジェクトを更新する度にサーバで変更される固有値である。
     * ETag値は、オブジェクトの "etag"プロパティに格納される。
     * @example
     * var bucket = ....;
     * ....
     * var myObj = {....};
     * ....
     * bucket.insert(myObj)
     *     .then(function(object) {...})
     *     .catch(function(err) {...});
     * @param {Object} object 保存するオブジェクト
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: 保存に成功したオブジェクト(JSON)。
     * <br>新規オブジェクトの場合は、以下のフィールドが追加される。
     * <ul>
     *      <li>_id : オブジェクトID
     *      <li>createdAt : 作成日時
     *      <li>updatedAt : 更新日時
     *      <li>ACL : このオブジェクトのACL。指定しなかった場合は追加される
     * </ul>
     * <li>失敗時: 以下JSON形式で表されるエラー要因
     * <pre>
     *     {
     *         "status"        : ステータスコード,
     *         "statusText"    : エラーメッセージ,
     *         "responseText"  : レスポンスメッセージ,
     *         "data"          : 保存に失敗したオブジェクト
     *     }
     * </pre>
     * </ul>
     * @see #save
     * @since 7.5.1
     */
    insert(object: JsonObject, callbacks?: Callbacks): Promise<JsonObject> {
        nbLogger("ObjectBucket.insert()");
        return this._save(object, true, callbacks);
    }

    _save(object: JsonObject, isNew: boolean, callbacks?: Callbacks): Promise<JsonObject> {
        if (!object) {
            nbError("ObjectBucket.save/insert, Parameter is invalid");
            throw new Error("No object");
        }

        let req: ApiRequest;
        if (this._service.isOffline()) {
            req = new _SdeRequest(this.getClassName(), "save");
            const body = {
                object,
                bucketName: this.getBucketName(),
                bucketMode: this.getBucketMode()
            };
            req.setData(body);
        } else {
            const queryParams: QueryParams = {};
            let path: string, method: string;

            if (!isNew) {
                path = this.getDataPath("/" + object._id);
                method = "PUT";

                if (object.etag != null) {
                    queryParams.etag = object.etag as string;
                }
            } else {
                path = this.getDataPath();
                method = "POST";
            }

            nbLogger("ObjectBucket.save(), path=" + path);
            req = new HttpRequest(this._service, path);
            req.setContentType("application/json");
            req.setMethod(method);
            req.setQueryParams(queryParams);
            req.setData(object);
        }

        const promise = req.execute().then(response => {
            try {
                const resObj = JSON.parse(response);
                nbLogger("ObjectBucket.save(), success");
                return resObj;
            } catch (e) {
                nbLogger("ObjectBucket.save(), error : exception=" + e);
                const errorResult = _createError(0, "Invalid response from server", e);
                errorResult.data = object;
                return Promise.reject(errorResult);
            }
        }, err => {
            nbLogger(("ObjectBucket.save(), error: " + (_errorText(err))));
            err.data = object;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットからオブジェクトを検索する
     * @example
     *      var bucket = ....;
     *      ....
     *      var query = new Nebula.ObjectQuery();
     *      ....
     *      callbacks = {
     *          success: function(objects) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.query(query, callbacks);
     * @param {ObjectQuery} aQuery Nebula.ObjectQuery インスタンス
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(objects)
     *             objects : オブジェクト(JSON)の配列
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    query(aQuery: ObjectQuery, callbacks?: Callbacks): Promise<JsonObject[]> {
        return this._query(aQuery, {
            longQuery: this._service.ObjectBucket.useLongQuery
        }, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *     オブジェクトバケットからオブジェクトを検索する。
     *     {@link ObjectBucket#query} と同じだが、クエリサイズの制限はない。
     * @param {ObjectQuery} aQuery ObjectQuery インスタンス
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * @return {Promise} Promise
     * @since 5.0.0
     */
    longQuery(aQuery: ObjectQuery, callbacks?: Callbacks): Promise<JsonObject[]> {
        return this._query(aQuery, {
            longQuery: true
        }, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットからオブジェクトを検索する(クエリ件数付き)
     * @example
     *      var bucket = ....;
     *      ....
     *      var query = new Nebula.ObjectQuery();
     *      ....
     *      callbacks = {
     *          success: function(result) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.query(query, callbacks);
     * @param {ObjectQuery} aQuery ObjectQuery インスタンス
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(result)
     *             result.objects : オブジェクト(JSON)の配列
     *             result.count   : 検索条件に合致したオブジェクトの総数
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    queryWithCount(aQuery: ObjectQuery, callbacks?: Callbacks): Promise<JsonObject> {
        return this._query(aQuery, {
            countQuery: true,
            longQuery: this._service.ObjectBucket.useLongQuery
        }, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *     オブジェクトバケットからオブジェクトを検索する(クエリ件数付き)
     *     queryWithCount() と同じだが、クエリサイズの制限はない。
     * @param {ObjectQuery} aQuery Nebula.ObjectQuery インスタンス
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * @return {Promise} Promise
     * @since 5.0.0
     */
    longQueryWithCount(aQuery: ObjectQuery, callbacks?: Callbacks): Promise<JsonObject> {
        return this._query(aQuery, {
            countQuery: true,
            longQuery: true
        }, callbacks);
    }

    // クエリ本体
    private _query(aQuery: ObjectQuery, option: any, callbacks?: Callbacks): Promise<any/*JsonObject[]|JsonObject*/> {
        nbLogger("ObjectBucket.query()");

        if (option.countQuery) {
            if (aQuery == null) {
                aQuery = new ObjectQuery();
            }

            aQuery._setCountQuery(option.countQuery);
        }

        let req: ApiRequest;
        let path: string;
        if (this._service.isOffline()) {
            req = new _SdeRequest(this.getClassName(), "query");
            const body: JsonObject = {};

            if (aQuery != null) {
                if (aQuery.getClause() != null && aQuery.getClause().json() != null) {
                    body.clause = aQuery.getClause().json();
                }

                body.limit = aQuery.getLimit();
                body.skip = aQuery.getSkipCount();
                body.sort = aQuery.getSort();
                body.deleteMark = aQuery._getDeleteMark();
                body.countQuery = aQuery._isCountQuery();
            }

            body.bucketName = this.getBucketName();
            body.bucketMode = this.getBucketMode();
            req.setData(body);
        } else if (!option.longQuery) {
            path = this.getDataPath();
            req = new HttpRequest(this._service, path);
            req.setMethod("GET");

            if (aQuery != null) {
                req.setQueryParams(aQuery._toParam());
            }
        } else {
            path = this.getDataPath("/_query");
            req = new HttpRequest(this._service, path);
            req.setMethod("POST");
            req.setContentType("application/json");

            req.setData((aQuery != null) ? aQuery._toParamJson() : {});
        }

        const promise = req.execute().then(response => {
            try {
                const resObj = JSON.parse(response);
                const objects = resObj.results;
                nbLogger("ObjectBucket.query(), success : size=" + objects.length);

                if (aQuery != null && aQuery._isCountQuery() === true) {
                    let count = -1;

                    if (resObj.count != null) {
                        count = resObj.count;
                    }

                    return {
                        objects,
                        count
                    };
                } else {
                    return objects;
                }
            } catch (e) {
                nbLogger("ObjectBucket.query(), error : exception=" + e);
                const errorResult = _createError(0, e.toString(), e);
                return Promise.reject(errorResult);
            }

        }, err => {
            nbLogger(("ObjectBucket.query(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /// Offline

    private _checkOfflineService() {
        if (this._service !== Nebula) {
            nbError("ObjectBucket.setSyncScope(): Can't use for multitenant instance");
            throw new Error("No multitenant support");
        }
        if (!this._service.isOffline()) {
            nbError("ObjectBucket.setSyncScope(), supported offline mode only");
            throw new Error("No offline mode enabled");
        }
    }

    /**
     * @memberOf ObjectBucket
     * @description 集計(Aggregation)を実行する (オンライン専用)。
     * @example
     *     var bucket = ....;
     *     var pipeline = [ { "$lookup": { ... } }, ... ];
     *     var options = {};
     *     bucket.aggregate(pipeline, options)
     *         .then(function(objects) {
     *         ...
     *
     * @param {JsonObject[]} pipeline Aggregation Pipeline JSON配列
     * <pre>
     * 複数のアイテムに対して $sort を実行する場合は、以下のように単一アイテムの $sort を複数連結すること。
     * $sort に複数のアイテムを記載した場合は、ソート順序が保証されない。
     * [
     *     { "$sort": { "item1": 1 } },
     *     { "$sort": { "item2": -1 } },
     *     { "$sort": { "item3": 1 } }
     * ]
     * </pre>
     * @param {JsonObject} options オプション
     * @param {Callbacks} callbacks コールバック
     * @returns {Promise<JsonObject[]>}
     * @since 7.0.0
     */
    aggregate(pipeline: JsonObject[], options?: JsonObject, callbacks?: Callbacks): Promise<JsonObject[]> {
        nbLogger("ObjectBucket.aggregate()");

        const path = this.getDataPath("/_aggregate");
        const req = new HttpRequest(this._service, path);
        req.setMethod("POST");
        req.setContentType("application/json");

        const data: JsonObject = { pipeline: pipeline };
        if (options != null) {
            data.options = options;
        }
        req.setData(data);

        const promise = req.execute().then(response => {
            try {
                const resObj = JSON.parse(response);
                const objects = resObj.results;
                nbLogger("ObjectBucket.aggregate(), success : size=" + objects.length);
                return objects;
            } catch (e) {
                nbLogger("ObjectBucket.aggregate(), error : exception=" + e);
                const errorResult = _createError(0, e.toString(), e);
                return Promise.reject(errorResult);
            }

        }, err => {
            nbLogger(("ObjectBucket.aggregate(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      同期範囲を設定する(オフライン専用)。
     *      同期するには、本APIを呼び出して同期範囲を設定すること。
     * @example
     *      var bucket = new Nebula.ObjectBucket("Books", Nebula.BUCKET_MODE_REPLICA);
     *      var clause = Nebula.Clause.greaterThan("number", 99);
     *      var scope = new Nebula.ObjectQuery();
     *      scope.setClause(clause);
     *      ...
     *      bucket.setSyncScope(scope, {
     *          success: function() {
     *              ....
     *          },
     *          error: function(err) {
     *              ....
     *          }
     *      });
     * @param {Object} scope 設定する同期範囲。Nebula.ObjectQueryのインスタンス。
     * <pre>
     *      ・Nebula.ObjectQueryのインスタンスで同期範囲として有効なものは、検索条件(setClause()メソッドでセット)のみである。
     *        検索条件以外のその他(検索上限数やスキップカウントなど)は無効。
     *      ・nullを指定した場合は、設定されている同期範囲を削除する。
     *      ・すべてのオブジェクトを同期範囲にする場合は、インスタンスを生成しただけの空のNebula.ObjectQueryのインスタンスを指定する。
     * </pre>
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・scope は、Nebula.ObjectQueryのインスタンスを指定する。
     * ・処理が成功した場合、success の呼び出しにて通知する。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    setSyncScope(scope: ObjectQuery, callbacks?: Callbacks): Promise<void> {
        this._checkOfflineService();

        const req = new _SdeRequest(BaseBucket.getClassName(), "setSyncScope");
        const body: JsonObject = {};
        const query: JsonObject = {};

        if (scope != null) {
            if (scope.getClause() != null && scope.getClause().json() != null) {
                query.clause = scope.getClause().json();
            }

            body.scope = query;
        }

        body.bucketName = this.getBucketName();
        body.bucketMode = this.getBucketMode();
        nbLogger("ObjectBucket.setSyncScope(), body=" + JSON.stringify(body));
        req.setData(body);

        const promise = req.execute().then(response => {
            nbLogger("ObjectBucket.setSyncScope(), success : response=" + response);
            return;
        }, err => {
            nbLogger(("ObjectBucket.setSyncScope(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      同期範囲を取得する（オフライン専用)
     * @example
     *      var bucket = new Nebula.ObjectBucket("Books", Nebula.BUCKET_MODE_REPLICA);
     *      bucket.getSyncScope( {
     *          success: function(scope) {
     *              ....
     *          },
     *          error: function(err) {
     *              ....
     *          }
     *      });
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(scope)
     *             scope : 取得した同期範囲。Nebula.ObjectQueryのインスタンス。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    getSyncScope(callbacks?: Callbacks): Promise<ObjectQuery> {
        this._checkOfflineService();

        const req = new _SdeRequest(BaseBucket.getClassName(), "getSyncScope");
        const body = {
            bucketName: this.getBucketName(),
            bucketMode: this.getBucketMode()
        };
        req.setData(body);

        const promise = req.execute().then(response => {
            nbLogger("ObjectBucket.getSyncScope(), success : response=" + response);

            try {
                const resObj = JSON.parse(response);

                if (resObj.scope != null) {
                    let query: ObjectQuery = null;

                    if (!_compareObject(resObj.scope, {})) {
                        query = ObjectQuery._toObjectQuery(resObj.scope);
                    }

                    nbLogger("ObjectBucket.getSyncScope(), success : callback_data=" + resObj.scope);
                    return Promise.resolve(query);
                } else {
                    nbLogger("ObjectBucket.getSyncScope(), error : no scope property");
                    return Promise.reject(_createError(0, "Invalid response - no scope property", ""));
                }
            } catch (e) {
                nbLogger("ObjectBucket.getSyncScope(), error : exception=" + e);
                return Promise.reject(_createError(0, e.toString(), e));
            }
        }, err => {
            nbLogger(("ObjectBucket.getSyncScope(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      衝突解決ポリシを取得する(オフライン専用)
     * @example
     *      var bucket = new Nebula.ObjectBucket(....);
     *      ....
     *      bucket.getResolveConflictPolicy( {
     *          success: function(policy) {
     *              ....
     *          },
     *          error: function(err) {
     *              ....
     *          }
     *      });
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(policy)
     *             policy : 衝突解決ポリシ。以下のいずれかの値。
     *                      Nebula.ObjectBucket.CONFLICT_POLICY_CLIENT ： クライアント優先で解決
     *                      Nebula.ObjectBucket.CONFLICT_POLICY_SERVER ： サーバ優先で解決
     *                      Nebula.ObjectBucket.CONFLICT_POLICY_MANUAL ： ユーザ通知
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    getResolveConflictPolicy(callbacks?: Callbacks): Promise<number> {
        nbLogger("ObjectBucket.getResolveConflictPolicy()");

        this._checkOfflineService();

        const req = new _SdeRequest(BaseBucket.getClassName(), "getResolveConflictPolicy");
        const body = {
            bucketName: this.getBucketName(),
            bucketMode: this.getBucketMode()
        };
        req.setData(body);

        const promise = req.execute().then(response => {
            nbLogger("ObjectBucket.getResolveConflictPolicy(), success : response=" + response);

            try {
                const resObj = JSON.parse(response);

                if (resObj.results != null) {
                    return Promise.resolve(resObj.results); // TODO: number?
                } else {
                    nbLogger("ObjectBucket.getResolveConflictPolicy(), error : no results");
                    return Promise.reject(_createError(0, "No results", ""));
                }
            } catch (e) {
                nbLogger("ObjectBucket.getResolveConflictPolicy(), error : exception=" + e);
                return Promise.reject(_createError(0, e.toString(), e));
            }

        }, err => {
            nbLogger(("ObjectBucket.getResolveConflictPolicy(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      衝突解決ポリシを設定する(オフライン専用)
     * @example
     *      var bucket = new Nebula.ObjectBucket(....);
     *      var policy = ....
     *      ....
     *      bucket.setResolveConflictPolicy(policy {
     *          success: function() {
     *              ....
     *          },
     *          error: function(err) {
     *              ....
     *          }
     *      });
     * @param {number} policy 設定する衝突解決ポリシ
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・policy は、以下のいずれかの衝突解決ポリシを指定する。
     *      Nebula.ObjectBucket.CONFLICT_POLICY_CLIENT ： クライアント優先で解決
     *      Nebula.ObjectBucket.CONFLICT_POLICY_SERVER ： サーバ優先で解決
     *      Nebula.ObjectBucket.CONFLICT_POLICY_MANUAL ： ユーザ通知
     * ・処理が成功した場合、success の呼び出しにて通知する。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    setResolveConflictPolicy(policy: number, callbacks?: Callbacks): Promise<void> {
        nbLogger("ObjectBucket.setResolveConflictPolicy()");

        this._checkOfflineService();

        if (policy == null) {
            nbError("ObjectBucket.setResolveConflictPolicy(), invalid parameter: no policy");
            throw new Error("No policy");
        }

        const req = new _SdeRequest(BaseBucket.getClassName(), "setResolveConflictPolicy");
        const body = {
            bucketName: this.getBucketName(),
            bucketMode: this.getBucketMode(),
            policy
        };
        req.setData(body);

        const promise = req.execute().then(response => {
            nbLogger("ObjectBucket.setResolveConflictPolicy(), success : response=" + response);
            return;
        }, err => {
            nbLogger(("ObjectBucket.setResolveConflictPolicy(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      キャッシュデータを削除する。(オフライン専用)
     *      オフライン用データベースに保存されたバケットとバケットに保存されたオブジェクトの情報を削除する。
     * @example
     *      var bucket = new Nebula.ObjectBucket(....);
     *      ....
     *      bucket.removeCacheBucket({
     *          success: function() {
     *              ....
     *          },
     *          error: function(err) {
     *              ....
     *          }
     *      });
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    removeCacheBucket(callbacks?: Callbacks): Promise<void> {
        nbLogger("ObjectBucket.removeCacheBucket()");

        this._checkOfflineService();

        const req = new _SdeRequest(BaseBucket.getClassName(), "removeCacheBucket");
        const body = {
            bucketName: this.getBucketName(),
            bucketMode: this.getBucketMode()
        };
        req.setData(body);

        const promise = req.execute().then(response => {
            nbLogger("ObjectBucket.removeCacheBucket(), success : response=" + response);
            return;
        }, err => {
            nbLogger(("ObjectBucket.removeCacheBucket(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      同期イベントリスナを登録する(オフライン専用)
     * @example
     *      var bucket = new Nebula.ObjectBucket("Books", Nebula.BUCKET_MODE_REPLICA);
     *      bucket.setSyncEventListener({
     *          onSyncStart: function(targetBucket) {
     *              ....
     *          },
     *          onSyncCompleted: function(targetBucket, objectIds) {
     *              ....
     *          },
     *          onSyncConflicted: function(bucket, client, server) {
     *              ....
     *          },
     *          onResolveConflict: function(resolveObject, resolve) {
     *              ....
     *          },
     *          onSyncError: function(errorCode, errorObject) {
     *              ....
     *          }
     *      });
     * @param {Object} listener 同期イベントを受け取るイベントリスナ
     * <pre>
     * ・listener は、各同期イベント発生時のコールバックを指定する。
     *      {
     *          onSyncStart : function(targetBucket) {
     *              // 同期開始時に呼び出される
     *              // targetBucket : 同期対象のバケット名
     *          },
     *          onSyncCompleted : function(targetBucket, objectIds) {
     *              // 同期完了時に呼び出される
     *              // targetBucket : 同期が完了したバケット名
     *              // objectIds    : 同期が完了したオブジェクトIDの配列
     *          },
     *          onSyncConflicted : function(bucket, client, server) {
     *              // 衝突発生時に呼び出される
     *              // bucket    : 衝突が発生したバケットのNebula.ObjectBucketインスタンス(衝突解決時に使用)
     *              // client    : クライアント側の衝突データ
     *              // server    : サーバ側の衝突データ
     *          },
     *          onResolveConflict : function(resolveObject, resolve) {
     *              // データの衝突の解決時に呼び出される
     *              // resolveObject : 解決に使用したデータ
     *              // resolve       : 解決方法
     *          },
     *          onSyncError : function(errorCode, errorObject) {
     *              // 同期処理中のエラー発生時に呼び出される
     *              // errorCode    : エラー種別
     *                  //  Nebula.ObjectBucket.SYNC_ERROR_PULL           ： 同期処理のPULLエラー
     *                  //  Nebula.ObjectBucket.SYNC_ERROR_PUSH           ： 同期処理のPUSHエラー
     *                  //  Nebula.ObjectBucket.SYNC_ERROR_PUSH_RESYNCING ： 同期処理のpushエラー後に、同期リトライ中
     *                  //  Nebula.ObjectBucket.SYNC_ERROR_OVERLAP_ID     ： 同期処理のID重複エラー
     *              // errorObject  : エラーが発生したオブジェクト
     *          },
     *     }
     * </pre>
     */
    setSyncEventListener(listener: SyncEventListener) {
        this._checkOfflineService();

        return _SdeSyncEventListener.setListener(this, listener);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      すべてのオブジェクトバケットの一括同期を実行する。(オフライン専用)
     *      <p>
     *      処理の進捗はsetSyncEventListener()で指定されたコールバックにて通知する。
     *      各バケットごとにsetSyncScope()を使用して同期範囲を設定すること。
     *      同期範囲が設定されていないバケットは、同期されない。
     * @example
     *      Nebula.ObjectBucket.sync({
     *          success: function() {
     *              ....
     *          },
     *          error: function(err) {
     *              ....
     *          }
     *      });
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・callbacks は、成功時と失敗時の応答コールバックを指定する。
     *   callbacks は本メソッドに対する処理結果であり、同期イベントはsetSyncEventListener()で指定されたコールバックにて通知する点に注意。
     * ・処理が成功した場合、success の呼び出しにて通知する。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static sync(callbacks?: Callbacks): Promise<void> { return null; }

    protected static _sync(service: NebulaService, callbacks?: Callbacks): Promise<void> {
        nbLogger("ObjectBucket.sync()");

        if (service !== Nebula) {
            nbError("ObjectBucket.setSyncScope(): Can't use for multitenant instance");
            throw new Error("No multitenant support");
        }
        if (!service.isOffline()) {
            nbError("ObjectBucket.sync(), supported offline mode only");
            throw new Error("No offline mode enabled");
        }

        const req = new _SdeRequest(BaseBucket.getClassName(), "sync");

        const promise = req.execute().then(response => {
            nbLogger("ObjectBucket.sync(), success : response=" + response);
            return;
        }, err => {
            nbLogger(("ObjectBucket.sync(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      同期を実行する(オフライン専用)。
     *      特定のオブジェクトバケットに対し同期を行う。処理の進捗はsetSyncEventListener()で指定されたコールバックにて通知する。
     *      setSyncScope()を使用して同期範囲を設定すること。同期範囲を設定しない場合、エラーとなり同期されない。
     *      本APIは、バケットモードがレプリカモードのバケットに対して呼び出すこと。
     * @example
     *      var bucket = new Nebula.ObjectBucket(....);
     *      ....
     *      bucket.syncBucket({
     *          success: function() {
     *              ....
     *          },
     *          error: function(err) {
     *              ....
     *          }
     *      });
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・callbacks は、成功時と失敗時の応答コールバックを指定する。
     *   callbacks は本メソッドに対する処理結果であり、同期イベントはsetSyncEventListener()で指定されたコールバックにて通知する点に注意。
     * ・処理が成功した場合、success の呼び出しにて通知する。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    syncBucket(callbacks?: Callbacks): Promise<void> {
        nbLogger("ObjectBucket.syncBucket()");

        this._checkOfflineService();

        const req = new _SdeRequest(BaseBucket.getClassName(), "syncBucket");
        const body = {
            bucketName: this.getBucketName(),
            bucketMode: this.getBucketMode()
        };
        req.setData(body);

        const promise = req.execute().then(response => {
            nbLogger("ObjectBucket.syncBucket(), success : response=" + response);
            return;
        }, err => {
            nbLogger(("ObjectBucket.syncBucket(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      衝突を解決する(オフライン専用)。
     *      同期イベントの衝突通知(onSyncConflicted)で指定されたObjectBucketインスタンスに対して実行する。
     * @example
     *      var bucket = new Nebula.ObjectBucket(....);
     *      ....
     *       Nebula.ObjectBucket.setSyncEventListener({
     *          onSyncStart: function(targetBucket) {
     *              ....
     *          },
     *          onSyncCompleted: function(targetBucket, objectIds) {
     *              ....
     *          },
     *          onSyncConflicted: function(bucket, client, server) {
     *              ....
     *              bucket.resolveConflict(objectId, Nebula.ObjectBucket.RESOLVE_CLIENT);
     *          },
     *          onResolveConflict: function(resolveObject, resolve) {
     *              ....
     *          },
     *          onSyncError: function(errorCode, errorObject) {
     *              ....
     *          }
     *      });
     *      ....
     *      bucket.syncBucket({
     *          success: function() {
     *              ....
     *          },
     *          error: function(err) {
     *              ....
     *          }
     *      });
     * @param {string} objectId 衝突解決するオブジェクトのID
     * @param {number} resolve 衝突解決方法
     * <pre>
     * ・objectId には、衝突解決対象のオブジェクトのIDを指定する。
     * ・resolve には、以下のいずれかの衝突解決方法を指定する。
     *      Nebula.ObjectBucket.RESOLVE_CLIENT  ： クライアント優先で解決
     *      Nebula.ObjectBucket.RESOLVE_SERVER  ： サーバ優先で解決
     * </pre>
     */
    resolveConflict(objectId: string, resolve: number) {
        nbLogger("ObjectBucket.resolveConflict()");

        this._checkOfflineService();

        if (objectId == null || resolve == null || this._resolveId == null) {
            nbError("ObjectBucket.syncObject(), invalid parameter, objectId=" + objectId + ", resolve=" + resolve + ", resolveId=" + this._resolveId);
            throw new Error("No objectId/resolve/resolveId");
        }

        const data: ResolveConflictParams = {
            bucketName: this.getBucketName(),
            bucketMode: this.getBucketMode(),
            objectId,
            resolveId: this._getResolveId(),
            resolve
        };
        return _SdeSyncEventListener.resolveConflict(data);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットにインデックス設定する(オフライン専用)。
     *      本APIはオフラインのみで利用可能
     * @example
     *      var bucket = new Nebula.ObjectBucket("Books", Nebula.BUCKET_MODE_REPLICA);
     *      ....
     *      index = {
     *          "index": [{"name": "key1", "type": "string"}, {"name": "key2", "type": "number"}]
     *      };
     *      callbacks = {
     *          success: function() {....},
     *          error: function(err) {....}
     *      };
     *      bucket.setIndexToLocal(index, callbacks);
     * @param {Object} index インデックス情報
     *      インデックス情報は以下のようにJSONで指定する
     *      <pre>
     *      {
     *          "index": [{"name": "key1", "type": "string"}, {"name": "key2", "type": "number"}]
     *      }
     *      </pre>
     *      ・index にはインデックスを設定するキー名と型を指定する。型は文字列で"string","boolean","number"のいずれかを指定する。
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    setIndexToLocal(index: JsonObject, callbacks?: Callbacks): Promise<void> {
        nbLogger("ObjectBucket.setIndexLocal()");

        this._checkOfflineService();

        if (!index) {
            nbError("ObjectBucket.setIndexLocal(), parameter is invalid");
            throw new Error("No index");
        }

        if (!index.index) {
            nbError("ObjectBucket.setIndexLocal(), index is invalid");
            throw new Error("No index property");
        }

        const req = new _SdeRequest(this.getClassName(), "setIndexToLocal");
        index.bucketName = this.getBucketName();
        index.bucketMode = this.getBucketMode();
        req.setData(index);

        const promise = req.execute().then(() => {
            nbLogger("ObjectBucket.setIndexLocal(), success");
            return;
        }, err => {
            nbLogger(("ObjectBucket.setIndexLocal(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      オブジェクトバケットに設定されているインデックスを取得する(オフライン専用)。
     *      本APIはオフラインのみで利用可能
     * @example
     *      var bucket = new Nebula.ObjectBucket("Books", Nebula.BUCKET_MODE_REPLICA);;
     *      ....
     *      callbacks = {
     *          success: function(index) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.getIndexFromLocal(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(index)
     *             index : インデックス情報(インデックス情報はJSON)
     * ・インデックス情報は以下のように格納される
     *      {
     *          "index": [{"name": "key1", "type": "string"}, {"name": "Key2", "type": "number"}]
     *      }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    getIndexFromLocal(callbacks?: Callbacks): Promise<JsonObject> {
        nbLogger("ObjectBucket.getIndexLocal()");

        this._checkOfflineService();

        const req = new _SdeRequest(this.getClassName(), "getIndexFromLocal");
        const body = {
            bucketName: this.getBucketName(),
            bucketMode: this.getBucketMode()
        };
        req.setData(body);

        const promise = req.execute().then(response => {
            nbLogger("ObjectBucket.getIndexLocal(), success");

            try {
                const resObj = JSON.parse(response);
                const index = resObj.results;
                return index;
            } catch (e) {
                nbLogger("ObjectBucket.getIndexLocal(), success : exception=" + e);
                const errorResult = _createError(0, e.toString(), e);
                return Promise.reject(errorResult);
            }
        }, err => {
            nbLogger(("ObjectBucket.getIndexLocal(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description
     *      最終同期日時を取得する。(オフライン専用)
     *      一度も同期していない場合、nullを返す。
     *      本APIは、バケットモードがレプリカモードのバケットに対して呼び出すこと。
     * @example
     *      var bucket = new Nebula.ObjectBucket(....);
     *      ....
     *      bucket.getLastSyncTime( {
     *          success: function(lastSyncTime) {
     *              ....
     *          },
     *          error: function(err) {
     *              ....
     *          }
     *      });
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(lastSyncTime)
     *             lastSyncTime : 最終同期日時。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    getLastSyncTime(callbacks?: Callbacks): Promise<string> {
        nbLogger("ObjectBucket.getLastSyncTime()");

        this._checkOfflineService();

        const req = new _SdeRequest(BaseBucket.getClassName(), "getLastSyncTime");
        const body = {
            bucketName: this.getBucketName(),
            bucketMode: this.getBucketMode()
        };
        req.setData(body);

        const promise = req.execute().then(response => {
            nbLogger("ObjectBucket.getLastSyncTime(), success : response=" + response);

            try {
                const resObj = JSON.parse(response);

                if (resObj.results != null) {
                    return resObj.results; // TODO: type?
                } else {
                    nbLogger("ObjectBucket.getLastSyncTime(), success : no results");
                    return null;
                }
            } catch (e) {
                nbLogger("ObjectBucket.getLastSyncTime(), error : exception=" + e);
                return Promise.reject(_createError(0, e.toString(), e));
            }
        }, err => {
            nbLogger(("ObjectBucket.getLastSyncTime(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf ObjectBucket
     * @description 衝突解決IDを取得する
     * @private
     */
    protected _getResolveId(): string {
        nbLogger("ObjectBucket._getResolveId(), resolveId=" + this._resolveId);
        return this._resolveId;
    }

    /**
     * @memberOf ObjectBucket
     * @description 衝突解決IDをセットする
     * @private
     */
    _setResolveId(resolveId: string) {
        nbLogger("ObjectBucket._setResolveId(), cur=" + this._resolveId + ", new=" + resolveId);
        return this._resolveId = resolveId;
    }

    /**
     * @memberOf ObjectBucket
     * @description
     * バッチリクエストを実行する
     * @example
     *     // リクエスト生成
     *     var req = new Nebula.BatchRequest();
     *     // 追加オブジェクト設定
     *     req.addInsertRequest({"name": "Taro Nichiden", "score": 70});
     *     req.addInsertRequest({"name": "Hanako Nichiden", "score": 80});
     *     // バッチリクエスト実行
     *     bucket.batch(req).then(function(result) {...});
     * @param {BatchRequest} request バッチリクエスト
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・バッチ処理が一部でも成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(result)
     *             result : バッチ応答(JSON)。応答フォーマットは REST API 仕様書を参照のこと。
     *             'results'プロパティに結果が格納される。
     *             これに加え、'failedCount'プロパティに処理失敗したリクエストの数が格納される。
     *
     * ・バッチ処理全体が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(error)
     *             error : エラー要因がJSON 形式で返る。
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * @since v4.0.0
     */
    batch(request: BatchRequest, callbacks?: Callbacks): Promise<BatchResponseJson> {
        const path = this.getDataPath("/_batch");
        const req = new HttpRequest(this._service, path);
        req.setMethod("POST");
        req.setContentType("application/json");
        req.setData(request.json);

        const promise = req.execute().then(response => {
            const json: BatchResponseJson = JSON.parse(response);
            let failedCount = 0;

            for (const result of json.results) {
                if (result.result !== "ok") {
                    failedCount++;
                }
            }

            json.failedCount = failedCount;
            return json;
        }, err => {
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }
}
