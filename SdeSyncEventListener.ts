import {nbLogger, nbError, sde} from "./Head";
import {Nebula} from "./Nebula";

/**
 * 同期イベントリスナ
 * @private
 */
export interface SyncEventListener {
    onSyncStart(targetBucket: string): void;
    onSyncCompleted(targetBucket: string, objectIds: string): void;
    onSyncConflicted(bucket: any, client: any, server: any): void;
    onResolveConflict(resolveObject: any, resolve: any): void;
    onSyncError(errorCode: number, errorObject: any): void;
}

export interface ResolveConflictParams {
    bucketName: string;
    bucketMode: number;
    objectId: string;
    resolveId: string;
    resolve: number;
}

/**
 * @class SdeSyncEventListener
 * @private
 */
export class _SdeSyncEventListener {
    static _listeners: {[index:string]: SyncEventListener} = {};
    static _bucketMode: {[index:string]: number} = {};

    constructor() {
    }

    static setListener(bucket: any, listener: SyncEventListener) {
        if (bucket == null) {
            nbError("_SdeSyncEventListener.setCallback(), no bucket");
            return;
        }

        nbLogger("_SdeSyncEventListener.setCallback(), before : _listeners=" + JSON.stringify(this._listeners));

        const bucketName = bucket.getBucketName();
        const bucketMode = bucket.getBucketMode();

        if (listener == null) {
            this._listeners[bucketName] = listener;
            this._bucketMode[bucketName] = bucketMode;
        } else {
            if (this._listeners[bucketName] != null) {
                delete this._listeners[bucketName];
            }

            if (this._bucketMode[bucketName] != null) {
                delete this._bucketMode[bucketName];
            }
        }

        nbLogger("_SdeSyncEventListener.setCallback(), after  : _listeners=" + JSON.stringify(this._listeners));

        const data: any = {};
        data.bucketName = bucketName;
        data.bucketMode = bucketMode;

        if (listener) {
            data.set = true;
        } else {
            data.set = false;
        }

        const sdeParams = {
            params: JSON.stringify(data),
            callback: ""
        };

        nbLogger("_SyncEventListener.setCallback(), sdeParams=" + JSON.stringify(sdeParams));
        return sde.smt.common.exIfExecute("NebulaSyncEventManager", "setSyncEventListener", sdeParams);
    }

    static resolveConflict(data: ResolveConflictParams) {
        nbLogger("_SyncEventListener.resolveConflict(), data=" + data);

        const sdeParams = {
            params: JSON.stringify(data),
            callback: ""
        };

        nbLogger("_SyncEventListener.resolveConflict(), sdeParams=" + JSON.stringify(sdeParams));

        return sde.smt.common.exIfExecute("NebulaSyncEventManager", "resolveConflict", sdeParams);
    }

    static onSyncStart(params: any) {
        try {
            nbLogger("_SdeSyncEventListener.onSyncStart(), params=" + JSON.stringify(params));

            if (params.bucketName != null) {
                const bucketName = params.bucketName;
                const listener: SyncEventListener = _SdeSyncEventListener._listeners[bucketName];

                if (listener && listener.onSyncStart) {
                    listener.onSyncStart(bucketName);
                } else {
                    nbLogger("_SdeSyncEventListener.onSyncStart(), no callback or onSyncStart");
                }
            } else {
                nbLogger("_SdeSyncEventListener.onSyncStart(), no bucketName");
            }
        } catch (e) {
            nbLogger("_SdeSyncEventListener.onSyncStart(), exception=" + e);
        }
    }

    static onSyncCompleted(params: any) {
        try {
            nbLogger("_SdeSyncEventListener.onSyncCompleted(), params=" + JSON.stringify(params));
            nbLogger("_SdeSyncEventListener.onSyncCompleted(), bucketName=" + params.bucketName);
            nbLogger("_SdeSyncEventListener.onSyncCompleted(), objectIds=" + params.objectIds);

            if (params.bucketName != null && params.objectIds != null) {
                const bucketName = params.bucketName;
                const listener: SyncEventListener = _SdeSyncEventListener._listeners[bucketName];

                if (listener && listener.onSyncCompleted) {
                    listener.onSyncCompleted(bucketName, params.objectIds);
                } else {
                    nbLogger("_SdeSyncEventListener.onSyncCompleted(), no callback or onSyncCompleted");
                }
            } else {
                nbLogger("_SdeSyncEventListener.onSyncCompleted(), no bucketName or objectIds");
            }
        } catch (e) {
            nbLogger("_SdeSyncEventListener.onSyncCompleted(), exception=" + e);
        }
    }

    static onSyncConflicted(params: any) {
        try {
            nbLogger("_SdeSyncEventListener.onSyncConflicted(), params=" + JSON.stringify(params));
            nbLogger("_SdeSyncEventListener.onSyncConflicted(), bucketName=" + params.bucketName);
            nbLogger("_SdeSyncEventListener.onSyncConflicted(), resolveId=" + params.resolveId);
            nbLogger("_SdeSyncEventListener.onSyncConflicted(), client=" + params.client);
            nbLogger("_SdeSyncEventListener.onSyncConflicted(), server=" + params.server);

            if (params.bucketName != null && params.resolveId != null && params.client != null && params.server != null) {
                const bucketName = params.bucketName;
                let bucketMode = this._bucketMode[bucketName];

                if (!(bucketMode != null)) {
                    bucketMode = Nebula.BUCKET_MODE_REPLICA;
                }

                const listener: SyncEventListener = this._listeners[bucketName];

                if (listener && listener.onSyncConflicted) {
                    const bucket = new Nebula.ObjectBucket(bucketName, bucketMode);
                    bucket._setResolveId(params.resolveId);
                    listener.onSyncConflicted(bucket, params.client, params.server);
                } else {
                    nbLogger("_SdeSyncEventListener.onSyncConflicted(), no callback or onSyncCompleted");
                }
            } else {
                nbLogger("_SdeSyncEventListener.onSyncConflicted(), invalid parameters");
            }
        } catch (e) {
            nbLogger("_SdeSyncEventListener.onSyncConflicted(), exception=" + e);
        }
    }

    static onResolveConflict(params: any) {
        try {
            nbLogger("_SdeSyncEventListener.onResolveConflict(), params=" + JSON.stringify(params));
            nbLogger("_SdeSyncEventListener.onResolveConflict(), resolve=" + params.resolve);
            nbLogger("_SdeSyncEventListener.onResolveConflict(), object=" + params.object);

            if (params.bucketName != null && params.resolve != null && params.object != null) {
                const bucketName = params.bucketName;
                const listener: SyncEventListener = _SdeSyncEventListener._listeners[bucketName];

                if (listener && listener["onResolveConflict"]) {
                    listener.onResolveConflict(params.object, params.resolve);
                } else {
                    nbLogger(
                        "Nebula._SdeSyncEventListener.onResolveConflict(), no callback or onResolveConflict"
                    );
                }
            } else {
                nbLogger("_SdeSyncEventListener.onSyncConflicted(), invalid parameters");
            }
        } catch (e) {
            nbLogger("_SdeSyncEventListener.onResolveConflict(), exception=" + e);
        }
    }

    static onSyncError(params: any) {
        try {
            nbLogger("_SdeSyncEventListener.onSyncError(), params=" + JSON.stringify(params));
            nbLogger("_SdeSyncEventListener.onSyncError(), errorCode=" + params.errorCode);
            nbLogger("_SdeSyncEventListener.onSyncError(), object=" + params.object);

            if (params.bucketName != null && params.errorCode != null && params.object != null) {
                const bucketName = params.bucketName;
                const listener: SyncEventListener = _SdeSyncEventListener._listeners[bucketName];

                if (listener != null && listener.onSyncError != null) {
                    listener.onSyncError(params.errorCode, params.object);
                } else {
                    nbLogger("_SdeSyncEventListener.onSyncError(), no callback or onSyncError");
                }
            } else {
                nbLogger("_SdeSyncEventListener.onSyncError(), invalid parameters");
            }
        } catch (e) {
            nbLogger("_SdeSyncEventListener.onSyncError(), exception=" + e);
        }
    }
}
