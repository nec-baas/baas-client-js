import {Clause} from "../Clause";
import {NebulaService} from "../NebulaService";
import {ApnsFields} from "./ApnsFields";
import {GcmFields} from "./GcmFields";
import {SseFields} from "./SseFields";
import {Nebula} from "../Nebula";
import {_createError, _errorText, _promisify, Callbacks, nbLogger} from "../Head";
import {HttpRequest} from "../HttpRequest";

import {Promise} from "es6-promise";

export class PushSender {
    _service: NebulaService;

    _clause: Clause;
    _message: string;
    _allowedReceivers: string[];
    _apnsFields: ApnsFields;
    _gcmFields: GcmFields;
    _sseFields: SseFields;

    static ApnsFields = ApnsFields;
    static GcmFields = GcmFields;
    static SseFields = SseFields;

    /**
     * @class PushSender
     * @description Push送信クラス
     * @example
     *      var push = new Nebula.PushSender();
     * @since v4.0.0
     */
    constructor(service: NebulaService = Nebula) {
        this._service = service;
    }

    /**
     * @method
     * @name PushSender#send
     * @description Push送信する。
     * @param {Callbacks} callbacks 応答コールバック
     * <pre>
     * ・callbacks は、成功時と失敗時の応答コールバックを指定する。
     *     {
     *         success : function(result) {
     *             // 成功時の処理
     *         },
     *         error : function(error) {
     *             // 失敗時の処理
     *         }
     *     }
     * ・処理が成功した場合、success の呼び出しにて通知する。
     *     success の書式は以下の通りとする。
     *         success(result)
     *             result : Pushリクエストの結果が JSON 形式で返る
     *               {
     *                   "result": "ok",
     *                   "installations": 条件に合致したインスタレーションの数
     *               }
     * ・処理が失敗した場合は、error の呼び出しにて通知する。
     *     error の書式は以下の通りとする。
     *         error(error)
     *             error : エラー要因がJSON 形式で返る。
     *              {
     *                  "status"        : ステータスコード,
     *                  "statusText"    : エラーメッセージ,
     *                  "responseText"  : レスポンスメッセージ
     *              }
     * </pre>
     * @return {Promise} callbacksを指定しなかった場合、Promiseオブジェクトを返す。callback指定時は返り値なし(undefined)。
     */
    send(callbacks?: Callbacks): Promise<any> {
        nbLogger("PushSender.send()");
        const path = "/push/notifications";
        const request = new HttpRequest(this._service, path);
        request.setMethod("POST");
        request.setContentType("application/json");
        request.setData(this._toJson());

        const promise = request.execute().then(response => {
            nbLogger("PushSender.send#success : response = " + response);

            try {
                return JSON.parse(response);
            } catch (e) {
                nbLogger("PushSender.send#error : exception=" + e);
                const errorResult = _createError(0, "Invalid response from server", e);
                return Promise.reject(errorResult);
            }
        }, error => {
            nbLogger(("PushSender.send#error = " + (_errorText(error))));
            return Promise.reject(error);
        });

        return _promisify(promise, callbacks);
    }

    private _toJson() {
        const json: any = {};

        if (this._clause != null) {
            json.query = this._clause.json();
        }

        if (this._message != null) {
            json.message = this._message;
        }

        if (this._allowedReceivers != null) {
            json.allowedReceivers = this._allowedReceivers;
        }

        if (this._apnsFields != null) {
            this._copyKeys(this._apnsFields._fields, json);
        }

        if (this._gcmFields != null) {
            this._copyKeys(this._gcmFields._fields, json);
        }

        if (this._sseFields != null) {
            this._copyKeys(this._sseFields._fields, json);
        }

        return json;
    }

    private _copyKeys(from: any, to: any) {
        for (const key of Object.keys(from)) {
            to[key] = from[key];
        }
    }

    /**
     * @description 送信先条件
     * @name PushSender#clause
     * @type Clause
     * @default null
     */
    get clause(): Clause {
        return this._clause;
    }

    set clause(clause: Clause) {
        if (!(clause instanceof Clause)) {
            throw new Error("PushSender.clause, Invalid type");
        }
        this._clause = clause;
    }

    /**
     * @description 送信メッセージ
     * @name PushSender#message
     * @type String
     * @default null
     */
    get message(): string {
        return this._message;
    }

    set message(message: string) {
        if (typeof message !== "string") {
            throw new Error("PushSender.message, Not string: " + message);
        }
        this._message = message;
        nbLogger("push.message = " + this._message);
    }

    /**
     * @description 受信可能なユーザ・グループの一覧
     * @name PushSender#allowedReceivers
     * @type Array
     * @default null
     */
    get allowedReceivers(): string[] {
        return this._allowedReceivers;
    }

    set allowedReceivers(receivers: string[]) {
        if (!Array.isArray(receivers)) {
            throw new Error("PushSender.allowedReceivers, Not Array");
        }
        this._allowedReceivers = receivers;
    }

    /**
     * @description APNs 固有パラメータ
     * @name PushSender#apnsFields
     * @type PushSender.ApnsFields
     * @default null
     */
    get apnsFields(): ApnsFields {
        return this._apnsFields;
    }

    set apnsFields(fields: ApnsFields) {
        if (!(fields instanceof ApnsFields)) {
            throw new Error("PushSender.apnsFields, Invalid instance type");
        }
        this._apnsFields = fields;
    }

    /**
     * @description GCM 固有パラメータ
     * @name PushSender#gcmFields
     * @type PushSender.GcmFields
     * @default null
     */
    get gcmFields(): GcmFields {
        return this._gcmFields;
    }

    set gcmFields(fields: GcmFields) {
        if (!(fields instanceof GcmFields)) {
            throw new Error("PushSender.gcmFields, Invalid instance type");
        }
        this._gcmFields = fields;
    }

    /**
     * @description SSE 固有パラメータ
     * @name PushSender#sseFields
     * @type PushSender.SseFields
     * @default null
     */
    get sseFields(): SseFields {
        return this._sseFields;
    }

    set sseFields(fields: SseFields) {
        if (!(fields instanceof SseFields)) {
            throw new Error("PushSender.sseFields, Invalid instance type");
        }
        this._sseFields = fields;
    }
}

/** @private */
export const declarePushSender = (_service: NebulaService) => {
    _service.PushSender = class _PushSender extends PushSender {
        constructor() {
            super(_service);
        }
    };
};