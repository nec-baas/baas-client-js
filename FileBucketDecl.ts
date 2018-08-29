import {NebulaService} from "./NebulaService";
import {FileBucket, FileInfo} from "./FileBucket";
import {Callbacks} from "./Head";
import {Promise} from "es6-promise";

/** @private */
export const declareFileBucket = (_service: NebulaService) => {

    /** @private */
    _service.FileBucket = class _FileBucket extends FileBucket {
        constructor(name: string) {
            super(name, _service);
        }

        static loadBucket(name:string , callbacks?: Callbacks): Promise<FileBucket> {
            return super._loadBucket(_service, name, callbacks);
        }

        static getBucketList(callbacks?: Callbacks): Promise<string[]> {
            return super._getBucketList(_service, callbacks);
        }

        static selectUploadFile(callbacks?: Callbacks): Promise<FileInfo> {
            return super._selectUploadFile(_service, callbacks);
        }

        static selectDirectory(callbacks?: Callbacks): Promise<string> {
            return super._selectDirectory(_service, callbacks);
        }
    };
};

