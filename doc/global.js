// .ts ファイルに含まれない Jsdoc 文書はここに入れる

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
