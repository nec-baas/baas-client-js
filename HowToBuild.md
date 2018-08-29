TypeScript のトランスパイル・連結・minify
========================================

タスクランナーの gulp を用いて TypeScript のトランスパイル・
連結(Polyfillライブラリを含む)・minify を行う。

ツール類のインストール
----------------------

予め Node.js 4.0 以上をインストールしておくこと。(nvm の利用を推奨)

gulp が必要なので、以下の手順でインストール。

    $ npm install -g gulp

ついで、npm を使用して関連するパッケージ一式を
インストールする。なお、インストールされるパッケ
ージの定義は package.json に記載されている。

    $ npm install

トランスパイル
--------------

コマンドラインから 'gulp' を実行すると、TypeScript
のトランスパイル、連結、minify がすべて自動的に実行される。

連結する CoffeeScript ファイルや Polyfill ライブラリの定義は、
gulpfile.js 内に記述してある (sources, headers)


インストール
------------

'gulp install' を実行すると、コンパイル後に以下ディレクトリ
にも *.js ファイルをコピーする。

- src/dist/
- test/ft/nodejs-test/installed/

ドキュメント生成(JsDoc3)
-----------------------

### gulp からの実行

'gulp jsdoc3' でドキュメント生成される。
出力ディレクトリは 'JsDoc' となる。

Watch
-----

'gulp watch' とすると、ソースファイルの変更を検出
して自動的にコンパイルを実行することができる。

Pack
----

Node.js 向けに npm インストール可能なパッケージを生成するには
gulp 実行後に 'npm pack' を実行する。

パッケージに格納されるファイルは、packages.json の files に
記述すること。



