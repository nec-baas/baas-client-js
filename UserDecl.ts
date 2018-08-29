import {NebulaService} from "./NebulaService";
import {LoginInfo, User, UserJson, UserQuery} from "./User";
import {Callbacks, nbLogger} from "./Head";

import {Promise} from "es6-promise";
import {AccountLink} from "./AccountLink";

/** @private */
export const declareUser = (_service: NebulaService) => {
    _service.User = class _User extends User implements UserJson {
        constructor() {
            super(_service);
            nbLogger("User.constructor");
        }

        static login(userInfo: LoginInfo, callbacks?: Callbacks): Promise<User> {
            return super._login(_service, userInfo, callbacks);
        }

        static logout(callbacks?: Callbacks): Promise<void> {
            return super._logout(_service, callbacks);
        }

        static current(callbacks?: Callbacks): User {
            return super._current(_service, callbacks);
        }

        static saveCurrent(userInfo: UserJson): void {
            super._saveCurrent(_service, userInfo);
        }

        static queryCurrent(callbacks?: Callbacks): Promise<User> {
            return super._queryCurrent(_service, callbacks);
        }

        static query(conditions: UserQuery, callbacks?: Callbacks): Promise<User[]> {
            return super._query(_service, conditions, callbacks);
        }

        static update(user: User, callbacks?: Callbacks): Promise<User> {
            return super._update(_service, user, callbacks);
        }

        static remove(user: User, callbacks?: Callbacks): Promise<void> {
            return super._remove(_service, user, callbacks);
        }

        static delete = _User.remove;

        static resetPassword(userInfo: UserJson, callbacks?: Callbacks): Promise<void> {
            return super._resetPassword(_service, userInfo, callbacks);
        }

        static getAccountLinks(user: User, callbacks?: Callbacks): Promise<AccountLink[]> {
            return super._getAccountLinks(_service, user, callbacks);
        }

        static deleteAccountLink(user: User, linkedUserId: string, callbacks?: Callbacks): Promise<void> {
            return super._deleteAccountLink(_service, user, linkedUserId, callbacks);
        }
    };
};
