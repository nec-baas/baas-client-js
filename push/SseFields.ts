/** @private */
export interface SseFieldsType {
    sseEventId?: string;
    sseEventType?: string;
}

/**
 * @class SseFields
 * @memberOf PushSender
 * @description SSE用Push送信パラメータ
 * @example
 * var sse = new Nebula.PushSender.SseFields();
 * sse.eventId = "event01";
 * sse.eventType = "Information";
 * var push = new Nebula.PushSender();
 * push.sseFields = sse;
 * @since v4.0.0
 */
export class SseFields {
    _fields: SseFieldsType = {};

    constructor() {}

    /**
     * @description イベントID
     * @name PushSender.SseFields#eventId
     * @type String
     * @default null
     */
    get eventId():string {
        return this._fields.sseEventId;
    }

    set eventId(eventId:string) {
        if (typeof eventId !== "string") {
            throw new Error("SseFields.eventId, Not string: " + eventId);
        }
        this._fields.sseEventId = eventId;
    }

    /**
     * @description イベントタイプ
     * @name PushSender.SseFields#eventType
     * @type String
     * @default null
     */
    get eventType():string {
        return this._fields.sseEventType;
    }

    set eventType(eventType:string) {
        if (typeof eventType !== "string") {
            throw new Error("SseFields.eventType, Not string: " + eventType);
        }
        this._fields.sseEventType = eventType;
    }
}
