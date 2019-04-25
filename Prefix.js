/*!
 * NEC Mobile Backend Platform JavaScript SDK version 7.5.1
 *
 * Copyright 2014-2018, NEC Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

var XMLHttpRequest, localStorage;

(function(root, setup) {
    var _module = {exports: {}};
    var _exports = _module.exports;

    setup.call(root, _module, _exports);

    if (typeof module !== "undefined" &&
        typeof module.exports !== "undefined" &&
        typeof process !== "undefined" &&
        typeof require !== "undefined") {
        // Node.js
        module.exports = _exports;
    } else {
        // browser
        root.Nebula = _exports.Nebula;
    }
})(this, function(module, exports) {
