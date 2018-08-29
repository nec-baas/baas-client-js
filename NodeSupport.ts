import * as _url from "url"; // KEEP
import * as _http from "http"; // KEEP
import * as _https from "https"; // KEEP
import * as _tls from "tls"; // KEEP

declare var require: any;
declare var process: any;

/**
 * Node.js 環境かどうか調べる
 * @returns {boolean} Node.js 環境なら true
 * @private
 */
export const isNodeJs = (): boolean => {
    return typeof require !== "undefined" && typeof process !== "undefined";
};

/**
 * Node.js の require。
 * Node.js でのみ動作する。ブラウザ環境では何もしない。
 * browserify/webpack などの展開対象外。
 * @param {string} module
 * @return {any}
 * @private
 */
export const _node_require = (module: string): any => {
    try {
        if (isNodeJs()) {
            // node.js
            return eval('require')(module);
        } else {
            // browser
            return null;
        }
    } catch (e) {
        // maybe browser
        return null;
    }
};

// Node.js: モジュールロード
export const URL = _node_require('url');
export const https = _node_require('https');
export const http = _node_require('http');
export const tls = _node_require('tls');

let _http2 = null;
try {
    _http2 = _node_require('http2'); // Node.js v8.x 以上が必要、experimental
} catch (e) {
    // no http2 module
}
export const http2 = _http2;
