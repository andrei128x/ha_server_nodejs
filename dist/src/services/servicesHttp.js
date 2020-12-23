"use strict";
/*
    PURPOSE:  module where various sensors are defined and their data is acquired
    TODO:     make connected sensors to  be plug-and-play: parse returned json and return a list compatible with model
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const httpClient = require("http");
const app = express();
exports.router = express.Router();
const PORT = 3000;
function initExpressApp() {
    app.use(bodyParser.json());
    app.use(cors());
    app.use('/', exports.router);
    app.disable('x-powered-by');
    // defining fallback route here
    app.get('*', (req, res) => {
        res.sendStatus(404);
    });
    app.listen(PORT, () => {
        console.log(`[HTTP] Listening on port ${PORT} ...`);
    });
}
exports.initExpressApp = initExpressApp;
// return JSON data as a promise for the specified URL
function getJsonPromise(url) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('Http request started...');
        /**
         * @tmpPromise Promise<JSON>
         */
        const tmpPromise = new Promise((resolve, reject) => {
            process.stdout.write('[HTTP]');
            const req = httpClient.get(url, resp => {
                let data = '';
                // A chunk of data has been recieved.
                resp.on('data', chunk => {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    // console.log('[OK][HTTP] HTTP data incoming: ', data);
                    resolve(data);
                });
            }).on('error', err => {
                console.log(`[ERROR][HTTP] HTTP_GET error: ${err}`);
                // req.abort();
                reject(err);
            }).setTimeout(1000, () => {
                console.log('[ERROR][HTTP] Timeout error');
                // req.abort();
                reject('ERR_TIMEOUT');
            });
        });
        return yield tmpPromise;
    });
}
exports.getJsonPromise = getJsonPromise;
