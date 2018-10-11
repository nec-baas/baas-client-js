import {Nebula, HttpRequest, NebulaService} from "../build/baas";
import "mocha";
import {assert, expect} from "chai";

const TENANT_ID = "tenant1";
const APP_ID = "appId1";
const APP_KEY = "appKey1";
const BASE_URI = "http://api.example.com/api";
const DEBUG_MODE = "debug";
const ENABLE_HTTP2 = false;

describe("HttpRequest", () => {
    describe("unit test", () => {
        let param: any;

        let service: NebulaService;
        let request: HttpRequest;

        beforeEach(() => {
            param = {
                "tenant": TENANT_ID,
                "appId": APP_ID,
                "appKey": APP_KEY,
                "baseUri": BASE_URI,
                "enableHttp2": ENABLE_HTTP2
            };
            service = new Nebula.NebulaService();
            service.initialize(param);
            request = new HttpRequest(service, "dummy");
        });

        it("Nebula.HttpRequest : useHttp2() init value false", () => {
            expect(request.useHttp2).equal(false, "初期値が取得できること");
        });
        it("Nebula.HttpRequest : useHttp2() init value true", () => {
            param = {
                "tenant": TENANT_ID,
                "appId": APP_ID,
                "appKey": APP_KEY,
                "baseUri": BASE_URI,
                "enableHttp2": true
            };
            service.initialize(param);
            request = new Nebula.HttpRequest(service, "dummy");
            expect(request.useHttp2).equal(true, "初期値が取得できること");
        });

        it("Nebula.HttpRequest : use/getHttp2()", () => {
            request.useHttp2 = false;
            expect(request.useHttp2).equal(false, "設定値が取得できること");

            //// version dependency
            //// node < v8.4 case
            // assert.throw(function() {
            //     request.useHttp2 = true;
            // });
            //// node <= v8.4 case
            // expect(request.useHttp2).equal(true, "設定が変更できること");
        });

        it("Nebula.HttpRequest : closeHttp2Session()", () => {
            // no way to create HTTP/2 session by UT. just empty tests
            Nebula.HttpRequest.closeHttp2Session();
        });

        it("Nebula.HttpRequest : closeHttp2Session(value)", () => {
            // no way to create HTTP/2 session by UT. just empty tests
            Nebula.HttpRequest.closeHttp2Session("dummy");
        });

    });

});
