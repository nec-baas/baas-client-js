import {JsonObject} from "./Head";

export interface BatchRequestEntry {
    op: string;
    _id?: string;
    etag?: string;
    data?: JsonObject;
}

export interface BatchRequestJson {
    requests: BatchRequestEntry[];
}

export interface BatchResponseJson {
    results: JsonObject[];
    failedCount: number;
}

/**
 * @class バッチリクエスト クラス
 * @name BatchRequest
 * @description
 * オブジェクトストレージに対するバッチリクエスト。
 * {@link ObjectBucket}.batch() で使用する。
 * @example
 * var batchReq = new Nebula.BatchRequest();
 * @since v4.0.0
 */
export class BatchRequest {
    requests: BatchRequestEntry[];
    json: BatchRequestJson;

    constructor() {
        this.requests = [];
        this.json = {requests: this.requests};

        // TODO: RequestToken
    }

    /**
     * @memberOf BatchRequest
     * @description INSERTリクエストを追加する
     * @param {Object} object 追加したいオブジェクト
     * @return なし
     */
    addInsertRequest(object: JsonObject) {
        if (object.etag) {
            throw new Error("ETag exists");
        }

        this.requests.push({
            op: "insert",
            data: object
        });
    }

    /**
     * @memberOf BatchRequest
     * @description UPDATEリクエストを追加する
     * @param {Object} object 更新したいオブジェクト。
     * _id プロパティは必須。
     * etag プロパティが存在する場合は楽観ロック付きで更新する。
     * @return なし
     */
    addUpdateRequest(object: JsonObject) {
        if (!object._id) {
            throw new Error("No id");
        }

        const req: BatchRequestEntry = {
            op: "update",
            _id: object._id as string,
            data: {"$full_update": object}
        };
        if (object.etag) {
            req.etag = object.etag as string;
        }

        this.requests.push(req);
    }

    /**
     * @memberOf BatchRequest
     * @description DELETEリクエストを追加する
     * @param {Object} object 削除したいオブジェクト。
     * _id プロパティのみ必須。
     * etag プロパティが存在する場合は楽観ロック付きで削除する。
     * @return なし
     */
    addDeleteRequest(object: JsonObject) {
        if (!object._id) {
            throw new Error("No id");
        }

        const req: BatchRequestEntry = {
            op: "delete",
            _id: object._id as string
        };
        if (object.etag) {
            req.etag = object.etag as string;
        }

        this.requests.push(req);
    }
}
