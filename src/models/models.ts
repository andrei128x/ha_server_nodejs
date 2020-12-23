/*
  PURPOSE:  define MongoDB models for the "serices-data" module
  TODO:     add multiple models in the future
*/

import { Document, Schema, model } from 'mongoose';
import { ISensorData } from '../interfaces/interfaces';

export type ISensorModel = Document & ISensorData;

const schemaDescriptor: { [prop: string]: StringConstructor } =
{
  sensor_name: String,
  property_name: String,
  property_value: String,
  timestamp: String
};

const sensor = new Schema(
  schemaDescriptor,
  { bufferCommands: false }
);

export const sensorData = model<ISensorModel>('sensor', sensor, 'sensors');
