import {BaseBucket} from "./BaseBucket";
import {NebulaService} from "./NebulaService";
import {Nebula} from "./Nebula";
import {_createError, _errorText, _promisify, Callbacks, nbLogger} from "./Head";
import {Acl} from "./Acl";
import {FileMetadata, FileMetadataJson} from "./FileMetadata";
import {ApiRequest, HttpRequest} from "./HttpRequest";
import {_SdeRequest} from "./SdeRequest";

import {Promise} from "es6-promise";
import {Buffer} from "buffer";

/**
 * ファイル情報
 */
export interface FileInfo {
    /** ファイルパス */
    path: string;
    /** ファイル名 */
    name: string;
    /** Content-Type */
    type: string;
}

/**
 * FileBucket 実装
 * @private
 */
export class FileBucket extends BaseBucket {
    _resolveId: string;

    /**
     * @class FileBucket
     * @classdesc ファイルバケット
     * @description FileBucket インスタンスを生成する
     * @example
     *     var bucket = new Nebula.FileBucket("bucket1");
     * @param name バケット名
     */
    constructor(name: string, service: NebulaService = Nebula) {
        super(service, name, "file");
        this._resolveId = null;
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットを取得する
     * @example
     *      callbacks = {
     *          success: function(bucket) {....},
     *          error: function(err) {....}
     *      };
     *      Nebula.FileBucket.loadBucket(callbacks);
     * @param {String} name ファイルバケット名
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(bucket)
     *             bucket : Nebula.FileBucketインスタンス
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : ファイルバケット名(nameに同じ)
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static loadBucket(name:string , callbacks?: Callbacks): Promise<FileBucket> { return null; }

    protected static _loadBucket(service: NebulaService, name:string , callbacks?: Callbacks): Promise<FileBucket> {
        nbLogger("FileBucket.loadBucket(), name=" + name + ", callbacks=" + callbacks);
        return BaseBucket._baseLoadBucket("file", service, name, Nebula.BUCKET_MODE_ONLINE, callbacks) as Promise<FileBucket>;
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットのバケット名一覧を取得する
     * @example
     *      callbacks = {
     *          success: function(bucketList) {....},
     *          error: function(error) {....}
     *      };
     *      Nebula.FileBucket.getBucketList(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(bucketList)
     *             bucketList : ファイルバケット名の配列
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static getBucketList(callbacks?: Callbacks): Promise<string[]> { return null; }

    protected static _getBucketList(service: NebulaService, callbacks?: Callbacks): Promise<string[]> {
        return BaseBucket._baseGetBucketList("file", service, false, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットを保存する
     * @example
     *      var bucket = new Nebula.FileBucket("Person");
     *      ....
     *      callbacks = {
     *          success: function(bucket) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.saveBucket(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(bucket)
     *             bucket : Nebula.FileBucket インスタンス
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ
     *                  "data"          : Nebula.FileBucket インスタンス
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    saveBucket(callbacks?: Callbacks): Promise<FileBucket> {
        return super.saveBucket(callbacks) as Promise<FileBucket>;
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットを削除する
     * @example
     *      var bucket = new Nebula.FileBucket("Person");
     *      ....
     *      callbacks = {
     *          success: function(bucket) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.deleteBucket(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(bucket)
     *             bucket : Nebula.FileBucket インスタンス
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : Nebula.FileBucket インスタンス
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    deleteBucket(callbacks?: Callbacks): Promise<FileBucket> {
        return super.deleteBucket(callbacks) as Promise<FileBucket>;
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットのACLを設定する.
     *      <p>本メソッドを呼び出しただけでは、サーバに格納されているファイルバケットは更新されない。
     *      <br/>サーバと同期するには、saveBucket()を呼び出す必要がある。
     * @example
     *      var bucket = ....;
     *      var acl = new Nebula.Acl();
     *      ....
     *      acl.addEntry(....);
     *      ....
     *      bucket.setAcl(acl);
     * @param acl {Acl} Aclインスタンス
     * @return {FileBucket} this
     */
    setAcl(acl: Acl): FileBucket {
        super.setAcl(acl);
        return this;
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットのACLを取得する.
     *      <p>ファイルバケットのACLを取得するには、loadBucket()を使用してサーバのバケット情報をロードしておく必要がある
     * @example
     *      var bucket = ....;
     *      ....
     *      var acl = bucket.getAcl();
     * @return
     *      {Acl} ファイルバケットのACL
     */
    getAcl(): Acl {
        return super.getAcl();
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットのコンテンツACLを設定する.
     *      <p>本メソッドを呼び出しただけでは、サーバに格納されているファイルバケットは更新されない。
     *      <br/>サーバと同期するには、saveBucket()を呼び出す必要がある。
     * @example
     *      var bucket = ....;
     *      var acl = new Nebula.Acl();
     *      ....
     *      acl.addEntry(....);
     *      ....
     *      bucket.setContentAcl(acl);
     * @param {Acl} acl Nebula.ACL のインスタンス
     * @return {FileBucket} this
     */
    setContentAcl(acl: Acl): FileBucket {
        super.setContentAcl(acl);
        return this;
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットのコンテンツACLを取得する.
     *      <p>ファイルバケットのコンテンツACLを取得するには、loadBucket()を使用してサーバのバケット情報をロードしておく必要がある
     * @example
     *      var bucket = ....;
     *      ....
     *      var acl = bucket.getAcl();
     * @return
     *      {Acl} ファイルバケットのコンテンツACL
     */
    getContentAcl(): Acl {
        return super.getContentAcl();
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットに「説明文」を設定する.
     *      <p>本メソッドを呼び出しただけでは、サーバに格納されているファイルバケットは更新されない。
     *      <br/>サーバと同期するには、saveBucket()を呼び出す必要がある。
     * @example
     *      var bucket = ....;
     *      var acl = new Nebula.Acl();
     *      ....
     *      acl.addEntry(....);
     *      ....
     *      bucket.setDescription("このバケットの説明文”);
     * @param {String} description 設定する「説明文」
     * @return {FileBucket} this
     */
    setDescription(description: string): FileBucket {
        super.setDescription(description);
        return this;
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットの「説明文」を取得する.
     *      <p>ファイルバケットのコンテンツACLを取得するには、loadBucket()を使用してサーバのバケット情報をロードしておく必要がある
     * @example
     *      var bucket = ....;
     *      ....
     *      var description = bucket.getDescription();
     * @return
     *      {String} ファイルバケットの「説明文」
     */
    getDescription(): string {
        return super.getDescription();
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケット名を取得する
     * @example
     *      var bucket = ....;
     *      ....
     *      var bucketName = bucket.getBucketName();
     * @return
     *      {String} ファイルバケット名
     */
    getBucketName(): string {
        return super.getBucketName();
    }

    /**
     * @memberOf FileBucket
     * @description ファイルバケット名を設定する
     * @private
     */
    _setBucketName(name: string): FileBucket {
        super.setBucketName(name);
        return this;
    }

    private _save(fileName: string, data: any, metadata: FileMetadata, update: boolean, callbacks: Callbacks): Promise<FileMetadata> {
        nbLogger("FileBucket._save()");

        if (!fileName) {
            nbLogger("FileBucket._save(), Parameter is invalid : fileName");
            throw new Error("No fileName");
        }

        if (!data) {
            nbLogger("FileBucket._save(), Parameter is invalid : data");
            throw new Error("No data");
        }

        if (!(typeof Blob !== "undefined" && Blob !== null) && !(typeof Buffer !== "undefined" && Buffer !== null)) {
            nbLogger("FileBucket._save(), Not supported Blob nor Buffer");
            throw new Error("No Blob/Buffer support");
        }

        if ((typeof data !== "string")
            && (typeof Blob !== "undefined" && Blob !== null && !(data instanceof Blob))
            && (typeof Buffer !== "undefined" && Buffer !== null && !(Buffer.isBuffer(data)))) {
            nbLogger("FileBucket._save(), Data is not String, Blob nor Buffer");
            throw new Error("data is not String, Blob nor Buffer");
        }

        if (!update) {
            if (!metadata || !metadata.getContentType()) {
                nbLogger("FileBucket._save(), Parameter is invalid : metadata.contentType");
                throw new Error("No contentType in metadata");
            }
        }

        const path = this.getDataPath("/" + encodeURIComponent(fileName));
        nbLogger("FileBucket._save(), path=" + path);
        const req = new HttpRequest(this._service, path);

        if (update) {
            req.setMethod("PUT");
        } else {
            req.setMethod("POST");
            req.setContentType(metadata.getContentType());

            if (metadata.getAcl() != null) {
                req.addRequestHeader("X-ACL", metadata.getAcl()._toString());
            }
            if (metadata.getOptions() != null) {
                req.addRequestHeader("X-Meta-Options", JSON.stringify(metadata.getOptions()));
            }
        }

        req.setData(data);

        const promise = req.execute().then(response => {
            try {
                const resObj = JSON.parse(response);

                if (metadata === null) {
                    metadata = new FileMetadata();
                }

                metadata._setMetadata(resObj);
                return Promise.resolve(metadata);
            } catch (e) {
                nbLogger("FileBucket._save(), success: exception=" + e);
                const error = _createError(0, "Invalid response from server", e, fileName);
                return Promise.reject(error);
            }
        }, error => {
            nbLogger(("FileBucket._save(), error: " + (_errorText(error))));
            error.data = fileName;
            return Promise.reject(error);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットへファイルを新規保存する.
     *      <p>HTML5 File APIに対応しているブラウザ、もしくは Node.js のみで実行可能。
     * @example
     *      var bucket = ....;
     *      ....
     *      var file = ....;
     *      ....
     *      var meta = new Nebula.FileMetadata();
     *      meta.setContentType("image/jpeg");
     *      callbacks = {
     *          success: function(metadata) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.saveAs("MyFileName.jpg", file, meta, callbacks);
     * @param {String} fileName ファイルバケットへ保存するファイル名
     * @param {Object} data 文字列、File/Blobオブジェクト、または Buffer オブジェクト
     * <pre>
     * サーバに保存するファイルのデータを以下のいずれかで指定する。
     * ・保存するファイルにバインドされたFileオブジェクト
     * ・保存するファイルのデータ。文字列/Blobオブジェクト/Bufferオブジェクトのいずれか。
     * </pre>
     * @param {FileMetadata} metadata 保存するファイルのメタデータ
     * <pre>
     * 指定できるメタデータは以下の通りである。(他のメタデータは参照されない)
     * ・ACL (オプション、省略可)
     * ・コンテンツタイプ (必須、省略不可)
     * </pre>
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(metadata)
     *             metadata : Nebula.FileMetadata インスタンス
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    saveAs(fileName: string, data: any, metadata: FileMetadata, callbacks?: Callbacks): Promise<FileMetadata> {
        return this._save(fileName, data, metadata, false, callbacks);
    }


    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットのファイルを保存する.
     *      <p>HTML5 File APIに対応しているブラウザ、または Node.js のみで実行可能。
     * @example
     *      var bucket = ....;
     *      ....
     *      var file = ....;
     *      ....
     *      callbacks = {
     *          success: function(metadata) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.save("MyFileName.jpg", file, callbacks);
     * @param {String} fileName ファイルバケットへ保存するファイル名
     * @param {Object} data 文字列、File/Blobオブジェクト、または Buffer オブジェクト
     * <pre>
     * サーバに保存するファイルのデータを以下のいずれかで指定する。
     * ・保存するファイルにバインドされたFileオブジェクト
     * ・保存するファイルのデータ。文字列/Blobオブジェクト/Bufferオブジェクトのいずれか。
     * </pre>
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(metadata)
     *             metadata : Nebula.FileMetadata インスタンス
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    save(fileName: string, data: any, callbacks?: Callbacks): Promise<FileMetadata> {
        return this._save(fileName, data, null, true, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットからファイルを読み込む.
     *      <p>HTML5 File APIに対応しているブラウザ、または Node.js のみで実行可能。
     * @example
     *      var bucket = ....;
     *      ....
     *      callbacks = {
     *          success: function(blob) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.load("MyFile.jpg", callbacks);
     * @param {String} fileName ファイルバケットから読み込むファイルの名前
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(data)
     *             data : ファイルの内容が格納されたBlobオブジェクト (node.js の場合は Buffer オブジェクト)
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    load(fileName: string, callbacks?: Callbacks): Promise<any> {
        nbLogger("FileBucket.load()");

        if (!(typeof fileName !== "undefined" && fileName !== null)) {
            nbLogger("FileBucket.load(), Parameter is invalid : fileName");
            throw new Error("No fileName");
        }

        if (!(typeof Blob !== "undefined" && Blob !== null) && !(typeof Buffer !== "undefined" && Buffer !== null)) {
            nbLogger("FileBucket.load(), Not supported Blob nor Buffer");
            throw new Error("No Blob/Buffer support");
        }

        const path = this.getDataPath("/" + encodeURIComponent(fileName));
        nbLogger("FileBucket.load(), path=" + path);
        const req = new HttpRequest(this._service, path);
        req.setMethod("GET");

        if (typeof Blob !== "undefined" && Blob !== null) {
            req.setResponseType("blob");
        } else if (typeof Buffer !== "undefined" && Buffer !== null) {
            req.setResponseType("buffer");
        }

        const promise = req.execute().then(response => {
            return response;
        }, err => {
            nbLogger(("FileBucket.load(), error: " + (_errorText(err))));
            err.data = fileName;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットからファイルを削除する.
     * @example
     *      var bucket = ....;
     *      ....
     *      callbacks = {
     *          success: function(fileName) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.remove("fileName", callbacks);
     * @param {String} fileName ファイルバケットから削除するファイルの名前
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(fileName)
     *             fileName : 引数で指定されたfileNameと同じ
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * @since v4.0.1
     */
    remove(fileName: string, callbacks?: Callbacks): Promise<string> {
        nbLogger("FileBucket.delete()");

        if (!(typeof fileName !== "undefined" && fileName !== null)) {
            nbLogger("FileBucket.delete(), Parameter is invalid : fileName");
            throw new Error("No fileName");
        }

        let req: ApiRequest;
        if (this._service.isOffline()) {
            req = new _SdeRequest(this.getClassName(), "delete");
            const body = {
                bucketName: this.getBucketName(),
                fileName
            };
            req.setData(body);
        } else {
            const path = this.getDataPath("/" + encodeURIComponent(fileName));
            nbLogger("FileBucket.delete(), path=" + path);
            req = new HttpRequest(this._service, path);
            req.setMethod("DELETE");
        }

        const promise = req.execute().then(response => {
            nbLogger("FileBucket.delete(), success: " + fileName);
            return fileName;
        }, err => {
            nbLogger(("FileBucket.delete(), error: " + (_errorText(err)) + " : " + (fileName)));
            err.data = fileName;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットからファイルを削除する(Deprecated)
     * @example
     * ・本APIは Deprecated である。remove() を使用すること。
     * @deprecated since v4.0.1
     */
    delete(fileName: string, callbacks?: Callbacks): Promise<string> {
        return this.remove(fileName, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description JSONからFileMetadataインスタンスを生成する
     * @private
     */
    protected _createMetadata(obj: FileMetadataJson): FileMetadata {
        const metadata = new FileMetadata();
        metadata._setMetadata(obj);
        return metadata;
    }

    private _publish(fileName: string, published: boolean, callbacks?: Callbacks): Promise<FileMetadata> {
        nbLogger("FileBucket._publish(), fileName=" + fileName + ", setFlg=" + published);

        if (!(typeof fileName !== "undefined" && fileName !== null)) {
            nbLogger("FileBucket._publish(), Parameter is invalid : fileName");
            throw new Error("No fileName");
        }

        let req: ApiRequest;
        if (this._service.isOffline()) {
            req = new _SdeRequest(this.getClassName(), "publish");
            const body = {
                bucketName: this.getBucketName(),
                fileName,
                published
            };
            req.setData(body);
        } else {
            const path = this.getDataPath("/" + encodeURIComponent(fileName) + "/publish");
            nbLogger("FileBucket._publish(), path=" + path);
            req = new HttpRequest(this._service, path);

            if (published) {
                req.setMethod("PUT");
            } else {
                req.setMethod("DELETE");
            }
        }

        const promise = req.execute().then(response => {
            nbLogger("FileBucket._publish(), success: " + fileName);

            try {
                const resObj = JSON.parse(response);
                const metadata = this._createMetadata(resObj);
                return Promise.resolve(metadata);
            } catch (e) {
                nbLogger("FileBucket._publish(), success: exception=" + e);
                const errorResult = _createError(0, "Invalid response from server", e);
                errorResult.data = fileName;
                return Promise.reject(errorResult);
            }
        }, err => {
            nbLogger(("FileBucket._publish(), error: " + (_errorText) + " : " + (fileName)));
            err.data = fileName;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }


    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットのファイルを公開する.
     *      <p>既に公開されたファイルを再公開しても公開 URL は変更されない。
     * @example
     *      var bucket = ....;
     *      ....
     *      callbacks = {
     *          success: function(metadata) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.publish("MyFile.jpg", callbacks);
     * @param {String} fileName 公開するファイルの名前
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(metadata)
     *             metadata : このファイルのメタデータ
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    publish(fileName: string, callbacks?: Callbacks): Promise<FileMetadata> {
        nbLogger("FileBucket.publish()");
        return this._publish(fileName, true, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットのファイルを非公開する
     * @example
     *      var bucket = ....;
     *      ....
     *      callbacks = {
     *          success: function(metadata) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.unpublish("MyFile.jpg", callbacks);
     * @param {String} fileName 非公開にするファイルの名前
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(metadata)
     *             metadata : このファイルのメタデータ
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    unpublish(fileName: string, callbacks?: Callbacks): Promise<FileMetadata> {
        nbLogger("FileBucket.unpublish()");
        return this._publish(fileName, false, callbacks);
    }

    private _getList(published: boolean, deleteMark: boolean, callbacks?: Callbacks): Promise<FileMetadata[]> {
        nbLogger("FileBucket._getList(), published=" + published);

        let req: ApiRequest;
        if (this._service.isOffline()) {
            req = new _SdeRequest(this.getClassName(), "getList");
            const body = {
                bucketName: this.getBucketName(),
                published,
                deleteMark
            };
            req.setData(body);
        } else {
            const path = this.getDataPath();
            nbLogger("FileBucket._getList(), path=" + path);
            req = new HttpRequest(this._service, path);
            req.setMethod("GET");

            if (published) {
                req.setQueryParam("published", "1");
            }

            if (deleteMark) {
                req.setQueryParam("deleteMark", "1");
            }
        }

        const promise = req.execute().then(response => {
            nbLogger("FileBucket._getList(), success");

            try {
                const resObj = JSON.parse(response);
                const resArray = resObj.results;
                const metaList: FileMetadata[] = [];

                if (resArray != null) {
                    for (const obj of resArray) {
                        const metadata = this._createMetadata(obj);
                        metaList.push(metadata);
                    }
                }

                return Promise.resolve(metaList);
            } catch (e) {
                nbLogger("FileBucket._getList(), success: exception=" + e);
                const errorResult = _createError(0, "Invalid response from server", e);
                return Promise.reject(errorResult);
            }
        }, err => {
            nbLogger(("FileBucket._getList(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットからファイル一覧を取得する
     * @example
     *      var bucket = ....;
     *      ....
     *      callbacks = {
     *          success: function(metadata) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.getList(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(metadata)
     *             metadata : ファイルのメタデータ(Nebula.FileMetadataインスタンス)の配列
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    getList(callbacks?: Callbacks): Promise<FileMetadata[]> {
        nbLogger("FileBucket.getList()");
        return this._getList(false, false, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットから公開ファイル一覧を取得する
     * @example
     *      var bucket = ....;
     *      ....
     *      callbacks = {
     *          success: function(metadata) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.getPublishedList(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(metadata)
     *             metadata : ファイルのメタデータ(Nebula.FileMetadataインスタンス)の配列
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    getPublishedList(callbacks?: Callbacks): Promise<FileMetadata[]> {
        nbLogger("FileBucket.getPublishedList()");
        return this._getList(true, false, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットから指定されたファイルのメタデータを取得する
     * @example
     *      var bucket = ....;
     *      ....
     *      callbacks = {
     *          success: function(metadata) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.getMetadata("MyFile.jpg", callbacks);
     * @param {String} fileName メタデータを取得するファイルの名前
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(metadata)
     *             metadata : ファイルのメタデータ(Nebula.FileMetadataインスタンス)
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    getMetadata(fileName: string, callbacks?: Callbacks): Promise<FileMetadata> {
        nbLogger("FileBucket.getMetadata(), fileName=" + fileName);

        if (!(typeof fileName !== "undefined" && fileName !== null)) {
            nbLogger("FileBucket.getMetadata(), Parameter is invalid : fileName");
            throw new Error("No fileName");
        }

        let req: ApiRequest;
        if (this._service.isOffline()) {
            req = new _SdeRequest(this.getClassName(), "getMetadata");
            const body = {
                bucketName: this.getBucketName(),
                fileName
            };
            req.setData(body);
        } else {
            const path = this.getDataPath("/" + encodeURIComponent(fileName) + "/meta");
            nbLogger("FileBucket.getMetadata(), path=" + path);
            req = new HttpRequest(this._service, path);
            req.setMethod("GET");
        }

        const promise = req.execute().then(response => {
            nbLogger("FileBucket.getMetadata(), success");

            try {
                const resObj = JSON.parse(response);
                const metadata = this._createMetadata(resObj);
                return Promise.resolve(metadata);
            } catch (e) {
                nbLogger("FileBucket.getMetadata(), Invalid response : " + response);
                const errorResult = _createError(0, "Invalid response from server", e);
                errorResult.data = fileName;
                return Promise.reject(errorResult);
            }
        }, err => {
            nbLogger(("FileBucket.getMetadata(), error: " + (_errorText(err))));
            err.data = fileName;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットの指定されたファイルのメタデータを更新する
     * @example
     *      var bucket = ....;
     *      ....
     *      var meta = ....;
     *      ....
     *      callbacks = {
     *          success: function(metadata) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.updateMetadata("MyFile.jpg", meta, callbacks);
     * @param {String} fileName メタデータを更新するファイルの名前
     * @param {FileMetadata} metadata 更新メタデータ
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(metadata)
     *             metadata : ファイルのメタデータ(Nebula.FileMetadataインスタンス)
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    updateMetadata(fileName: string, metadata: FileMetadata, callbacks?: Callbacks): Promise<FileMetadata> {
        nbLogger("FileBucket.updateMetadata(), fileName=" + fileName);

        if (fileName == null || fileName === "") {
            nbLogger("FileBucket.updateMetadata(), Parameter is invalid : fileName");
            throw new Error("No fileName");
        }

        if (!(metadata instanceof FileMetadata)) {
            nbLogger("FileBucket.updateMetadata(), Parameter is invalid : metadata");
            throw new Error("metadata is not instance of FileMetadata");
        }

        const body: any = {};
        let req: ApiRequest;
        if (this._service.isOffline()) {
            req = new _SdeRequest(this.getClassName(), "updateMetadata");
            body.bucketName = this.getBucketName();
            body.targetFileName = fileName;
            body.cacheDisabled = metadata.isCacheDisabled();
        } else {
            const path = this.getDataPath("/" + encodeURIComponent(fileName) + "/meta");
            nbLogger("FileBucket.updateMetadata(), path=" + path);
            req = new HttpRequest(this._service, path);
            req.setMethod("PUT");
        }

        if (metadata.getFileName() != null) {
            body.filename = metadata.getFileName();
        }

        if (metadata.getContentType() != null) {
            body.contentType = metadata.getContentType();
        }

        if (metadata.getAcl() != null) {
            body.ACL = metadata.getAcl()._toJsonObject();
        }

        if (metadata.getOptions() != null) {
            body.options = JSON.stringify(metadata.getOptions());
        }

        req.setData(body);

        const promise = req.execute().then(response => {
            nbLogger("FileBucket.updateMetadata(), success");

            try {
                const resObj = JSON.parse(response);
                metadata._setMetadata(resObj);
                return Promise.resolve(metadata);
            } catch (e) {
                nbLogger("FileBucket.updateMetadata(), success: exception=" + e);
                const errorResult = _createError(0, "Invalid response from server", e);
                errorResult.data = fileName;
                return Promise.reject(errorResult);
            }
        }, err => {
            nbLogger(("FileBucket.updateMetadata(), error: " + (_errorText(err))));
            err.data = fileName;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /// Offline

    private static _checkOfflineService(service: NebulaService) {
        if (service !== Nebula) {
            nbLogger("ObjectBucket.setSyncScope(): Can't use for multitenant instance");
            throw new Error("No multitenant support");
        }
        if (!service.isOffline()) {
            nbLogger("ObjectBucket.setSyncScope(), supported offline mode only");
            throw new Error("No offline mode enabled");
        }
    }

    /**
     * @memberOf FileBucket
     * @description
     *      アップロードするファイルを選択する(SDE4SD).
     *      <p>本APIはオフライン(SDE4SD)のみで利用可能
     * @example
     *      var callbacks = {
     *          success: function(fileInfo) {....},
     *          error: function(err) {....}
     *      };
     *      Nebula.FileBucket.selectUploadFile(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(fileInfo)
     *             fileInfo : 選択したファイル情報(以下のJSON形式)
     *                          { "path" : "ファイルのパス情報",
     *                            "name" : "ファイル名",
     *                            "type" : "コンテンツタイプ" }
     *                          ※ コンテンツタイプを特定できない場合は空白
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static selectUploadFile(callbacks?: Callbacks): Promise<FileInfo> { return null; }

    protected static _selectUploadFile(service: NebulaService, callbacks?: Callbacks): Promise<FileInfo> {
        nbLogger("FileBucket.selectUploadFile()");

        this._checkOfflineService(service);

        const req = new _SdeRequest(BaseBucket.getClassName("file"), "selectUploadFile");

        const promise = req.execute().then(response => {
            try {
                const resObj = JSON.parse(response);
                return Promise.resolve(resObj);
            } catch (e) {
                nbLogger("FileBucket.selectUploadFile(), success: exception=" + e);
                const errorResult = _createError(0, "Invalid response from server", e);
                return Promise.reject(errorResult);
            }
        }, err => {
            nbLogger(("FileBucket.selectUploadFile(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ディレクトリを選択する(SDE4SD).
     *      <p>本APIはオフライン(SDE4SD)のみで利用可能
     * @example
     *      var callbacks = {
     *          success: function(dir) {....},
     *          error: function(err) {....}
     *      };
     *      Nebula.FileBucket.selectDirectory(callbacks);
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(dir)
     *             dir : 選択したディレクトリへのパス(文字列)
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    static selectDirectory(callbacks?: Callbacks): Promise<string> { return null; }

    protected static _selectDirectory(service: NebulaService, callbacks?: Callbacks): Promise<string> {
        nbLogger("FileBucket.selectDirectory()");

        this._checkOfflineService(service);

        const req = new _SdeRequest(BaseBucket.getClassName("file"), "selectDirectory");

        const promise = req.execute().then(response => {
            try {
                const resObj = JSON.parse(response);
                return Promise.resolve(resObj.path);
            } catch (e) {
                nbLogger("FileBucket.selectUploadFile(), success: exception=" + e);
                const errorResult = _createError(0, "Invalid response from server", e);
                return Promise.reject(errorResult);
            }
        }, err => {
            nbLogger(("FileBucket.selectDirectory(), error: " + (_errorText(err))));
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    private _uploadFile(fileName: string, filePath: string, metadata: FileMetadata, update: boolean, callbacks?: Callbacks): Promise<FileMetadata> {
        nbLogger("FileBucket._uploadFile()");

        if (!this._service.isOffline()) {
            nbLogger("FileBucket._uploadFile(), only offline mode");
            throw new Error("No offline mode enabled");
        }

        if (!fileName || fileName === "") {
            nbLogger("FileBucket._uploadFile(), Parameter is invalid : fileName");
            throw new Error("No fileName");
        }

        if (!filePath || filePath === "") {
            nbLogger("FileBucket._uploadFile(), Parameter is invalid : filePath");
            throw new Error("No filePath");
        }

        if (!metadata || !metadata.getContentType() || metadata.getContentType() === "") {
            nbLogger("FileBucket._uploadFile(), Parameter is invalid : metadata");
            throw new Error("No metadata.contentType");
        }

        let method = "uploadNewFile";
        if (update) {
            method = "uploadUpdateFile";
        }

        const req = new _SdeRequest(this.getClassName(), method);
        const body: any = {};
        body.bucketName = this.getBucketName();
        body.fileName = fileName;
        body.filePath = filePath;
        body.cacheDisabled = metadata.isCacheDisabled();
        body.contentType = metadata.getContentType();

        if (metadata.getAcl() != null) {
            body.ACL = metadata.getAcl()._toJsonObject();
        }
        if (metadata.getOptions() != null) {
            // TODO: ブリッジ側対応必要
            body.options = JSON.stringify(metadata.getOptions());
        }

        req.setData(body);

        const promise = req.execute().then(response => {
            try {
                const resObj = JSON.parse(response);

                if (metadata === null) {
                    metadata = new FileMetadata();
                }

                metadata._setMetadata(resObj);
                return Promise.resolve(metadata);
            } catch (e) {
                nbLogger("FileBucket.uploadNewFile(), success: exception=" + e);
                const errorResult = _createError(0, "Invalid response from server", e);
                errorResult.data = fileName;
                return Promise.reject(errorResult);
            }
        }, err => {
            nbLogger(("FileBucket.uploadNewFile(), error: " + (_errorText(err))));
            err.data = fileName;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルを新規アップロードする(SDE4SD).
     *      <p>本APIはオフライン(SDE4SD)のみで利用可能
     * @example
     *      var bucket = ....;
     *      Nebula.FileBucket.selectUploadFile({
     *          success: function(fileInfo) {
     *              var meta = new Nebula.FileMetadata();
     *              meta.setContentType(fileInfo.type);
     *              meta.setCacheDisabled(false);
     *
     *              var callbacks = {
     *                  success: function(metadata) {....},
     *                  error: function(err) {....}
     *              };
     *              bucket.uploadNewFile(fileInfo.name, fileInfo.path, meta, callbacks);
     *          },
     *          error: function(err) {....}
     *      });
     * @param {String} fileName ファイルバケットへ保存するファイル名
     * @param {String} filePath 保存する元ファイルの絶対パス(ファイル名含む)
     * @param {FileMetadata} metadata 保存するファイルのメタデータ
     * <pre>
     * 指定できるメタデータは以下の通りである。(他のメタデータは参照されない)
     * ・ACL (オプション、省略可)
     * ・コンテンツタイプ (必須、省略不可)
     * ・キャッシュフラグ (必須、省略不可)
     * </pre>
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(metadata)
     *             metadata : Nebula.FileMetadata インスタンス
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    uploadNewFile(fileName: string, filePath: string, metadata: FileMetadata, callbacks?: Callbacks): Promise<FileMetadata> {
        nbLogger("FileBucket.uploadNewFile()");
        return this._uploadFile(fileName, filePath, metadata, false, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルを更新アップロードする(SDE4SD).
     *      <p>本APIはオフライン(SDE4SD)のみで利用可能
     * @example
     *      var bucket = ....;
     *      Nebula.FileBucket.selectUploadFile({
     *          success: function(fileInfo) {
     *              var meta = new Nebula.FileMetadata();
     *              meta.setContentType(fileInfo.type);
     *              meta.setCacheDisabled(false);
     *
     *              var callbacks = {
     *                  success: function(metadata) {....},
     *                  error: function(err) {....}
     *              };
     *              bucket.uploadUpdateFile(fileInfo.name, fileInfo.path, meta, callbacks);
     *          },
     *          error: function(err) {....}
     *      });
     * @param {String} fileName ファイルバケットへ保存するファイル名
     * @param {String} filePath 保存する元ファイルの絶対パス(ファイル名含む)
     * @param {FileMetadata} metadata 保存するファイルのメタデータ
     * <pre>
     * 指定できるメタデータは以下の通りである。(他のメタデータは参照されない)
     * ・ACL (オプション、省略可)
     * ・コンテンツタイプ (必須、省略不可)
     * ・キャッシュフラグ (必須、省略不可)
     * </pre>
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(metadata)
     *             metadata : Nebula.FileMetadata インスタンス
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    uploadUpdateFile(fileName: string, filePath: string, metadata: FileMetadata, callbacks?: Callbacks): Promise<FileMetadata> {
        nbLogger("FileBucket.uploadUpdateFile()");
        return this._uploadFile(fileName, filePath, metadata, true, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルをダウンロードする (SDE4SD).
     *      <p>本APIはオフライン(SDE4SD)のみで利用可能
     * @example
     *      var bucket = ....;
     *      ....
     *      callbacks = {
     *          success: function(fileName) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.download("MyFile.jpg", "/sdcard/MyFile.jpg", callbacks);
     * @param {String} fileName ファイルバケットからダウンロードするファイルの名前
     * @param {String} filePath ダウンロードするファイルの保存先(ファイル名を含む絶対パス)
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(fileName)
     *             fileName : ダウンロードが完了したファイル名
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    downloadFile(fileName: string, filePath: string, callbacks?: Callbacks): Promise<string> {
        nbLogger("FileBucket.downloadFile()");

        FileBucket._checkOfflineService(this._service);

        if (!fileName || fileName === "") {
            nbLogger("FileBucket.downloadFile(), Parameter is invalid : fileName");
            throw new Error("No fileName");
        }

        if (!filePath || filePath === "") {
            nbLogger("FileBucket.downloadFile(), Parameter is invalid : filePath");
            throw new Error("No filePath");
        }

        const req = new _SdeRequest(this.getClassName(), "downloadFile");
        const body = {
            bucketName: this.getBucketName(),
            fileName,
            filePath
        };
        req.setData(body);

        const promise = req.execute().then(response => {
            try {
                const resObj = JSON.parse(response);
                nbLogger("FileBucket.downloadFile(), response=" + response);
                return Promise.resolve(fileName);
            } catch (e) {
                nbLogger("FileBucket.downloadFile(), success: exception=" + e);
                const errorResult = _createError(0, "Invalid response from server", e);
                errorResult.data = fileName;
                return Promise.reject(errorResult);
            }
        }, err => {
            nbLogger(("FileBucket.downloadFile(), error: " + (_errorText(err))));
            err.data = fileName;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルのアップロードまたはダウンロードをキャンセルする
     *      <br/><strong>現在、本APIは利用できません.</strong>
     *      <p>本APIはキャンセル要求を受け付けるだけであり、キャンセルされたことを保障するものではない。
     *      <br/>アップロードまたはダウンロードがキャンセルされた場合は、
     *           各API(uploadNewFile(), uploadUpdateFile(), downloadFile())のエラーコールバックが呼ばれる。
     *      <p>本APIはオフラインのみで利用可能
     * @example
     *      var bucket = ....;
     *      ....
     *      callbacks = {
     *          success: function(fileName) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.download("MyFile.jpg", "/sdcard/MyFile.jpg", callbacks);
     *      ....
     *      var cancel_callbacks = {
     *          success: function(fileName) {....},
     *          error: function(err) {....}
     *      };
     *      bucket.requestCancel(fileName, cancel_callbacks);
     * @param {String} fileName ファイルバケットからダウンロードするファイルの名前
     * @param {Callbacks} callbacks 成功時と失敗時の応答コールバック
     * <pre>
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(fileName)
     *             fileName : キャンセル要求したファイル名
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(err)
     *             err : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ,
     *                  "data"          : 引数で指定されたfileName
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * @private
     */
    requestCancel(fileName: string, callbacks?: Callbacks): Promise<string> {
        nbLogger("FileBucket.requestCancel()");

        FileBucket._checkOfflineService(this._service);

        if (!(typeof fileName !== "undefined" && fileName !== null) || fileName === "") {
            nbLogger("FileBucket.requestCancel(), Parameter is invalid : fileName");
            throw new Error("No fileName");
        }

        const req = new _SdeRequest(this.getClassName(), "requestCancel");
        const body = {
            bucketName: this.getBucketName(),
            fileName
        };
        req.setData(body);

        const promise = req.execute().then(response => {
            try {
                nbLogger("FileBucket.requestCancel(), response=" + response);
                return Promise.resolve(fileName);
            } catch (e) {
                nbLogger("FileBucket.requestCancel(), success: exception=" + e);
                const errorResult = _createError(0, "Invalid response from server", e);
                errorResult.data = fileName;
                return Promise.reject(errorResult);
            }
        }, err => {
            nbLogger(("FileBucket.requestCancel(), error: " + (_errorText(err))));
            err.data = fileName;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }
}
