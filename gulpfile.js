'use strict';

const gulp = require('gulp');
const typescript = require('gulp-typescript');
const concat = require('gulp-concat');
const replace = require('gulp-replace');
//const insert = require('gulp-insert');
const addsrc = require('gulp-add-src');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
//const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
//const shell = require('gulp-shell');
const del = require('del');
const merge = require('merge2');
const strip = require('gulp-strip-comments');
const jsdoc3 = require('gulp-jsdoc3');
const mocha = require('gulp-mocha');
const tslint = require('gulp-tslint');

// baas.js の先頭に連結するファイル
const headers = [
    'Prefix.js'
    //'node_modules/es6-promise/dist/es6-promise.auto.js'
];

// baas.js の末尾に連結するファイル
const trailers = [
    'Trailer.js'
];

const tsSources = [
    'Head.ts',
    'NodeSupport.ts',
    'HttpRequest.ts',
    'HttpXhr.ts',
    'HttpNode.ts',
    'SdeRequest.ts',
    'SdeNetworkEventListener.ts',
    'SdeSyncEventListener.ts',
    'AccountLink.ts',
    'Acl.ts',
    'Clause.ts',
    'ObjectQuery.ts',
    'User.ts',
    'UserDecl.ts',
    'Group.ts',
    'GroupDecl.ts',
    'FileMetadata.ts',
    'BaseBucket.ts',
    'ObjectBucket.ts',
    'ObjectBucketDecl.ts',
    'FileBucket.ts',
    'FileBucketDecl.ts',
    'CustomApi.ts',
    'push/ApnsFields.ts',
    'push/GcmFields.ts',
    'push/SseFields.ts',
    'push/PushSender.ts',
    'BatchRequest.ts',
    'NebulaService.ts',
    'Nebula.ts'
];

const targets = [
    //'baas.ts',
    'baas.full.js',
    'baas.js',
    'baas.min.js',
    'baas.min.js.map',
    'baas.d.ts'
];

const dist_targets = [];
for (let i in targets) {
    dist_targets.push('dist/' + targets[i]);
}

// nycでカバレッジ取得のため、"nodejs-test" 以下に配置する必要がある模様
const installDirs = ['test/ft/nodejs-test/installed'];


/**
 * TypeScript ソースのマージ。
 * 不要な import 文も同時に削除する。
 */
gulp.task('concat', () => {
    return gulp.src(tsSources)
        .pipe(replace(/(import .* from .*)/g, (str) => { // remove import
            if (!str.match(/KEEP/)) { // コメントに KEEP が入っているものは除去しない
                str = "";
            }
            return str;
        }))
        .pipe(concat('baas.ts'))
        .pipe(gulp.dest('./build'));
});

/**
 * TypeScript のトランスパイル
 */
gulp.task('ts', ['concat'], () => {
    const tsProject = typescript.createProject("tsconfig.json");
    return tsProject.src()
        .pipe(tsProject())
        .pipe(gulp.dest('./'));
});

/**
 * copy
 */
gulp.task('copy', ['ts'], () => {
    return gulp.src(['build/baas.d.ts', 'node_modules/es6-promise/dist/es6-promise.auto.*js'])
        .pipe(gulp.dest('./dist'));
});

/**
 * ヘッダ/トレイラを連結して baas.full.js 生成
 */
gulp.task('js-full', ['copy'], () => {
    return gulp.src(['build/baas.js'])
        //.pipe(insert.wrap('\n(function(){ // begin immediate\n', '\n}).call(this); // end immediate\n'))
        .pipe(addsrc.prepend(headers))
        .pipe(addsrc.append(trailers))
        .pipe(concat('baas.full.js'))
        .pipe(gulp.dest('./dist'));
});

/**
 * baas.js 生成(strip)
 */
gulp.task('js', ['js-full'], () => {
    return gulp.src(['dist/baas.full.js'])
        .pipe(strip({safe: true}))
        .pipe(rename('baas.js'))
        .pipe(gulp.dest('./dist'));
});

/**
 * build(minify)
 */
gulp.task('build', ['js'], () => {
    return gulp.src('dist/baas.js')
        .pipe(sourcemaps.init({loadMaps: false}))
        .pipe(uglify({output: {comments: /^|@license|/i}}))
        .on('error', (e) => console.log(e))
        .pipe(rename({extname: '.min.js'}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist'));
});

/**
 * test
 */
gulp.task('test', ['ts'], () => {
    return gulp.src('ut/*.js')
        .pipe(mocha())
        .on('error', (err) => console.log(err));
});

/**
 * lint
 */
gulp.task('tslint', () => {
    gulp.src(['*.ts', 'push/*.ts', 'ut/*.ts'])
        .pipe(tslint({configuration: './tslint.json'}))
        .pipe(tslint.report());
});

/**
 * clean
 */
gulp.task('clean', () => {
    del(targets);
    del('ut/*.js')
    del('ut/*.d.ts')
    del('build');
    del('dist');
});

/**
 * インストール
 */
gulp.task('install', ['build'], () => {
    installDirs.forEach(function (dir) {
        gulp.src(dist_targets).pipe(gulp.dest('../' + dir));
    });
});

/**
 * アンインストール
 */
gulp.task('uninstall', () => {
    const paths = [];
    installDirs.forEach((dir) => {
        targets.forEach((file) => {
            const path = '../' + dir + '/' + file;
            paths.push(path);
        });
    });
    return del(paths, {force: true});
});

/**
 * JSDoc 生成
 */
// jsdoc3
gulp.task('jsdoc3', ['js'], (cb) => {
    const config = require('./doc/jsdoc.json');
    gulp.src(['doc/header.md', 'doc/global.js', 'build/baas.js'], {read: false})
        .pipe(jsdoc3(config, cb));
    
});

// デフォルト
gulp.task('default', ['build']);

// watch
gulp.task('watch', () => {
    gulp.watch(tsSources, ['install']);
    gulp.watch(["ut/*.ts", "!**/baas.ts", "!**/*.d.ts"], ['ts']);
});

gulp.task('watch-jsdoc3', () => {
    gulp.watch(["*.ts", "push/*.ts", "!**/baas.ts", "!**/*.d.ts", "doc/*.md", "doc/jsdoc.json"], ['jsdoc3']);
});
