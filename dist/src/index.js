"use strict";
/*
  PURPOSE:  App that gathers sensor data and adds it to a MongoDB database
  todo:     use UDP protocol
  todo:     periodic query sensors for data - done

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
const ping = require("ping");
const environmentMapper_1 = require("./utils/environmentMapper");
const sensorsInterface = require("./services/servicesSensorsConnector");
const servicesHttpServer = require("./services/servicesHttp");
const servicesMongoData = require("./services/servicesDatabaseConnector");
const servicesCronJobs_1 = require("./services/servicesCronJobs");
// global state variable that keeps track of Mongo connection
const VARS = environmentMapper_1.EnvironmentMapper.parseEnvironment();
let serviceMongoActive = false;
function setUpRouteOutgoingSensorsData() {
    servicesHttpServer.router.get('/api', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield servicesMongoData.findSomeDataPromise('senzor_pod', 'temperature');
            // console.log(`[OK][INDEX] Got database response: ${data} items`);
            const tempData = data.map((x) => ` "${x.property_value}"`);
            const timestampData = data.map((x) => `"${(x.timestamp === undefined ? '?' : x.timestamp)}"`);
            res.status(200).send(JSON.parse(`{"data": [${tempData}],\n\n "times": [${timestampData}]}`));
        }
        catch (err) {
            console.log(`[ERROR][INDEX] Setting up router reported: ${err}`);
        }
    }));
}
function setUpRouteIncomingSensorsStream() {
    return __awaiter(this, void 0, void 0, function* () {
        sensorsInterface
            .getJsonDataObservable(VARS.URL_DEVICE_TEMP_SENSOR) // observable generates PERIODIC data
            .subscribe((data) => {
            if (serviceMongoActive)
                servicesMongoData.insertSomeDataPromise(data);
            else
                console.log('[ERROR][INDEX] Error at insert: database connection is NOT active');
        }, (err) => {
            console.log('[ERROR][INDEX] HTTP Observer connection error: ', err);
        });
    });
}
function setUpRouteGateOpener() {
    return __awaiter(this, void 0, void 0, function* () {
        // forward request to open the gate to the specific IoT device
        servicesHttpServer.router.get('/api/click', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // let data = await servicesHttpServer.getJsonPromise(URL_DEVICE_GATE_OPENER_MOCK) // testing one
                const data = yield servicesHttpServer.getJsonPromise(VARS.URL_DEVICE_GATE_OPENER); // real one
                console.log('[OK][INDEX] Servo button responded correctly');
                res.contentType = 'application/json';
                setTimeout(() => { res.status(200).send({ response: '[OK]' }); }, 2000);
            }
            catch (err) {
                // console.log('[ERROR][INDEX]Servo API did NOT respond correctly');
                res.status(400).send({ response: '[FAIL]' });
            }
        }));
    });
}
function setUpRouteGateOpenerMOCK() {
    return __awaiter(this, void 0, void 0, function* () {
        // forward request to open the gate to the specific IoT device
        servicesHttpServer.router.get('/api/click_test', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // let data = await servicesHttpServer.getJsonPromise(URL_DEVICE_GATE_OPENER_MOCK) // testing one
                const data = yield servicesHttpServer.getJsonPromise(VARS.URL_DEVICE_GATE_OPENER_MOCK); // real one
                console.log('[OK][INDEX] MOCK Servo button responded correctly');
                res.contentType = 'application/json';
                setTimeout(() => { res.status(200).send({ response: '[OK]' }); }, 2000);
            }
            catch (err) {
                // console.log('[ERROR][INDEX]Servo API did NOT respond correctly');
                res.status(400).send({ response: '[FAIL]' });
            }
        }));
    });
}
function setUpPingWiFiHeartbeat() {
    const cfgs = {
        timeout: 2,
        numeric: false,
        extra: ['-i .5', '-c 3']
    };
    const localCronJob1 = new servicesCronJobs_1.CronJob(() => {
        ping.promise.probe(VARS.URL_TEST_PING_ADDR, cfgs).then((r) => {
            // console.log(`[OK][INDEX] Ping response: ${r.host} | ${r.numeric_host} | ${r.stddev} | ${r.alive}`);
            // console.log(`\nRaw response:\n${r.output}`);
        });
        // TODO: add the ping results to the database
    }, 5000);
}
function setUpPeriodicAutoCleanUp() {
    const localCronJob2 = new servicesCronJobs_1.CronJob(() => {
        if (serviceMongoActive)
            servicesMongoData.removeSomeData();
    }, 24 * 3600 * 1000); // clean-up job runs once every 24 hours
}
// [ START APP HERE ]
(function mainEntryPointHere() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('\n');
        servicesHttpServer.initExpressApp(); // Express service available without database connection
        serviceMongoActive = yield servicesMongoData.databaseConnect();
        setUpRouteGateOpener();
        setUpRouteGateOpenerMOCK();
        setUpRouteOutgoingSensorsData();
        setUpRouteIncomingSensorsStream();
        setUpPeriodicAutoCleanUp();
        setUpPingWiFiHeartbeat();
    });
})(); // END MAIN
