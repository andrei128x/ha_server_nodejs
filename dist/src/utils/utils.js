"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwHere = exports.logOthers = exports.EGlobalError = void 0;
class EGlobalError extends Error {
    constructor(message) {
        super(message ? message : `unknown error`);
    }
}
exports.EGlobalError = EGlobalError;
function logOthers(stuff) {
    console.log(`[OTHER] Info: ${JSON.stringify(stuff || {})}`);
}
exports.logOthers = logOthers;
function throwHere(stuff) {
    throw new EGlobalError(`[OTHER] Exception happened: ${JSON.stringify(stuff || {})}`);
}
exports.throwHere = throwHere;
