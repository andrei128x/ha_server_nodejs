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
const DeviceDetectionService_1 = require("./services/DeviceDetectionService");
const UdpMonitoring_1 = require("./services/UdpMonitoring");
const environmentMapper_1 = require("./utils/environmentMapper");
const console_util_1 = require("./utils/console_util");
const CronJobsService_1 = require("./services/CronJobsService");
const envVars = environmentMapper_1.EnvironmentMapper.parseEnvironment();
// [ START APP HERE - entrypoint ]
(function mainEntryPointHere() {
    return __awaiter(this, void 0, void 0, function* () {
        console_util_1.setConsole();
        console.log('\n');
        yield DeviceDetectionService_1.scanNetwork(envVars); // detect local devices based on their MAC address, and configure their specific APIs
        const httpServer = yield CronJobsService_1.Jobs.init(envVars); // Express service available without database connection
        const streamSourceUDP = new UdpMonitoring_1.ServiceUdpMonitoring(httpServer);
    });
})();
// [ END APP HERE ]
