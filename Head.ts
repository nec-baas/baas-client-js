import {Nebula} from "./Nebula";
import {Promise} from "es6-promise";

interface Window { XMLHttpRequest: XMLHttpRequest; }

export const root = this;

// Json Types
export type AnyJson = boolean|number|string|null|JsonObject|JsonArray;
export interface JsonObject {[key:string]: AnyJson;}
export interface JsonArray extends Array<AnyJson> {}

// common internal functions

// 以下ドキュメントは Jsdoc生成時には使われない。
// Jsdoc生成時は doc/global.js のほうが使われるので注意。
/**
 * @typedef {Object} Callbacks
 * @description コールバック。非同期 API 呼び出し時に使用する。
 * コールバックを省略(=undefined)した場合は、非同期 API は Promise を返却する。
 * Promise 完了時の引数は success コールバックの引数と同じ。
 * @property {function} success 成功時に呼び出されるコールバック。<br>
 * success コールバックの引数は1個。引数の内容は、各非同期 API により異なる。
 * @property {function} error エラー発生時に呼び出されるコールバック。<br>
 * error コールバックには Object が渡される。各 API に指定がない限り、以下の形式となる。
 * <pre>
 * {
 *    "status"        : ステータスコード,
 *    "statusText"    : エラーメッセージ,
 *    "responseText"  : レスポンスメッセージ
 * }
 * </pre>
 */
export interface Callbacks {
    success?(data: any): void;
    error?(error: Error): void;
}

/**
 * @description エラーログを出力する
 * @private
 */
export const nbError = (message: string) => {
    if (typeof console !== "undefined") {
        console.log("[BAAS ERROR] : " + message);
    }
};

/**
 * @description ログを出力する
 * @private
 */
export const nbLogger = (message: string) => {
    if (Nebula.getDebugMode() === "debug" && typeof console !== "undefined") {
        console.log("[BAAS] : " + message);
    }
};

/**
 * @description 引数エラー処理。
 *   callback があれば callback.error を呼び、なければ reject された Promise を返す。
 * @param {Callbacks} callbacks コールバック
 * @param {String} name API名
 * @private
 */
export const _doBadRequestCallback = (callbacks: Callbacks, name: string): Promise<any> => {
    nbLogger(`${name}#invalid parameter.`);
    const error = _createError(400, "Invalid Arguments", "Invalid Arguments");

    if (callbacks && callbacks.error) {
        callbacks.error(error);
        return;
    } else {
        return Promise.reject(error);
    }
};

/**
 * @description callbacks を promise にバインドする
 * @private
 */
export const _promisify = (promise: Promise<any>, callbacks?: Callbacks): Promise<any> => {
    if (callbacks) {
        promise.then((arg) => {
            if (callbacks.success) {
                callbacks.success(arg);
            }
        }).catch((err) => {
            if (callbacks.error) {
                callbacks.error(err);
            }
        });
        return undefined;
    } else {
        return promise;
    }
};

/**
 * エラーオブジェクト
 */
export interface NbError extends Error {
    /**
     * ステータスコード
     */
    status: number;
    /**
     * ステータステキスト
     */
    statusText: string;
    /**
     * レスポンステキスト
     */
    responseText: string;
    /**
     * データ(あれば)
     */
    data?: any;
}

/**
 * @description エラーオブジェクトを返す
 * @param status ステータスコード
 * @param statusText ステータステキスト
 * @param responseText レスポンステキスト
 * @param data データ(あれば)
 * @returns {any} エラーオブジェクト
 * @private
 */
export const _createError = (status: number, statusText: string, responseText: string, data?: any): NbError => {
    const error: NbError = new Error(`${statusText}(${status})`) as NbError;
    error.status = status;
    error.statusText = statusText;
    error.responseText = responseText;
    if (data) {
        error.data = data;
    }
    return error;
};

/**
 * @private
 */
export const _errorText = (error: any): string => {
    if (error && error.message) {
        return error.message;
    }
    return error;
};

/**
 * @description オブジェクトか判定する
 * @private
 */
export const _isObject = (value: any): boolean => {
    const type = typeof value;
    return value && type === 'object' || type === 'function';
};

/**
 * @description オブジェクトを比較する
 * @private
 */
export const _compareObject = (src: any, target: any): boolean => {
    const srcKeys = Object.keys(src);
    const targetKeys = Object.keys(target);

    if (srcKeys.length !== targetKeys.length) {
        return false;
    }

    for (const key of srcKeys) {
        if (_isObject(src[key]) && _isObject(target[key])) {
            if (!_compareObject(src[key], target[key])) {
                return false;
            }
        } else {
            if (src[key] !== target[key]) {
                return false;
            }
        }
    }

    return true;
};

/**
 * アサーション
 * @param assert
 * @param message
 * @private
 */
export const nbAssert = (assert: boolean, message?: string) => {
    if (!assert) {
        if (Nebula.getDebugMode() === "debug") {
            throw new Error("Assertion failed. " + message);
        } else {
            nbError("Assertion failed. " + message);
        }
    }
};

