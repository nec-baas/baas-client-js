import {Callbacks, nbLogger} from "./Head";
import {NebulaService} from "./NebulaService";
import {Group} from "./Group";
import {GroupQuery} from "./Group";
import {Promise} from "es6-promise";

/** @private */
export const declareGroup = (_service: NebulaService) => {

    /** @private */
    _service.Group = class _Group extends Group {

        constructor(groupname: string) {
            super(groupname, _service);
            nbLogger("Group.constructor");
        }

        static remove(group: Group, callbacks?: Callbacks): Promise<void> {
            return super._remove(_service, group, callbacks);
        }

        static delete = _Group.remove;

        static query(conditions: GroupQuery, callbacks?: Callbacks): Promise<Group[]> {
            return super._query(_service, conditions, callbacks);
        }
    };
};
