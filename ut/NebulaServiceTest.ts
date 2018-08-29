import {Nebula, HttpRequest} from "../build/baas";
import "mocha";
import {assert, expect} from "chai";
import {assertLog} from "./Common";

const TENANT_ID = "tenant1";
const APP_ID = "appId1";
const APP_KEY = "appKey1";
const BASE_URI = "http://api.example.com/api";
const DEBUG_MODE = "debug";

describe("NebulaService", () => {
    describe("初期化", () => {
        let param: any;

        beforeEach(() => {
            param = {
                "tenant": TENANT_ID,
                "appId": APP_ID,
                "appKey": APP_KEY,
                "baseUri": BASE_URI
            };
        });

        function assertCommon() {
            assertLog("Nebula.initialize の呼び出しに成功すること");
            assert.deepEqual(Nebula.getTenantID(), TENANT_ID, "テナントID が正しく初期化されていること");
            assert.deepEqual(Nebula.getAppID(), APP_ID, "アプリケーションID が正しく初期化されていること");
            assert.deepEqual(Nebula.getAppKey(), APP_KEY, "アプリケーションキーが正しく初期化されていること");
            assert.deepEqual(Nebula.getBaseUri(), BASE_URI, "エンドポイントURL が正しく初期化されていること");
        }

        it("initialize − 最小設定", () => {
            Nebula.initialize(param);
            assertCommon();
            assert.isFalse(Nebula.isAllowSelfSignedCert(), "SSL自己署名証明書拒否で初期化されていること");
            assert.deepEqual(Nebula.getDebugMode(), "release", "デバッグモードに「release」が設定されていること");
        });


        it("initialize − debugMode パラメータ省略/SSL自己署名証明書拒否", () => {
            param.offline = false;
            param.allowSelfSignedCert = false;
            Nebula.initialize(param);
            assertCommon();
            assert.isFalse(Nebula.isAllowSelfSignedCert(), "SSL自己署名証明書拒否で初期化されていること");
            assert.deepEqual(Nebula.getDebugMode(), "release", "デバッグモードに「release」が設定されていること");
        });

        it("initialize − debugMode 設定/SSL自己署名証明書許可", () => {
            param.debugMode = DEBUG_MODE;
            param.allowSelfSignedCert = true;
            Nebula.initialize(param);
            assertCommon();
            assert.isTrue(Nebula.isAllowSelfSignedCert(), "SSL自己署名証明書許可で初期化されていること");
            assert.deepEqual(Nebula.getDebugMode(), DEBUG_MODE, "デバッグモードが正しく初期化されていること");
        });

        it("initialize − debugMode 設定/SSL自己署名証明書可否省略", () => {
            param.debugMode = DEBUG_MODE;
            Nebula.initialize(param);
            assertCommon();
            assert.isFalse(Nebula.isAllowSelfSignedCert(), "SSL自己署名証明書許可/拒否が正しく初期化されていること");
            assert.deepEqual(Nebula.getDebugMode(), DEBUG_MODE, "デバッグモードが正しく初期化されていること");
        });

        it("initialize − エンドポイントURL にスラッシュ追加", () => {
            param.baseUri = BASE_URI + "/";
            Nebula.initialize(param);
            assertCommon(); // 末尾スラッシュが削除されていること
        });
    });

    it("定義値へのアクセス", () => {
        assert.strictEqual(Nebula.BUCKET_MODE_ONLINE, 0, "バケットモード : BUCKET_MODE_ONLINE (オンラインモード)にアクセスできること");
        assert.strictEqual(Nebula.BUCKET_MODE_REPLICA, 1, "バケットモード : BUCKET_MODE_REPLICA (レプリカモード)にアクセスできること");
        assert.strictEqual(Nebula.BUCKET_MODE_LOCAL, 2, "バケットモード : BUCKET_MODE_LOCAL (ローカルモード)にアクセスできること");
    });

    it("setAppKey − アプリケーションキーを変更する", () => {
        Nebula.initialize({
            tenant: TENANT_ID,
            appId: APP_ID,
            appKey: APP_KEY,
            baseUri: BASE_URI
        });

        const newKey = 'ABCDEFG';
        const beforeKey = Nebula.getAppKey();
        assert.equal(beforeKey, APP_KEY);

        Nebula.setAppKey(newKey);
        const afterKey = Nebula.getAppKey();
        
        assert.equal(afterKey, newKey, "指定されたキーへの変更が可能であること");
    });

    describe("プロキシ設定", () => {
        it("setHttpProxy - 正常に設定・解除できること", () => {
            // 設定
            Nebula.setHttpProxy({host: "proxy.example.com", port: 8080});
            assert.isNotNull(HttpRequest._httpAgent);
            // 解除
            Nebula.setHttpProxy(null);
            assert.isNull(HttpRequest._httpAgent);
        });

        it("setHttpsProxy - 正常に設定・解除できること", () => {
            // 設定
            Nebula.setHttpsProxy({host: "proxy.example.com", port: 8080});
            assert.isNotNull(HttpRequest._httpsAgent);
            // 解除
            Nebula.setHttpsProxy(null);
            assert.isNull(HttpRequest._httpsAgent);
        });
    });
});
