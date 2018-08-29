import {nbLogger, sde, nbError, JsonObject} from "./Head";

export interface NetworkEventListener {
    onNetworkStateChanged(isOnline: boolean): void;
}

/**
 * @class SdeNetworkEventListener
 * @private
 */
export class _SdeNetworkEventListener {
    static _callback: NetworkEventListener;

    constructor() {
    }

    static setCallback(callback: NetworkEventListener) {
        this._callback = callback;
        nbLogger("_SdeNetworkEventListener.setCallback(), callback=" + callback);

        const data: JsonObject = {};
        if (callback) {
            data.set = true;
        } else {
            data.set = false;
        }

        const sdeParams = {
            params: JSON.stringify(data),
            callback: ""
        };

        nbLogger("_SdeNetworkEventListener.setCallback(), sdeParams=" + JSON.stringify(sdeParams));

        return sde.smt.common.exIfExecute("NebulaNetworkEventManager", "setNetworkEventListener", sdeParams);
    }

    static onNetworkStateChanged(params: JsonObject) {
        try {
            nbLogger("_SdeNetworkEventListener.onNetworkStateChanged(), params=" + JSON.stringify(params));

            if (this._callback != null && this._callback.onNetworkStateChanged != null) {
                if (params.isOnline != null) {
                    this._callback.onNetworkStateChanged(params.isOnline as boolean);
                } else {
                    nbError("_SdeNetworkEventListener.onNetworkStateChanged(), invalid parameters");
                }
            } else {
                nbLogger("_SdeNetworkEventListener.onNetworkStateChanged(), no callback");
            }
        } catch (e) {
            nbError("_SdeNetworkEventListener.onNetworkStateChanged(), exception=" + e);
        }
    }
}
