import {Callbacks, nbLogger, _promisify, _createError, _errorText, JsonObject} from "./Head";
import {Nebula} from "./Nebula";
import {NebulaService} from "./NebulaService";
import {Acl} from "./Acl";
import {HttpRequest} from "./HttpRequest";
import {ApiRequest} from "./HttpRequest";
import {_SdeRequest} from "./SdeRequest";

import {Promise} from "es6-promise";

/**
 * @class バケット基底クラス
 * @private
 */
export class BaseBucket {
    _service: NebulaService;
    _type: string;
    _name: string;
    _acl: Acl;
    _contentAcl: Acl;
    _description: string;
    _mode: number;

    /**
     * コンストラクタ
     * @param service NebulaService
     * @param name バケット名
     * @param type 種別 ("object" or "file")
     * @param mode バケットモード(BUCKET_MODE_*)
     */
    constructor(service: NebulaService, name: string, type: string, mode: number = Nebula.BUCKET_MODE_ONLINE) {
        this._service = service;
        this._type = type;
        this._name = name;
        this._acl = null;
        this._contentAcl = null;
        this._description = null;

        if (mode !== Nebula.BUCKET_MODE_ONLINE && mode !== Nebula.BUCKET_MODE_REPLICA && mode !== Nebula.BUCKET_MODE_LOCAL) {
            this._mode = Nebula.BUCKET_MODE_ONLINE;
        } else {
            this._mode = mode;
        }
    }

    /**
     * @description バケットの読み込み
     * @private
     */
    protected static _baseLoadBucket(type: string, service: NebulaService, name: string, mode: number, callbacks: Callbacks): Promise<BaseBucket> {
        nbLogger("BaseBucket.loadBucket(), name=" + name + ", type=" + type + ", callbacks=" + callbacks + ", mode=" + mode);

        let req: ApiRequest;
        if (service.isOffline()) {
            req = new _SdeRequest(BaseBucket.getClassName(type), "loadBucket");
            const body: JsonObject = {
                bucketName: name
            };

            if (mode !== Nebula.BUCKET_MODE_ONLINE && mode !== Nebula.BUCKET_MODE_REPLICA && mode !== Nebula.BUCKET_MODE_LOCAL) {
                mode = Nebula.BUCKET_MODE_ONLINE;
            }

            body.bucketMode = mode;
            req.setData(body);
        } else {
            const path = "/buckets/" + type + "/" + encodeURIComponent(name);
            req = new HttpRequest(service, path);
            req.setMethod("GET");
            req.setContentType("application/json");
        }

        const promise = req.execute().then(response => {
            try {
                nbLogger("BaseBucket.loadBucket(), success : " + response);
                const resObj = JSON.parse(response);
                const resName = resObj.name;

                if (resName == null) {
                    nbLogger("BaseBucket.loadBucket(), invalid bucket name, name=" + resName);
                    const error = _createError(0, "Invalid response", "", name);
                    return Promise.reject(error);
                }

                nbLogger("BaseBucket.loadBucket(), new Bucket, name=" + resName);

                let bucket: BaseBucket;
                if (type === "file") {
                    bucket = new service.FileBucket(resName);
                } else {
                    bucket = new service.ObjectBucket(resName, mode);
                }

                const resAcl = resObj.ACL;
                if (resAcl != null) {
                    nbLogger("BaseBucket.loadBucket(), acl=" + resAcl);
                    const acl = new Acl();
                    acl._set(resAcl);
                    bucket.setAcl(acl);
                }

                const resContentAcl = resObj.contentACL;
                if (resContentAcl != null) {
                    nbLogger("BaseBucket.loadBucket(), contentAcl=" + resContentAcl);
                    const contentAcl = new Acl();
                    contentAcl._set(resContentAcl);
                    bucket.setContentAcl(contentAcl);
                }

                const resDescription = resObj.description;
                if (resDescription != null) {
                    nbLogger("BaseBucket.loadBucket(), description=" + resDescription);
                    bucket.setDescription(resDescription);
                }

                return Promise.resolve(bucket);
            } catch (e) {
                nbLogger("BaseBucket.loadBucket(), error : exception" + e);
                const error = _createError(0, e, e.toString(), name);
                return Promise.reject(error);
            }
        }, error => {
            nbLogger(("BaseBucket.loadBucket(), error: " + (_errorText(error))));
            error.data = name;
            return Promise.reject(error);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @description バケット一覧の取得
     * @private
     */
    protected static _baseGetBucketList(type: string, service: NebulaService, local: boolean, callbacks?: Callbacks): Promise<string[]> {
        nbLogger("BaseBucket.getBucketList(), type=" + type + ", callbacks=" + callbacks);

        let req: ApiRequest;
        if (service.isOffline()) {
            let method = "getBucketList";
            if (local) {
                method = "getLocalBucketList";
            }

            req = new _SdeRequest(BaseBucket.getClassName(type), method);
        } else {
            const path = "/buckets/" + type;
            req = new HttpRequest(service, path);
            req.setMethod("GET");
            req.setContentType("application/json");
        }

        const promise = req.execute().then(response => {
            try {
                nbLogger("BaseBucket.getBucketList(), success : " + response);
                const resObj = JSON.parse(response);
                const buckets = resObj.results;

                if (buckets != null) {
                    nbLogger("BaseBucket.getBucketList(), buckets=" + buckets);
                    const bucketNames: string[] = [];

                    for (const bucket of buckets) {
                        nbLogger("BaseBucket.getBucketList(), success : add bucketName = " + bucket.name);

                        if (bucket.name != null) {
                            bucketNames.push(bucket.name);
                        } else {
                            nbLogger("BaseBucket.getBucketList(), [WARNING] No name in response");
                        }
                    }

                    return Promise.resolve(bucketNames);
                } else {
                    nbLogger("BaseBucket.getBucketList(), invalid response");
                    const error = _createError(0, "Invalid response", "", name);
                    return Promise.reject(error);
                }
            } catch (e) {
                nbLogger("BaseBucket.getBucketList(), error : exception" + e);
                const error = _createError(0, e, e);
                return Promise.reject(error);
            }
        }, error => {
            nbLogger(("BaseBucket.getBucketList(), error: " + (_errorText(error))));
            return Promise.reject(error);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @description バケットの保存
     * @private
     */
    saveBucket(callbacks?: Callbacks): Promise<BaseBucket> {
        nbLogger("BaseBucket.saveBucket(), callbacks=" + callbacks);

        let req: ApiRequest;
        if (this._service.isOffline()) {
            req = new _SdeRequest(BaseBucket.getClassName(this._type), "saveBucket");
        } else {
            const path = this.getPath();
            req = new HttpRequest(this._service, path);
            req.setMethod("PUT");
            req.setContentType("application/json");
        }

        const body: JsonObject = {};

        if (this._acl != null) {
            body.ACL = this._acl._toJsonObject();
        }

        if (this._contentAcl != null) {
            body.contentACL = this._contentAcl._toJsonObject();
        }

        if (this._description != null) {
            body.description = this._description;
        }

        if (this._service.isOffline()) {
            body.bucketName = this.getBucketName();
            body.bucketMode = this.getBucketMode();
        }

        req.setData(body);
        nbLogger("BaseBucket.saveBucket(), body=" + JSON.stringify(body));

        const promise = req.execute().then(response => {
            nbLogger("success : " + response);
            nbLogger("bucketName : " + this.getBucketName());

            try {
                nbLogger("success : " + response);
                const resObj = JSON.parse(response);

                if (resObj.ACL != null) {
                    if (!this._acl) {
                        this._acl = new Acl();
                    }

                    this._acl._set(resObj.ACL);
                }

                if (resObj.contentACL != null) {
                    if (!this._contentAcl) {
                        this._contentAcl = new Acl();
                    }

                    this._contentAcl._set(resObj.contentACL);
                }

                return Promise.resolve(this);
            } catch (e) {
                nbLogger("error : " + e);
                return Promise.reject(e);
            }
        }, err => {
            nbLogger(("error: " + (_errorText(err))));
            err.data = this;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @description バケットの削除
     * @private
     */
    deleteBucket(callbacks?: Callbacks): Promise<BaseBucket> {
        nbLogger("BaseBucket.deleteBucket(), callbacks=" + callbacks);

        let req: ApiRequest;
        if (this._service.isOffline()) {
            req = new _SdeRequest(BaseBucket.getClassName(this._type), "deleteBucket");
            const body = {
                bucketName: this.getBucketName(),
                bucketMode: this.getBucketMode()
            };
            req.setData(body);
        } else {
            const path = this.getPath();
            req = new HttpRequest(this._service, path);
            req.setMethod("DELETE");
            req.setContentType("application/json");
        }

        const promise = req.execute().then(() => {
            nbLogger("BaseBucket.deleteBucket(), success");
            return this;
        }, err => {
            nbLogger(("BaseBucket.deleteBucket(), error: " + (_errorText(err))));
            err.data = this;
            return Promise.reject(err);
        });

        return _promisify(promise, callbacks);
    }

    /**
     * @description ACLの設定
     * @private
     */
    setAcl(acl: Acl) {
        if (acl != null && !(acl instanceof Acl)) {
            throw new Error("setAcl: not Acl instance!");
        }
        this._acl = acl;
    }

    /**
     * @description ACLの取得
     * @private
     */
    getAcl(): Acl {
        return this._acl;
    }

    /**
     * @description コンテンツACLの設定
     * @param {@link acl} acl 設定するACL
     * @private
     */
    setContentAcl(acl: Acl) {
        if (acl != null && !(acl instanceof Acl)) {
            throw new Error("setContentAcl: not Acl instance!");
        }
        this._contentAcl = acl;
    }

    /**
     * @description コンテンツACLの取得
     * @private
     */
    getContentAcl(): Acl {
        return this._contentAcl;
    }

    /**
     * @description バケットの説明文の設定
     * @private
     */
    setDescription(description: string) {
        this._description = description;
    }

    /**
     * @description バケットの説明文の取得
     * @private
     */
    getDescription(): string {
        return this._description;
    }

    /**
     * @description バケット名の取得
     * @private
     */
    getBucketName(): string {
        return this._name;
    }

    /**
     * @description バケット名の設定
     * @private
     */
    setBucketName(name: string) {
        this._name = name;
    }

    /**
     * @description バケットモードの取得
     * @private
     */
    getBucketMode(): number {
        return this._mode;
    }

    /**
     * @description バケットに関するREST APIのパスの取得
     * @private
     */
    getPath(option?: string): string {
        let path = "/buckets" + "/" + this._type + "/" + encodeURIComponent(this._name);

        if (option != null) {
            path = path + option;
        }

        return path;
    }

    /**
     * @description バケットに含まれるデータ(ファイルまたはオブジェクト)に関するREST APIのパスの取得
     * @private
     */
    getDataPath(option?: string): string {
        let dataType = "objects";
        if (this._type === "file") {
            dataType = "files";
        }

        let path = "/" + dataType + "/" + encodeURIComponent(this._name);
        if (option != null) {
            path = path + option;
        }

        return path;
    }

    /**
     * @description バケット種別からネイティブクラス名を取得する(オフライン限定)
     * @private
     */
    protected static getClassName(type?: string): string {
        let className = "NebulaObjectBucket";
        if (type === "file") {
            className = "NebulaFileBucket";
        }

        return className;
    }

    /**
     * @description バケット種別からネイティブクラス名を取得する(オフライン限定)
     * @private
     */
    protected getClassName(): string {
        return BaseBucket.getClassName(this._type);
    }
}