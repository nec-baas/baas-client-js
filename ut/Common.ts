import {assert} from "chai";

export const assertLog = (message: string) => {
    assert.isTrue(true, message);
};

export const assertFail = (message: string) => {
    assert.isTrue(false, message);
};
