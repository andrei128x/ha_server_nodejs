"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentMapper = void 0;
const interfaces_1 = require("../interfaces/interfaces");
const dotenv_1 = require("dotenv");
const utils_1 = require("./utils");
const path_1 = require("path");
class EnvironmentMapper {
    constructor() {
        this.VARS = {};
    }
    static parseEnvironment() {
        const envFile = './system-vars.env';
        // logOthers({ 'x': resolve(envFile) });
        let environmentData;
        if (!EnvironmentMapper.prototype.VARS) {
            environmentData = dotenv_1.config({ path: path_1.resolve(envFile) }).parsed;
            if (!interfaces_1.IsEnvList(environmentData))
                utils_1.throwHere(environmentData);
            EnvironmentMapper.prototype.VARS = environmentData;
        }
        return EnvironmentMapper.prototype.VARS;
    }
}
exports.EnvironmentMapper = EnvironmentMapper;
