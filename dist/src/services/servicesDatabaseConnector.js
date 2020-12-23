"use strict";
/*
    Purpose: module provides database operation services
    TODO:   select function based on property name
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
// connect to MLAB.COM's account
const mongoose_1 = require("mongoose");
// const router = express.Router();
const models_1 = require("../models/models");
const utils_1 = require("../utils/utils");
const environmentMapper_1 = require("../utils/environmentMapper");
const mongoServer = environmentMapper_1.EnvironmentMapper.parseEnvironment().URL_MONGO_SERVER;
// connect to the MongoDB database
function databaseConnect() {
    return __awaiter(this, void 0, void 0, function* () {
        let connected;
        try {
            if (!mongoServer)
                utils_1.throwHere();
            yield mongoose_1.connect(mongoServer, { useNewUrlParser: true }, err => {
                if (err) {
                    console.log(`[DB][CONNECT] callback result: ${err}; throwing error so it does not hang`);
                    throw (err);
                }
            });
            console.log(`[OK][DB] Connected to MongoDB database`);
            connected = true;
        }
        catch (err) {
            console.log(`[ERROR][DB] ${err}`);
            connected = false;
        }
        return connected;
    });
}
exports.databaseConnect = databaseConnect;
// insert array of properties into the MongoDB database
function insertSomeDataPromise(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            models_1.sensorData.insertMany(data, (error, dataAdded) => {
                if (error) {
                    console.log('[DB] Error at insert : ', error);
                }
                else {
                    // console.log('Date introduse: ', dataAdded);
                }
            });
        }
        catch (err) {
            console.log('[DB][INSERT] Error at insert : ', err);
        }
    });
}
exports.insertSomeDataPromise = insertSomeDataPromise;
function findSomeDataPromise(deviceName, propertyName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('searching');
            const data = models_1.sensorData.find({ sensor_name: deviceName, property_name: propertyName }, null, { limit: 2880, sort: { _id: -1 }, socketTimeoutMS: 1000 }
            // {limit: 288, sort:{_id: -1}}
            , (err) => { if (err) {
                console.log(`[DB][SEARCH] callback result: ${err}; throwing error so it does not hang`);
            } });
            return data;
        }
        catch (err) {
            console.log('[DB] Error connecting to MongoDB database - FIND function');
            return []; // returns empty set
        }
    });
}
exports.findSomeDataPromise = findSomeDataPromise;
function removeSomeData(daysAgo) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = models_1.sensorData.deleteMany({ timestamp: { $lt: Date.now() - 1000 * 3600 * 24 * 7 * 6 } } // more than 6 weeks old to milliseconds
            , (err) => { if (true) {
                console.log(`[DB][CLEAN-UP] callback result: ${err}`);
            } });
            console.log(`[OK][DB] Cleaned-up succeeded`);
        }
        catch (err) {
            utils_1.logOthers('[ERROR][SENSORS] Exception in removeSomeData function');
        }
    });
}
exports.removeSomeData = removeSomeData;
// EXPORTS
module.exports = {
    databaseConnect,
    insertSomeDataPromise,
    findSomeDataPromise,
    removeSomeData
};
