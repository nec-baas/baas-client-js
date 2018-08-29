/** @private */
export interface GcmFieldsType {
    title?: string;
    uri?: string;
}

/**
 * @class GcmFields
 * @memberOf PushSender
 * @description FCM(旧GCM)用Push送信パラメータ
 * @example
 *      var gcm = new Nebula.PushSender.GcmFields();
 *      gcm.title = "title";
 *      gcm.uri = "http://www.nebula.test.com";
 *      var push = new Nebula.PushSender();
 *      push.gcmFields = gcm;
 * @since v4.0.0
 */
export class GcmFields {
    _fields: GcmFieldsType = {};

    constructor() {}

    /**
     * @description システムバーに表示するタイトル
     * @name PushSender.GcmFields#title
     * @type String
     * @default undefined
     */
    get title():string {
        return this._fields.title;
    }

    set title(title:string) {
        if (typeof title === "string") {
            this._fields.title = title;
        } else {
            throw new Error("GcmFields.title, Invalid value: " + title);
        }
    }

    /**
     * @description 通知を開いたときに起動するURI
     * @name PushSender.GcmFields#uri
     * @type String
     * @default undefined
     */
    get uri():string {
        return this._fields.uri;
    }

    set uri(uri:string) {
        if (typeof uri === "string") {
            this._fields.uri = uri;
        } else {
            throw new Error("GcmFields.uri, Invalid value: " + uri);
        }
    }
}
