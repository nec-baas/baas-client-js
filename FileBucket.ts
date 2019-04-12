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
 * ファイルリクエスト用オプション
 */
export interface FileRequestOptions {
    /** Raw リクエスト(trueの場合、extraResponseは無効) **/
    rawRequest?: boolean;
    /** ステータスコード、ヘッダ情報を含めて取得する **/
    extraResponse?: boolean;
    /** if-matchヘッダの付与 **/
    ifMatch?: string;
     /** if-range ヘッダの付与 **/
    ifRange?: string;
    /** 開始位置 **/
    rangeStart?: number;
    /** 終了位置 **/
    rangeEnd?: number;
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
     * var bucket = new Nebula.FileBucket("bucket1");
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
     * Nebula.FileBucket.loadBucket()
     *     .then(function(bucket) {....})
     *     .catch(function(err) {....});
     * @param {String} name ファイルバケット名
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ファイルバケット(Nebula.FileBucket) インスタンス
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ,
     *       "data"          : ファイルバケット名(nameに同じ)
     *   }
     * </pre>
     * </ul>
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
     * Nebula.FileBucket.getBucketList()
     *     .then(function(bucketList) {....})
     *     .catch(function(error) {....});
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ファイルバケット名の配列
     * <li>失敗時: エラー要因(JSON)
     * </ul>
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
     * var bucket = new Nebula.FileBucket("Person");
     * ....
     * bucket.saveBucket()
     *     .then(function(bucket) {....})
     *     .catch(function(error) {....});
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ファイルバケット (Nebula.FileBucket) インスタンス
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ
     *       "data"          : Nebula.FileBucket インスタンス
     *   }
     * </pre>
     * </ul>
     */
    saveBucket(callbacks?: Callbacks): Promise<FileBucket> {
        return super.saveBucket(callbacks) as Promise<FileBucket>;
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットを削除する
     * @example
     * var bucket = new Nebula.FileBucket("Person");
     * ....
     * callbacks = {
     *     success: function(bucket) {....},
     *     error: function(err) {....}
     * };
     * bucket.deleteBucket(callbacks);
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ファイルバケット (Nebula.FileBucket) インスタンス
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ
     *       "data"          : Nebula.FileBucket インスタンス
     *   }
     * </pre>
     * </ul>
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
     * var bucket = ....;
     * var acl = new Nebula.Acl();
     * ....
     * acl.addEntry(....);
     * ....
     * bucket.setAcl(acl);
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
     * var bucket = ....;
     * ....
     * var acl = bucket.getAcl();
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
     * var bucket = ....;
     * var acl = new Nebula.Acl();
     * ....
     * acl.addEntry(....);
     * ....
     * bucket.setContentAcl(acl);
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
     * var bucket = ....;
     * ....
     * var acl = bucket.getAcl();
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
     * var bucket = ....;
     * var acl = new Nebula.Acl();
     * ....
     * acl.addEntry(....);
     * ....
     * bucket.setDescription("このバケットの説明文”);
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
     * var bucket = ....;
     * ....
     * var description = bucket.getDescription();
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
     * var bucket = ....;
     * ....
     * var bucketName = bucket.getBucketName();
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
     * var bucket = ....;
     * ....
     * var file = ....;
     * ....
     * var meta = new Nebula.FileMetadata();
     * meta.setContentType("image/jpeg");
     * bucket.saveAs("MyFileName.jpg", file, meta)
     *     .then(function(metadata) {...})
     *     .catch(function(err) {...});
     * @param {String} fileName ファイルバケットへ保存するファイル名
     * @param {Object} data 文字列、File/Blobオブジェクト、または Buffer オブジェクト。
     * <p>サーバに保存するファイルのデータを以下のいずれかで指定する。
     * <ul>
     *   <li>保存するファイルにバインドされたFileオブジェクト
     *   <li>保存するファイルのデータ。文字列/Blobオブジェクト/Bufferオブジェクトのいずれか。
     * </ul>
     * @param {FileMetadata} metadata 保存するファイルのメタデータ
     * <p>指定できるメタデータは以下の通りである。(他のメタデータは参照されない)
     * <ul>
     *   <li>ACL (オプション、省略可)
     *   <li>コンテンツタイプ (必須、省略不可)
     * </ul>
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: Nebula.FileMetadata インスタンス
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ
     *       "data"          : 引数で指定されたfileName
     *   }
     * </pre>
     * </ul>
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
     * var bucket = ....;
     * ....
     * var file = ....;
     * ....
     * bucket.save("MyFileName.jpg", file)
     *     .then(function(metadata) {...})
     *     .catch(function(err) {...});
     * @param {String} fileName ファイルバケットへ保存するファイル名
     * @param {Object} data 文字列、File/Blobオブジェクト、または Buffer オブジェクト
     * <p>サーバに保存するファイルのデータを以下のいずれかで指定する。
     * <ul>
     *   <li>保存するファイルにバインドされたFileオブジェクト
     *   <li>保存するファイルのデータ。文字列/Blobオブジェクト/Bufferオブジェクトのいずれか。
     * </ul>
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: Nebula.FileMetadata インスタンス
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ
     *       "data"          : 引数で指定されたfileName
     *   }
     * </pre>
     * </ul>
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
     * var bucket = ....;
     * ....
     * bucket.load("MyFile.jpg")
     *     .then(function(blob) {...})
     *     .catch(function(err) {...});
     * @param {String} fileName ファイルバケットから読み込むファイルの名前
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ファイルの内容が格納されたBlobオブジェクト (node.js の場合は Buffer オブジェクト)
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ
     *       "data"          : 引数で指定されたfileName
     *   }
     * </pre>
     * </ul>
     */
    load(fileName: string, callbacks?: Callbacks): Promise<any> {
        return this._load(fileName, undefined, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットからオプションを指定してファイルを読み込む.
     *      <p>Node.js のみで実行可能。
     * @param {String} fileName ファイルバケットから読み込むファイルの名前
     * @param {Object} options   ファイル取得のパラメータ(オプション)。
     * <p>JSONで指定する。各フィールドの説明は以下の通り。
     * <ul>
     *  <li>"rawRequest"
     *      <p>ファイルをRaw messageとして読み込む場合にtrueを設定する。(オプション)
     *                 <p>trueの場合、extraResponseは無効となる。原則として応答の取得にはPromiseを使用すること。
     *
     *                 <p>HTTP/1.1において、処理が成功した場合、Promise には http.IncomingMessage が返される。
     *                 http.IncomingMessage に対するイベントハンドラを自身で設定、適切にハンドリングすること。
     *                 データ読み込み時は http.IncomingMessage よりレスポンスのステータスを取得、判定を行うこと。
     *
     *                 <p>リクエスト送信が失敗した場合、Promise には error が返される。
     *
     *                 <p>HTTP/2において、処理が成功した場合、Promise には http2.ClientHttp2Stream が返される。
     *                 ClientHttp2Stream に対するイベントハンドラを自身で設定、適切にハンドリングすること。
     *                 HTTP/2のステータスコードを取得するには、'response'イベントの':status'を参照する。
     *                 具体的な指定方法はexamplesを参照。
     *
     *  <li>"extraResponse"
     *      <p>レスポンスにステータスコード、ヘッダを追加する。(オプション)</p>
     *      <p>通常レスポンスにはBuffer オブジェクトを返却するが、
     *      extraResponseをtrueに設定した場合、以下のプロパティが設定されたJSONを返却する。</p>
     *      <ul>
     *          <li>status  : ステータスコード,
     *          <li>headers : レスポンスヘッダ情報を含むオブジェクト,
     *          <li>body    : ファイルデータが格納されたBufferオブジェクト
     *      </ul>
     *  </li>
     *
     *  <li>"ifMatch"
     *      <p>If-Matchヘッダを付与する場合に指定(オプション)
     *              <p>値はファイルのETagを使用する。
     *              サーバのファイルが更新されている場合、エラーを返却する。
     *
     *  <li>"ifRange"
     *      <p>If-Rangeヘッダを付与する場合に指定 (オプション)
     *      <p>値はファイルのETagを使用する。
     *      rangeStart/rangeEndを指定しない場合は無効である。
     *      <p>ETag不一致の場合、rangeStart/rangeEndをは参照せず更新済みの新しいファイルを取得する。
     *      <p>ifRange より ifMatchを優先して評価する。ファイルが更新されている場合でもファイル取得を行うには、ifRangeのみを指定すること。
     *
     *  <li>"rangeStart
     *      <p>取得するファイルの開始位置(オプション)
     *
     *  <li>"rangeEnd"
     *      <p>ファイルの終了位置(オプション)
     *      <p>rangeStartと組み合わせて、"0〜(ファイルサイズ-1)"の範囲で指定を行う。
     *      <p>rangeEndのみ指定した場合は、末尾の取得バイト数を表す。
     *      rangeStart/rangeEndの値をベースにRangeヘッダを付与する。
     *      <p>不正な範囲の場合、サーバでファイルのサイズに合わせて値を変更する場合がある。
     *      メタデータからファイルサイズを検証し、ifMatch、ifRangeと組み合わせて使用することを推奨する。
     *      具体的な指定方法はexamplesを参照。
     * </ul>
     * @param {Callbacks} callbacks コールバック (Option)
     * <ul>
     * <li>optionに {rawRequest:true}を指定した場合、callbacksは指定できない。Promiseを使用すること。
     * </ul>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: option の extraResponse, rawRequest 指定により、渡される値が異なる。
     *     <ul>
     *     <li>a) ファイルのBufferオブジェクト (option の extraResponse, rawRequest を指定しない場合)</li>
     *
     *     <li>b) ファイルデータを含む JSON オブジェクト (optionに {extraResponse:true} を指定した場合)
     *     <pre>
     *       {
     *           status : ステータスコード,
     *           headers : レスポンスヘッダ情報を含むオブジェクト,
     *           body : ファイルデータが格納されたオブジェクト
     *       }
     *
     *       範囲囲指定のオプションを指定した場合、以下statusが返却される。
     *         ・200 ファイル全体を取得
     *         ・206 ファイルの一部取得
     *
     *       headersには以下をヘッダを含む。
     *         ・etag : ファイルのETag。
     *           値はダブルクオーテーション(")で囲まれている。
     *           etag参照時はクオーテーションを削除して使用すること。
     *             例) headers["etag"].replace(/[¥"]/g, "");
     *     </pre>
     *     </li>
     *     <li>c) http.IncomingMessage または http2.ClientHttpStream (option に {rawRequest: true} を指定した場合)</li>
     *     </ul>
     * </li>
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *     {
     *         "status"        : ステータスコード,
     *         "statusText"    : エラーメッセージ,
     *         "responseText"  : レスポンスメッセージ,
     *         "data"          : 引数で指定されたfileName,
     *     }
     *     範囲指定の読み込みでは以下statusのエラーが発生することがある。
     *     内容に応じて対処を行うこと。
     *         412 : ファイルが更新されているためダウンロード失敗
     *         416 : 範囲指定不正のためダウンロード失敗
     * </pre></li>
     * </ul>
     * @since 7.5.0
     * @example
     * // Raw Requestの例
     * // for HTTP/1.1
     * var bucket = ....;
     * ....
     * // pipe()を使用する場合
     * var writable = fs.createWriteStream(....);
     * bucket.loadWithOptions("MyFile.jpg", {rawRequest: true})
     *     .then((message) => {
     *         message.pipe(writable);
     *     });
     *
     * // 'data'を実装する場合
     * bucket.loadWithOptions("MyFile.jpg", {rawRequest: true})
     *     .then((message) => {
     *         message.on('data', () => {....});
     *         message.on('end', () => {....});
     *         message.on('error', () => {....});
     *         message.on('close', () => {....});
     *     });
     *
     * // for HTTP/2
     * // 'data'を実装する場合
     * var statusCode;
     * bucket.loadWithOptions("MyFile.jpg", {rawRequest: true})
     *     .then((message) => {
     *         message.on('response', (headers, flags) => { statusCode = headers[':status'] });
     *         message.on('data', () => {....});
     *         message.on('end', () => {....});
     *         message.on('error', () => {....});
     *         message.on('close', () => {....});
     *     });
     * @example
     * // start,end 指定の例 詳細はRFC7233を参照
     * // サーバに1000 byteのファイルが格納されている場合
     * // 最初の50byteを取得
     * var options = { rangeStart : 0, rangeEnd: 49 };
     * // 次の50byteを取得
     * options     = { rangeStart : 50, rangeEnd: 99 };
     * // 末尾の50byteを取得する(以下指定は等価である)
     * options     = { rangeStart : 950 };
     * options     = { rangeEnd   : 50 };
     * options     = { rangeStart : 950, rangeEnd: 999 };
     * // 先頭の1byteを指定
     * options     = { rangeStart: 0, rangeEnd: 0 };
     * // 末尾の1byteを指定
     * options     = { rangeEnd: 1 };
     *
     * options["extraResponse"] = true; // ステータスコードなどを含めて取得
     * // APIコール
     * var bucket = ....;
     * ....
     * callbacks = {
     *     // options["extraResponse"] がtrueでない場合、dataにはファイルデータが設定される
     *     success: function(data) {
     *         var status  = data.status;
     *         var headers = data.headers;
     *         var body    = data.body;
     *         ....
     *     },
     *     error: function(err) {....}
     * };
     * bucket.loadWithOptions("MyFile.jpg", options, callbacks);
     */
    loadWithOptions(fileName: string, options?: FileRequestOptions, callbacks?: Callbacks): Promise<any> {
        return this._load(fileName, options, callbacks);
    }

    _load(fileName: string, options?: FileRequestOptions, callbacks?: Callbacks): Promise<any> {
        nbLogger("FileBucket._load()");

        if (!(typeof fileName !== "undefined" && fileName !== null)) {
            nbLogger("FileBucket._load(), Parameter is invalid : fileName");
            throw new Error("No fileName");
        }

        let rawRequest: boolean = false;
        if (typeof options !== "undefined") {
            // validate options
            if (options === null || typeof options !== "object") {
                // typeof null -> "object"
                nbLogger("FileBucket._load(), Invalid options: " + options);
                throw new Error("Invalid options: " + options);
            }

            if (options["rawRequest"] === true) {
                if (!(typeof Blob !== "undefined" && Blob !== null) && !(typeof Buffer !== "undefined" && Buffer !== null)) {
                    nbLogger("FileBucket._load(), Not supported Blob nor Buffer");
                    throw new Error("No Blob/Buffer support");
                }
                rawRequest = true;
            }
        }

        const path = this.getDataPath("/" + encodeURIComponent(fileName));
        nbLogger("FileBucket._load(), path=" + path);
        const req = new HttpRequest(this._service, path);
        req.setMethod("GET");

        if (rawRequest) {
            req.rawMessage = true;
        } else {
            if (typeof Blob !== "undefined" && Blob !== null) {
                req.setResponseType("blob");
            } else if (typeof Buffer !== "undefined" && Buffer !== null) {
                req.setResponseType("buffer");
            }
        }

        if (typeof options !== "undefined") {
            const receiveResponse = options["extraResponse"];
            if (receiveResponse === true) {
                req.setReceiveResponseHeaders(true);
            }
            // Range
            const start = options["rangeStart"];
            const end = options["rangeEnd"];
            const range = FileBucket._createRangeValue(start, end);
            if (range !== undefined) {
                // Range: bytes=range-value
                req.addRequestHeader("Range", "bytes=" + range);
            }
            // If-Match,If-Range
            const ifMatch = options["ifMatch"];
            if (typeof ifMatch !== "undefined") {
                // If-Match: "ETag"
                req.addRequestHeader("If-Match", '"' + ifMatch + '"');
            }
            const ifRange = options["ifRange"];
            if (typeof ifRange !== "undefined") {
                // If-Range: "ETag"
                req.addRequestHeader("If-Range", '"' + ifRange + '"');
            }
        }

        const promise = req.execute().then(response => {
            return response;
        }, err => {
            nbLogger(("FileBucket._load(), error: " + (_errorText(err))));
            err.data = fileName;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description start/end位置からRangeヘッダに指定する値を生成する
     * @private
     */
    static _createRangeValue(start: number, end: number): string {
        // undefinedは許容
        if (start !== undefined && (!Number.isInteger(start) || start < 0)) {
            throw new Error("invalid rangeStart value: " + start);
        }
        if (end !== undefined && (!Number.isInteger(end) || end < 0)) {
            throw new Error("invalid rangeEnd value: " + end);
        }

        // Rangeの範囲チェックはサーバ側で行う
        let range: string = undefined;
        if (start === undefined && end === undefined) {
            // star,endとも未指定の場合はRangeヘッダを付与しない
            // 何もしない
        } else if (start !== undefined && end === undefined) {
            // startのみ指定
            range = start + "-";
        } else if (start === undefined && end !== undefined) {
            // endのみ指定
            range = "-" + end;
        } else {
            // start,endともに指定
            range = start + "-" + end;
        }

        return range;
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットからファイルを削除する.
     * @example
     * var bucket = ....;
     * ....
     * bucket.remove("fileName")
     *     .then(function(fileName) {...})
     *     .catch(function(err) {...});
     * @param {String} fileName ファイルバケットから削除するファイルの名前
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ファイル名(引数で指定されたfileNameと同じ)
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *     {
     *         "status"        : ステータスコード,
     *         "statusText"    : エラーメッセージ,
     *         "responseText"  : レスポンスメッセージ,
     *         "data"          : 引数で指定されたfileName
     *     }
     * </pre>
     * </ul>
     * @since v4.0.1
     */
    remove(fileName: string, callbacks?: Callbacks): Promise<string> {
        nbLogger("FileBucket.remove()");

        if (!(typeof fileName !== "undefined" && fileName !== null)) {
            nbLogger("FileBucket.remove(), Parameter is invalid : fileName");
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
            nbLogger("FileBucket.remove(), path=" + path);
            req = new HttpRequest(this._service, path);
            req.setMethod("DELETE");
        }

        const promise = req.execute().then(response => {
            nbLogger("FileBucket.remove(), success: " + fileName);
            return fileName;
        }, err => {
            nbLogger(("FileBucket.remove(), error: " + (_errorText(err)) + " : " + (fileName)));
            err.data = fileName;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @memberOf FileBucket
     * @description
     *      ファイルバケットからファイルを削除する(Deprecated)
     * <p>本APIは Deprecated である。remove() を使用すること。
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
     * var bucket = ....;
     * ....
     * bucket.publish("MyFile.jpg")
     *     .then(function(metadata) {...})
     *     .catch(function(err) {...});
     * @param {String} fileName 公開するファイルの名前
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: このファイルのメタデータ
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *    {
     *        "status"        : ステータスコード,
     *        "statusText"    : エラーメッセージ,
     *        "responseText"  : レスポンスメッセージ,
     *        "data"          : 引数で指定されたfileName
     *    }
     * </pre>
     * </ul>
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
     * var bucket = ....;
     * ....
     * bucket.unpublish("MyFile.jpg", callbacks)
     *     .then(function(metadata) {...})
     *     .catch(function(err) {...});
     * @param {String} fileName 非公開にするファイルの名前
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: このファイルのメタデータ
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ,
     *       "data"          : 引数で指定されたfileName
     *   }</pre>
     * </ul>
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
     * var bucket = ....;
     * ....
     * bucket.getList()
     *     .then(function(metadataList) {...})
     *     .catch(function(err) {...});
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ファイルのメタデータ(Nebula.FileMetadataインスタンス)の配列
     * <li>失敗時: エラー要因(JSON)
     * </ul>
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
     * var bucket = ....;
     * ....
     * bucket.getPublishedList()
     *     .then(function(metadataList) {...})
     *     .catch(function(err) {...});
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ファイルのメタデータ(Nebula.FileMetadataインスタンス)の配列
     * <li>失敗時: エラー要因(JSON)
     * </ul>
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
     * var bucket = ....;
     * ....
     * bucket.getMetadata("MyFile.jpg")
     *     .then(function(metadata) {...})
     *     .catch(function(err) {...});
     * @param {String} fileName メタデータを取得するファイルの名前
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ファイルのメタデータ(Nebula.FileMetadataインスタンス)
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ,
     *       "data"          : 引数で指定されたfileName
     *   }</pre>
     * </ul>
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
     * var bucket = ....;
     * ....
     * var meta = ....;
     * ....
     * bucket.updateMetadata("MyFile.jpg", meta)
     *     .then(function(metadata) {...})
     *     .catch(function(err) {...});
     * @param {String} fileName メタデータを更新するファイルの名前
     * @param {FileMetadata} metadata 更新メタデータ
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ファイルのメタデータ(Nebula.FileMetadataインスタンス)
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ,
     *       "data"          : 引数で指定されたfileName
     *   }
     * </pre>
     * </ul>
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
     * Nebula.FileBucket.selectUploadFile()
     *     .then(function(fileInfo) {...})
     *     .catch(function(err) {...});
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: 選択したファイル情報(以下のJSON形式)
     * <pre>
     * {
     *     "path" : "ファイルのパス情報",
     *     "name" : "ファイル名",
     *     "type" : "コンテンツタイプ"  // ※ コンテンツタイプを特定できない場合は空白
     * }
     * </pre>
     * <li>失敗時: エラー要因(JSON)
     * </ul>
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
     * Nebula.FileBucket.selectDirectory()
     *     .then(function(dir) {...})
     *     .catch(function(err) {...});
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: 選択したディレクトリへのパス(文字列)
     * <li>失敗時: エラー要因(JSON)
     * </ul>
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
     * var bucket = ....;
     * Nebula.FileBucket.selectUploadFile()
     *     .then(function(fileInfo) {
     *         var meta = new Nebula.FileMetadata();
     *         meta.setContentType(fileInfo.type);
     *         meta.setCacheDisabled(false);
     *
     *         var callbacks = {
     *             success: function(metadata) {....},
     *             error: function(err) {....}
     *         };
     *         bucket.uploadNewFile(fileInfo.name, fileInfo.path, meta, callbacks);
     *     })
     *     .catch(function(err) {....});
     * @param {String} fileName ファイルバケットへ保存するファイル名
     * @param {String} filePath 保存する元ファイルの絶対パス(ファイル名含む)
     * @param {FileMetadata} metadata 保存するファイルのメタデータ
     * <br>指定できるメタデータは以下の通りである。(他のメタデータは参照されない)
     * <ul>
     *   <li>ACL (オプション、省略可)</li>
     *   <li>コンテンツタイプ (必須、省略不可)</li>
     *   <li>キャッシュフラグ (必須、省略不可)</li>
     * </ul>
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: Nebula.FileMetadata インスタンス
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ,
     *       "data"          : 引数で指定されたfileName
     *   }
     * </pre>
     * </ul>
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
     * var bucket = ....;
     * Nebula.FileBucket.selectUploadFile()
     *     .then(success: function(fileInfo) {
     *         var meta = new Nebula.FileMetadata();
     *         meta.setContentType(fileInfo.type);
     *         meta.setCacheDisabled(false);
     *
     *         var callbacks = {
     *             success: function(metadata) {....},
     *             error: function(err) {....}
     *         };
     *         bucket.uploadUpdateFile(fileInfo.name, fileInfo.path, meta, callbacks);
     *     })
     *     .catch(function(err) {....});
     * @param {String} fileName ファイルバケットへ保存するファイル名
     * @param {String} filePath 保存する元ファイルの絶対パス(ファイル名含む)
     * @param {FileMetadata} metadata 保存するファイルのメタデータ。
     * <br>指定できるメタデータは以下の通りである。(他のメタデータは参照されない)
     * <ul>
     *   <li>ACL (オプション、省略可)</li>
     *   <li>コンテンツタイプ (必須、省略不可)</li>
     *   <li>キャッシュフラグ (必須、省略不可)</li>
     * </ul>
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: Nebula.FileMetadata インスタンス
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ,
     *       "data"          : 引数で指定されたfileName
     *   }
     * </pre>
     * </ul>
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
     * var bucket = ....;
     * ....
     * bucket.download("MyFile.jpg", "/sdcard/MyFile.jpg")
     *     .then(function(fileName) {...})
     *     .catch(function(err) {...});
     * @param {String} fileName ファイルバケットからダウンロードするファイルの名前
     * @param {String} filePath ダウンロードするファイルの保存先(ファイル名を含む絶対パス)
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: ダウンロードが完了したファイル名
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ,
     *       "data"          : 引数で指定されたfileName
     *   }
     * </pre>
     * </ul>
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
     * var bucket = ....;
     * ....
     * bucket.download("MyFile.jpg", "/sdcard/MyFile.jpg")
     *     .then(function(fileName) {...});
     *     .catch(function(err) {...});
     * ....
     * bucket.requestCancel(fileName)
     *     .then(function(fileName) {...});
     *     .catch(function(err) {...});
     * @param {String} fileName ファイルバケットからダウンロードするファイルの名前
     * @param {Callbacks} callbacks コールバック (Option)
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     * <p>処理完了時に渡される値は以下の通り。
     * <ul>
     * <li>成功時: キャンセル要求したファイル名
     * <li>失敗時: エラー要因(JSON)
     * <pre>
     *   {
     *       "status"        : ステータスコード,
     *       "statusText"    : エラーメッセージ,
     *       "responseText"  : レスポンスメッセージ,
     *       "data"          : 引数で指定されたfileName
     *   }
     * </pre>
     * </ul>
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
