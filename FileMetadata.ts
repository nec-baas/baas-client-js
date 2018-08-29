import {Acl} from "./Acl";
import {nbLogger} from "./Head";

export interface FileMetadataJson {
    filename: string;
    contentType: string;
    ACL: Acl;
    length: number;
    publicUrl: string;
    createdAt: string;
    updatedAt: string;
    lastSyncTime: string;
    metaId: string;
    metaETag: string;
    fileETag: string;
    options: object;
    cacheDisabled: boolean;
    fileSyncState: number;
}

/**
 * @class FileMetadata
 * @classdesc ファイルメタデータ クラス
 * @description FileMetadata インスタンスを生成する
 * @example
 *    var meta = new Nebula.FileMetadata();
 */
export class FileMetadata {
    static SYNC_STATE_UNDEFINED = -1;
    static SYNC_STATE_SYNCED = 0;
    static SYNC_STATE_DIRTY = 1;
    static SYNC_STATE_SYNCING = 3;
    static SYNC_STATE_CONFLICTED = 5;

    _createdAt: string;
    _updatedAt: string;
    _acl: Acl;
    _contentType: string;
    _publicUrl: string;
    _fileName: string;
    _fileSize: number;
    _syncState: number;
    _lastSyncTime: string;
    _metaId: string;
    _metaETag: string;
    _fileETag: string;
    _options: object;
    _cacheDisabled: boolean;

    /** @private */
    constructor() {
        this._createdAt = null;
        this._updatedAt = null;
        this._acl = null;
        this._contentType = null;
        this._publicUrl = null;
        this._fileName = null;
        this._fileSize = -1;
        this._syncState = FileMetadata.SYNC_STATE_UNDEFINED;
        this._lastSyncTime = null;
        this._metaId = null;
        this._metaETag = null;
        this._fileETag = null;
        this._options = null;
        this._cacheDisabled = false;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイル名を取得する.
     *      <br/><br/>ファイル名がセットされていない場合は null を返す
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var fileName = metadata.getFileName();
     *          ....
     * @return
     *      {String} ファイル名を返す。ファイル名がセットされていない場合は、null を返す。
     */
    getFileName(): string {
        return this._fileName;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイル名をセットする.
     *      <br/><br/>すでにファイル名がセットされている場合は上書きされる。
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          metadata.setFileName("NewFileName.txt");
     *          ....
     * @param {String} fileName ファイル名
     * @return {FileMetadata} this
     */
    setFileName(fileName: string): FileMetadata {
        nbLogger("FileMetadata.setFileName(), " + this._fileName + " ---> " + fileName);
        this._fileName = fileName;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイルに設定されているACLを取得する.
     *      <br/><br/>ACLがセットされていない場合は null を返す
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var acl = metadata.getAcl();
     *          ....
     * @return
     *      {Acl} ACLを返す。ACLがセットされていない場合は、null を返す。
     */
    getAcl(): Acl {
        return this._acl;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイルにACLをセットする.
     *      <br/><br/>すでにACLがセットされている場合は上書きされる
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var newAcl = new Nebula.Acl();
     *          ....
     *          metadata.setAcl(newAcl);
     *          ....
     * @param {Acl} acl セットするACL
     * @return {FileMetadata} this
     */
    setAcl(acl: Acl): FileMetadata {
        if (acl != null && !(acl instanceof Acl)) {
            throw new Error("FileMetadata.setAcl: Not Acl instance!");
        }
        //nbLogger("FileMetadata.setAcl() : " + acl instanceof Acl ? acl._toString() : "null");
        this._acl = acl;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイルに設定されているコンテンツタイプを取得する.
     *      <br/><br/>コンテンツタイプがセットされていない場合は null を返す。
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var contentType = metadata.getContentType();
     *          ....
     * @return
     *      {String} ファイルにセットされているコンテンツタイプを返す。セットされていない場合は、null を返す。
     */
    getContentType(): string {
        return this._contentType;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      コンテンツタイプをセットする.
     *      <br/><br/>すでにコンテンツタイプがセットされている場合は上書きされる。
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          metadata.setContentType("image/jpeg");
     *          ....
     * @param {Acl} contentType セットするコンテンツタイプ
     * @return {FileMetadata} this
     */
    setContentType(contentType: string): FileMetadata {
        nbLogger("FileMetadata.setContentType(), " + this._contentType + " -> " + contentType);
        this._contentType = contentType;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイルの作成日時を取得する.
     *      <br/><br/>作成日時は、ISO 8601日付形式の文字列として返す。(例：2014-03-12T09:12:53.000Z)
     *      <br/>作成日時がセットされていない場合は null を返す。
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var createdAt = metadata.getCreatedAt();
     *          ....
     * @return
     *      {String} ファイルの作成日時を返す。セットされていない場合は、null を返す。
     */
    getCreatedAt(): string {
        return this._createdAt;
    }

    /**
     * @memberOf FileMetadata
     * @description ファイルの作成日時をセットする
     * @private
     */
    _setCreatedAt(createdAt: string): FileMetadata {
        this._createdAt = createdAt;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイルの更新日時を取得する.
     *      <br/><br/>更新日時は、ISO 8601日付形式の文字列として返す。(例：2014-03-12T09:12:53.000Z)
     *      <br/>更新日時がセットされていない場合は null を返す。
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var updatedAt = metadata.getUpdatedAt();
     *          ....
     * @return
     *      {String} ファイルの更新日時を返す。セットされていない場合は、null を返す。
     */
    getUpdatedAt(): string {
        return this._updatedAt;
    }

    /**
     * @memberOf FileMetadata
     * @description ファイルの更新日時をセットする
     * @private
     */
    _setUpdatedAt(updatedAt: string): FileMetadata {
        this._updatedAt = updatedAt;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイルのサイズを取得する.
     *      <br/><br/>ファイルサイズがセットされていない場合は -1 を返す
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var size = metadata.getSize();
     *          ....
     * @return
     *      {Int} ファイルサイズを返す。セットされていない場合は、-1 を返す。
     */
    getSize(): number {
        return this._fileSize;
    }

    /**
     * @memberOf FileMetadata
     * @description ファイルサイズをセットする
     * @private
     */
    _setSize(size: number): FileMetadata {
        this._fileSize = size;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイルに設定されている公開URLを取得する.
     *      <br/><br/>公開URLがセットされていない場合は null を返す。
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var url = metadata.getPublicUrl();
     *          ....
     * @return
     *      {String} 公開URLを返す。セットされていない場合は、null を返す。
     */
    getPublicUrl(): string {
        return this._publicUrl;
    }

    /**
     * @memberOf FileMetadata
     * @description 公開URLをセットする
     * @private
     */
    _setPublicUrl(url: string): FileMetadata {
        this._publicUrl = url;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイルの同期状態を取得する
     *      <br/><strong>現在、本APIは利用できません.</strong>
     *      <br/><br/>同期状態がセットされていない場合は Nebula.FileMetadata.SYNC_STATE_UNDEFINED を返す
     *      <br/><br/>本APIはオフラインのみで利用可能
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var syncState = metadata.getFileSyncState();
     *          ....
     * @return
     *      {Integer} 以下のいずれかの同期状態を返す
     * <ul><pre>
     * ・Nebula.FileMetadata.SYNC_STATE_SYNCED      : 同期済み
     * ・Nebula.FileMetadata.SYNC_STATE_DIRTY       : 追加/更新/削除
     * ・Nebula.FileMetadata.SYNC_STATE_SYNCING     : 同期中
     * ・Nebula.FileMetadata.SYNC_STATE_CONFLICTED  : 衝突発生中
     * ・Nebula.FileMetadata.SYNC_STATE_UNDEFINED   : 未設定
     * </pre></ul>
     * @private
     */
    getFileSyncState(): number {
        return this._syncState;
    }

    /**
     * @memberOf FileMetadata
     * @description ファイルの同期状態をセットする
     * @private
     */
    _setFileSyncState(syncState: number): FileMetadata {
        this._syncState = syncState;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイルの最終同期日時を取得する
     *      <br/><strong>現在、本APIは利用できません.</strong>
     *      <br/><br/>最終同期日時がセットされていない場合は null を返す
     *      <br/>同期が完了していないファイルは、同期されるまで null が設定されている
     *      <br/><br/>本APIはオフラインのみで利用可能
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var lastSyncTime = metadata.getLastSyncTime();
     *          ....
     * @return
     *      {String} 最終同期日時を返す。セットされていない場合は、null を返す。
     * @private
     */
    getLastSyncTime(): string {
        return this._lastSyncTime;
    }

    /**
     * @memberOf FileMetadata
     * @description ファイルの最終同期日時をセットする
     * @private
     */
    _setLastSyncTime(lastSyncTime: string): FileMetadata {
        this._lastSyncTime = lastSyncTime;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      ファイルメタデータIDを取得する.
     *      <br/><br/>ファイルメタデータIDがセットされていない場合は null を返す
     *      <br/>同期が完了していないファイルは、同期されるまで null が設定されている
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var metaId = metadata.getMetaId();
     *          ....
     * @return
     *      {String} ファイルメタデータIDを返す。セットされていない場合は、null を返す。
     */
    getMetaId(): string {
        return this._metaId;
    }

    /**
     * @memberOf FileMetadata
     * @description ファイルメタIDをセットする
     * @private
     */
    _setMetaId(metaId: string): FileMetadata {
        this._metaId = metaId;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      metaETag(ファイルメタデータに対するETag)を取得する.
     *      <br/><br/>metaEtagがセットされていない場合は null を返す
     *      <br/>同期が完了していないファイルは、同期されるまで null が設定されている
     *      <br/>metaETag値は、サーバ側で同期するときに使用され、一致しない場合は衝突と判断される
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var etag = metadata.getMetaETag();
     *          ....
     * @return
     *      {String} metaEtagを返す。セットされていない場合は、null を返す。
     */
    getMetaETag(): string {
        return this._metaETag;
    }

    /**
     * @memberOf FileMetadata
     * @description metaETagをセットする
     * @private
     */
    _setMetaETag(metaETag: string): FileMetadata {
        this._metaETag = metaETag;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      fileETag(ファイルに対するETag)を取得する.
     *      <br/><br/>fileEtagがセットされていない場合は null を返す
     *      <br/>同期が完了していないファイルは、同期されるまで null が設定されている
     *      <br/>fileETag値は、サーバ側で同期するときに使用され、一致しない場合は衝突と判断される
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          var etag = metadata.getFileETag();
     *          ....
     * @return
     *      {String} fileEtagを返す。セットされていない場合は、null を返す。
     */
    getFileETag(): string {
        return this._fileETag;
    }

    /**
     * @memberOf FileMetadata
     * @description metaETagをセットする
     * @private
     */
    _setFileETag(fileETag: string): FileMetadata {
        this._fileETag = fileETag;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description オプション情報(JSON)を取得する
     * @returns {Object} オプション
     */
    getOptions(): object {
        return this._options;
    }

    /**
     * @memberOf FileMetadata
     * @description オプション情報(JSON)をセットする
     * @param options オプション
     * @return {FileMetadata} this
     */
    setOptions(options: object): FileMetadata {
        this._options = options;
        return this;
    }



    /**
     * @memberOf FileMetadata
     * @description
     *      キャッシュ禁止かどうかを問い合わせる
     *      <br/><strong>現在、本APIは利用できません.</strong>
     *      <br/><br/>setCacheDisabled()で設定したキャッシュ禁止フラグを参照する
     *      <br/>キャッシュ禁止フラグが設定されていない場合は false を返す
     *      <br/><br/>本APIはオフラインのみで利用可能
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          if (metadata.isCacheDisabled()) {
     *              // キャッシュ禁止の場合の処理
     *          }
     *          else {
     *              // キャッシュOKの場合の処理
     *              ....
     *          }
     *          ....
     * @return
     *      {Boolean} キャッシュ禁止の場合はtrue、それ以外の場合はfalseを返す
     * @private
     */
    isCacheDisabled(): boolean {
        return this._cacheDisabled;
    }

    /**
     * @memberOf FileMetadata
     * @description
     *      キャッシュ禁止フラグを設定する
     *      <br/><strong>現在、本APIは利用できません.</strong>
     *      <br/><br/>キャッシュ禁止がtrueの場合、キャッシュへのファイル保存が行われない
     *      <br/><br/>本APIはオフラインのみで利用可能
     * @example
     *      fileBucket.getMetadata("MyFile.txt").then(function(metadata) {
     *          metadata.setCacheDisabled(true);
     *          ....
     * @param {Boolean} cacheDisabled キャッシュ禁止フラグ
     * @private
     */
    setCacheDisabled(cacheDisabled: boolean): FileMetadata {
        this._cacheDisabled = cacheDisabled;
        return this;
    }

    /**
     * @memberOf FileMetadata
     * @description JSONからFileMetadataインスタンスにデータをセットする
     * @private
     */
    _setMetadata(obj: FileMetadataJson): FileMetadata {
        if (obj.filename != null) {
            this.setFileName(obj.filename);
        }

        if (obj.contentType != null) {
            this.setContentType(obj.contentType);
        }

        if (obj.ACL != null) {
            const acl = new Acl(obj.ACL);
            this.setAcl(acl);
        }

        if (obj["length"] != null) {
            this._setSize(obj["length"]);
        }

        if (obj.publicUrl != null) {
            this._setPublicUrl(obj.publicUrl);
        }

        if (obj.createdAt != null) {
            this._setCreatedAt(obj.createdAt);
        }

        if (obj.updatedAt != null) {
            this._setUpdatedAt(obj.updatedAt);
        }

        if (obj.lastSyncTime != null) {
            this._setLastSyncTime(obj.lastSyncTime);
        }

        if (obj.metaId != null) {
            this._setMetaId(obj.metaId);
        }

        if (obj.metaETag != null) {
            this._setMetaETag(obj.metaETag);
        }

        if (obj.fileETag != null) {
            this._setFileETag(obj.fileETag);
        }

        if (obj.options != null) {
            this.setOptions(obj.options);
        }

        if (obj.cacheDisabled != null) {
            this.setCacheDisabled(obj.cacheDisabled);
        }

        if (obj.fileSyncState != null) {
            this._setFileSyncState(obj.fileSyncState);
        }

        return this;
    }
}
