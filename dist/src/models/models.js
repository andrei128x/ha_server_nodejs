"use strict";
/*
  PURPOSE:  define MongoDB models for the "serices-data" module
  TODO:     add multiple models in the future
*/
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const schemaDescriptor = {
    sensor_name: String,
    property_name: String,
    property_value: String,
    timestamp: String
};
const sensor = new mongoose_1.Schema(schemaDescriptor, { bufferCommands: false });
exports.sensorData = mongoose_1.model('sensor', sensor, 'sensors');
