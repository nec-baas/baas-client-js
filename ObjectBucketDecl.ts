import {Callbacks} from "./Head";
import {NebulaService} from "./NebulaService";
import {ObjectBucket} from "./ObjectBucket";
import {Nebula} from "./Nebula";

import {Promise} from "es6-promise";

/** @private */
export const declareObjectBucket = (_service: NebulaService) => {

    /** @private */
    _service.ObjectBucket = class _ObjectBucket extends ObjectBucket {
        // 実際に使われる値は基底クラスではなくこちら
        static useLongQuery = false;

        constructor(name: string, mode: number = Nebula.BUCKET_MODE_ONLINE) {
            super(name, mode, _service);
        }

        static loadBucket(name: string, callbacks?: Callbacks, mode?: number): Promise<ObjectBucket> {
            return super._loadBucket(_service, name, callbacks, mode);
        }

        static getBucketList(callbacks?: Callbacks): Promise<string[]> {
            return super._getBucketList(_service, callbacks);
        }

        static getLocalBucketList(callbacks?: Callbacks): Promise<string[]> {
            return super._getLocalBucketList(_service, callbacks);
        }

        static sync(callbacks?: Callbacks): Promise<void> {
            return super._sync(_service, callbacks);
        }
    };
};
