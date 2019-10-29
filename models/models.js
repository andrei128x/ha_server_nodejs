/*
  PURPOSE:  define MongoDB models for the "serices-data" module
  TODO:     add multiple models in the future
*/

const mongoose = require('mongoose');

const sensor = new mongoose.Schema(
  {
    sensor_name: String,
    property_name: String,
    property_value: String,
    timestamp: String
  },
  {
    bufferCommands: false
  }
);

module.exports = {
  sensorData: mongoose.model('sensor', sensor, 'sensors')
};
