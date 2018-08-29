import {ApiRequest} from "./HttpRequest";
import {_createError, Callbacks, nbError, nbLogger, sde} from "./Head";

import {Promise} from "es6-promise";

/**
 * @class SDEブリッジリクエストクラス
 * @private
 */
export class _SdeRequest implements ApiRequest {
    // コールバック格納ハッシュ。キーはリクエストID。
    static _callbacks: {[index:string]: Callbacks} = {};
    // リクエストIDカウンタ
    static _requestId = 0;

    _className: string;
    _methodName: string;
    _data: any;

    constructor(className: string, methodName: string) {
        nbLogger("_SdeRequest(), className=" + (className) + ", methodName=" + (methodName));

        this._className = className;
        this._methodName = methodName;
        this._data = null;
    }

    setData(data: any) {
        return this._data = data;
    }

    execute() : Promise<any> {
        const callbacks: Callbacks = {};

        const promise = new Promise((resolve, reject) => {
            callbacks.success = resolve;
            return callbacks.error = reject;
        });

        const reqId = _SdeRequest._createRequestId();
        _SdeRequest._callbacks[reqId] = callbacks;
        nbLogger("_SdeRequest.execute(), reqId=" + reqId);

        if (!(this._data != null)) {
            this._data = {};
        }

        const data = {
            data: this._data // #3568 データは二重 stringify しない
        };

        const sdeParams = {
            action: ((this._className) + "." + (this._methodName)),
            request_id: reqId,
            params: JSON.stringify(data),
            callback: "Nebula._SdeRequest.sdeCallback"
        };

        nbLogger("_SdeRequest.execute(), sdeParams=" + JSON.stringify(sdeParams));
        sde.smt.common.exIfExecute("NebulaSdePlugin", "execute", sdeParams);
        return promise;
    }

    static _createRequestId(): string {
        for (let i = 0; i < 1000; i++) {
            const requestId = "id_" + this._requestId;
            this._requestId++;

            if (this._requestId >= 1000) {
                this._requestId = 0;
            }

            if (! this._callbacks[requestId]) {
                nbLogger("_SdeRequest._createRequestId(), requestId=" + requestId);
                return requestId;
            }
        }

        nbLogger("FATAL Error: Nebula._SdeRequest._createRequestId(), callback slot full!");
        throw new Error("Could not create request ID, callback slot full!");
    }

    // ブリッジ側からのコールバックエントリ
    // このエントリは "Nebula.sdeCallback" という名前で存在しなければならない
    static sdeCallback(params: any) {
        try {
            nbLogger("_SdeRequest.sdeCallback()");
            nbLogger("  params=" + JSON.stringify(params));
            nbLogger("  requestId=" + params.requestId);
            nbLogger("  status=" + params.status);
            nbLogger("  statusText=" + params.statusText);
            nbLogger("  responseText=" + params.responseText);
            nbLogger("  response=" + params.response);
            const requestId = params.requestId;

            if (requestId != null && _SdeRequest._callbacks[requestId] != null) {
                const callbacks: Callbacks = _SdeRequest._callbacks[requestId];

                nbLogger("  requestId=" + requestId);
                nbLogger("  _callbacks[requestId]=" + callbacks);

                let status = params.status;

                if (!status) {
                    nbLogger("_SdeRequest.sdeCallback(), warning:: not found status property");
                    status = 0;
                }

                if (status >= 200 && status < 300) {
                    nbLogger("_SdeRequest.sdeCallback(), call success callback");
                    callbacks.success(JSON.stringify(params.response));
                } else {
                    const errorResult = _createError(params.status, params.statusText, params.responseText);

                    nbLogger("Nebula._SdeRequest.sdeCallback(), call error callback: " + errorResult.message
                        + " " + errorResult.responseText);

                    callbacks.error(errorResult);
                }

                delete _SdeRequest._callbacks[requestId];

                nbLogger("_SdeRequest.sdeCallback(), _callbacks : " + JSON.stringify(_SdeRequest._callbacks));
            } else {
                nbError("_SdeRequest.sdeCallback(), not found requestId=" + requestId);
            }
        } catch (e) {
            nbError("_SdeRequest.sdeCallback(), e=" + e);
        }
    }
}


