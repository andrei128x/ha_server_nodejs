
/*
    PURPOSE:  module where various sensors are defined and their data is acquired
    TODO:     make connected sensors to  be plug-and-play: parse returned json and return a list compatible with model
*/

// require section
import { requestJsonPromise } from './HttpUtilities';
import { Observable, Subscriber } from 'rxjs';
import { ISensorData, ISensorRawData } from '../interfaces/interfaces';

const ERROR_DATA = {
  temperature: 0, // last known good values
  uptime: 'NA',
  reset: 'NA'
};

function _formatSenzorPod(jsonData: ISensorRawData): ISensorData[]
{
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

function lastGoodKnownTemperature(rawData: ISensorRawData): ISensorRawData
{
  if (rawData.temperature === -127)
    rawData = Object(ERROR_DATA); // sensor reading responded, but wrong, copy and use the back-up data

  // backup the last known good reading
  // ERROR_DATA.temperature = jsonData.temperature;
  // undo the back-up thingy
  ERROR_DATA.temperature = -127;
  return rawData;
}

export function getJsonDataObservable(url: string)
{
  const tmpObservable = new Observable((observer: Subscriber<ISensorData[]>) =>
  {
    setInterval(async () =>
    {
      try
      {
        const data = await requestJsonPromise(url);

        // data.temperature = "-127.00";
        console.log('[OK][SENSOR_IF] data from http connection: ', data);

        const dataToInsert: ISensorData[] = _formatSenzorPod(JSON.parse(data));
        observer.next(dataToInsert);
        // throw(new Error('test error 1'))
      }
      catch (err)
      {
        console.log('[ERR][SENSOR_IF] sensor HTTP response error: ', err);
        const dataToInsert: ISensorData[] = _formatSenzorPod(ERROR_DATA);

        // ERROR REPORTING disabled for this observer; ALL info will be logged into the database !!!
        // observer.error(err);
        observer.next(dataToInsert);
      }
    }, 15000); // 15second period for querying the sensors/endpoints
  });

  return tmpObservable;
}
