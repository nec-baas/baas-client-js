import {FileBucket, Nebula} from "../build/baas";
import {before, describe, it} from "mocha";
import {expect} from "chai";
import {NebulaInitParam} from "../NebulaService";

describe("FileBucket", () => {

    let bucket: FileBucket;

    before(function () {
        const param: NebulaInitParam = {
            "tenant": "ut_tenant",
            "appId": "ut_appId",
            "appKey": "ut_appKey",
            // baseUriにはアクセスできないアドレスを指定する
            "baseUri": "http://localhost:54321",
            "debugMode": "debug"
        };
        Nebula.initialize(param);
        bucket = new Nebula.FileBucket("utBucket");
    });

    describe("loadWithOptions()", () => {
        it("パラメータ正常(HTTP Error)", (done) => {
            bucket.loadWithOptions("testFileName",
                {
                    extraResponse: true,
                    ifRange: "sample",
                    ifMatch: "sample2",
                    rangeStart: 1,
                    rangeEnd: 2
                }
            ).then((data: any) => {
                // unexpectedly success
            }).catch((e: any) => {
                // expect http error, not parameter error
                expect(e.status).equal(0);
                expect(e.statusText).equal("HTTP request error");
                done();
            });
        });

        it("パラメータ正常(HTTP Error) options: 空オブジェクト", (done) => {
            bucket.loadWithOptions("testFileName", {}
            ).then((data: any) => {
                // unexpectedly success
            }).catch((e: any) => {
                // expect http error, not parameter error
                expect(e.status).equal(0);
                expect(e.statusText).equal("HTTP request error");
                done();
            });
        });

        it("パラメータ正常(HTTP Error) options: undefined", (done) => {
            bucket.loadWithOptions("testFileName", undefined
            ).then((data: any) => {
                // unexpectedly success
            }).catch((e: any) => {
                // expect http error, not parameter error
                expect(e.status).equal(0);
                expect(e.statusText).equal("HTTP request error");
                done();
            });
        });

        it("パラメータ異常(ファイル名指定無し)", () => {
            const array : any[]= [undefined, null];

            for (const value of array) {
                const castValue: any = value;
                expect(function () {
                    bucket.loadWithOptions(castValue, {});
                }).to.throw("No fileName");
            }
        });

        it("パラメータ異常(options: 型不正)", () => {
            // undefinedは許可
            // null, boolean, string, number
            const array = [null, false, true, "", "unexpected", 0, -1, 1, 3.14];

            for (const value of array) {
                const castValue: any = value;
                expect(function () {
                    bucket.loadWithOptions("testFileName", castValue);
                }).to.throw("Invalid options: " + castValue);
            }
        });


        it("パラメータ異常(options: rangeStart不正)", () => {
            const array = [{rangeStart: -1, rangeEnd: 1}, {rangeStart: 3.14, rangeEnd: 1}];

            for (const value of array) {
                const castValue: any = value;
                expect(function () {
                    bucket.loadWithOptions("testFileName", castValue);
                }).to.throw("invalid rangeStart value: " + castValue["rangeStart"]);
            }
        });

        it("パラメータ異常(options: rangeEnd不正)", () => {
            const array = [{rangeStart: 1, rangeEnd: -1}, {rangeStart: 1, rangeEnd: 3.14}];

            for (const value of array) {
                const castValue: any = value;
                expect(function () {
                    bucket.loadWithOptions("testFileName", castValue);
                }).to.throw("invalid rangeEnd value: " + castValue["rangeEnd"]);
            }
        });

        it("パラメータ正常(Raw Request)(HTTP Error)", (done) => {
            bucket.loadWithOptions("testFileName",
                {
                    rawRequest: true,
                    extraResponse: true,
                    ifRange: "sample",
                    ifMatch: "sample2",
                    rangeStart: 1,
                    rangeEnd: 2
                }
            ).then((data: any) => {
                // unexpectedly success
            }).catch((e: any) => {
                // expect http error, not parameter error
                expect(e.status).equal(0);
                expect(e.statusText).equal("HTTP request error");
                done();
            });
        });
    });

    describe("_createRangeValue()", () => {
        it("パラメータ正常 rangeStart=undefined, rangeEnd=undefined", () => {
            // ヘッダを付与しない
            expect(FileBucket._createRangeValue(undefined, undefined)).equal(undefined);
        });
        it("パラメータ正常 rangeStart=0, rangeEnd=undefined", () => {
            expect(FileBucket._createRangeValue(0, undefined)).equal("0-");
        });
        it("パラメータ正常 rangeStart=100, rangeEnd=undefined", () => {
            expect(FileBucket._createRangeValue(100, undefined)).equal("100-");
        });
        it("パラメータ正常 rangeStart=0, rangeEnd=0", () => {
            expect(FileBucket._createRangeValue(0, 0)).equal("0-0");
        });
        it("パラメータ正常 rangeStart=1, rangeEnd=100", () => {
            expect(FileBucket._createRangeValue(1, 100)).equal("1-100");
        });
        it("パラメータ正常 rangeStart=100, rangeEnd=1", () => {
            // 並び順は判断しない
            expect(FileBucket._createRangeValue(100, 1)).equal("100-1");
        });
        it("パラメータ正常 rangeStart=undefined, rangeEnd=0", () => {
            expect(FileBucket._createRangeValue(undefined, 0)).equal("-0");
        });
        it("rangeStart=undefined, rangeEnd=100", () => {
            expect(FileBucket._createRangeValue(undefined, 100)).equal("-100");
        });

        it("パラメータ異常(rangeStart)", () => {
            // undefinedは許容、0以上の整数が可
            const array = [null, false, true, "", "unexpected", -1, 3.14, {}, {test: 1}, [], [1]];

            for (const value of array) {
                const rangeStart: any = value;
                expect(function () {
                    FileBucket._createRangeValue(rangeStart, 10);
                }).to.throw("invalid rangeStart value: " + rangeStart);
            }
        });

        it("パラメータ異常(rangeEnd)", () => {
            // undefinedは許容、0以上の値が可
            const array = [null, false, true, "", "unexpected", -1, 3.14, {}, {test: 1}, [], [1]];

            for (const value of array) {
                const rangeEnd: any = value;
                expect(function () {
                    FileBucket._createRangeValue(10, rangeEnd);
                }).to.throw("invalid rangeEnd value: " + rangeEnd);
            }
        });
    });

});