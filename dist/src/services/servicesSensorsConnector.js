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
// require section
const servicesHttp_1 = require("./servicesHttp");
const rxjs_1 = require("rxjs");
const ERROR_DATA = {
    temperature: 0,
    uptime: 'NA',
    reset: 'NA'
};
function _formatSenzorPod(jsonData) {
    jsonData = lastGoodKnownTemperature(jsonData);
    return [
        {
            sensor_name: 'senzor_pod',
            property_name: 'temperature',
            property_value: jsonData.temperature.toString(),
            timestamp: Date.now().toString()
        },
        {
            sensor_name: 'senzor_pod',
            property_name: 'uptime',
            property_value: jsonData.uptime,
            timestamp: Date.now().toString()
        },
        {
            sensor_name: 'senzor_pod',
            property_name: 'reset',
            property_value: jsonData.reset,
            timestamp: Date.now().toString()
        }
    ];
}
function lastGoodKnownTemperature(rawData) {
    if (rawData.temperature === -127)
        rawData = Object(ERROR_DATA); // sensor reading responded, but wrong, copy and use the back-up data
    // backup the last known good reading
    // ERROR_DATA.temperature = jsonData.temperature;
    // undo the back-up thingy
    ERROR_DATA.temperature = -127;
    return rawData;
}
function getJsonDataObservable(url) {
    const tmpObservable = new rxjs_1.Observable((observer) => {
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield servicesHttp_1.getJsonPromise(url);
                // data.temperature = "-127.00";
                console.log('[OK][SENSOR_IF] data from http connection: ', data);
                const dataToInsert = _formatSenzorPod(JSON.parse(data));
                observer.next(dataToInsert);
                // throw(new Error('test error 1'))
            }
            catch (err) {
                console.log('[ERR][SENSOR_IF] sensor HTTP response error: ', err);
                const dataToInsert = _formatSenzorPod(ERROR_DATA);
                // ERROR REPORTING disabled for this observer; ALL info will be logged into the database !!!
                // observer.error(err);
                observer.next(dataToInsert);
            }
        }), 15000); // 15second period for querying the sensors/endpoints
    });
    return tmpObservable;
}
exports.getJsonDataObservable = getJsonDataObservable;
