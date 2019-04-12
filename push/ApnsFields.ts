/** @private ApnsFieldsType */
export interface ApnsFieldsType {
    badge?: number;
    sound?: string;
    "content-available"?: number;
    category?: string;
}

/**
 * @class ApnsFields
 * @memberOf PushSender
 * @description APNs用Push送信パラメータ
 * @example
 * var apns = new Nebula.PushSender.ApnsFields();
 * apns.badge = 5;
 * apns.sound = "sound1.aiff";
 * apns.contentAvailable = 1;
 * apns.category = "Information";
 * var push = new Nebula.PushSender();
 * push.apnsFields = apns;
 * @since v4.0.0
 */
export class ApnsFields {
    _fields: ApnsFieldsType = {};

    constructor() {}

    /**
     * バッジカウント
     * @name PushSender.ApnsFields#badge
     * @type number
     * @default undefined
     */
    get badge(): number {
        return this._fields.badge;
    }

    set badge(badge: number) {
        if (!this._isInteger(badge)) {
            throw new Error("ApnsFields.badge, Not integer: " + badge);
        }
        this._fields.badge = badge;
    }

    /**
     * @description Application Bundle 内のサウンドファイル名
     * @name PushSender.ApnsFields#sound
     * @type String
     * @default undefined
     */
    get sound(): string {
        return this._fields.sound;
    }

    set sound(sound: string) {
        if (typeof sound !== "string") {
            throw new Error("ApnsFields.sound, Not string: " + sound);
        }
        this._fields.sound = sound;
    }

    /**
     * @description 1 にセットすると、バックグランドPushを有効にする
     * @name PushSender.ApnsFields#contentAvailable
     * @type number
     * @default undefined
     */
    get contentAvailable() {
        return this._fields["content-available"];
    }

    set contentAvailable(contentAvailable: number) {
        if (!this._isInteger(contentAvailable)) {
            throw new Error("ApnsFields.contentAvailable, Not integer: " + contentAvailable);
        }
        this._fields["content-available"] = contentAvailable;
    }

    /**
     * @description Notificationカテゴリ
     * @name PushSender.ApnsFields#category
     * @type String
     * @default null
     */
    get category(): string {
        return this._fields.category;
    }

    set category(category: string) {
        if (typeof category !== "string") {
            throw new Error("ApnsFields.category, Not string: " + category);
        }
        this._fields.category = category;
    }

    private _isInteger(value: any): boolean {
        // Number.isInteger polyfill.
        // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
        return typeof value === 'number' &&
            isFinite(value) &&
            Math.floor(value) === value;
    }
}
