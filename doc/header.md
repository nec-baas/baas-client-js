BaaS JavaScript SDK
====================

モバイルバックエンド基盤(BaaS) JavaScript SDK のリファレンスマニュアルです。

Nebula 名前空間
---------------

すべてのクラスは、Nebula 名前空間内にあります。

Nebula 名前空間の実体は NebulaService クラスのデフォルトインスタンスです。

非同期 API について
-----------------

非同期型の API は、すべて callbacks 引数を持っています。
callbacks を省略(または undefined を指定)した場合は、Promise が返却されます。

Promise を使用する例を示します。

    var bucket = new Nebula.ObjectBucket("bucket1");
    var clause = Nebula.Clause.lessThan("score", 30);
    var query = new Nebula.ObjectQuery().setClause(clause);
    bucket.query(query)
        .then(function(objects) {
            // 成功時の処理
        })
        .catch(function(err) {
            // エラー時の処理
        });

callbacks を指定する場合は、以下のような Object で 成功時と失敗時に呼び出される
コールバックを指定します。

    {
        success: function(data) {
            // 成功時の処理
        },
        error: function(error) {
            // 失敗時の処理
        }
    }

成功時は success がコールバックされます。
success の引数に渡される値は Promise の返却値と同じです。内容は API によって異なります。

失敗時は error がコールバックされます。
error の書式は、API に指定がないかぎり以下の通りとなります。

    {
        "status"        : ステータスコード,
        "statusText"    : エラーメッセージ,
        "responseText"  : レスポンスメッセージ
    }
