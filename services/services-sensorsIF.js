
/*
    PURPOSE:  module where various sensors are defined and their data is acquired
    TODO:     make connected sensors to  be plug-and-play: parse returned json and return a list compatible with model
*/

// require section
const httpServices = require('./services-http');

const { Observable } = require('rxjs');

var ERROR_DATA = {
  temperature: 0, // last known good values
  uptime: 'NA',
  reset: 'NA'
};

function _formatSenzorPod(jsonData)
{
  if (jsonData.temperature == -127) jsonData = Object(ERROR_DATA); // sensor reading responded, but wrong, copy and use the back-up data

  // backup the last known good reading
  // ERROR_DATA.temperature = jsonData.temperature;
  // undo the back-up thingy
  ERROR_DATA.temperature = '-127';

  return [
    {
      sensor_name: 'senzor_pod',
      property_name: 'temperature',
      property_value: jsonData.temperature,
      timestamp: Date.now()
    },

    {
      sensor_name: 'senzor_pod',
      property_name: 'uptime',
      property_value: jsonData.uptime,
      timestamp: Date.now()
    },

    {
      sensor_name: 'senzor_pod',
      property_name: 'reset',
      property_value: jsonData.reset,
      timestamp: Date.now()
    }
  ];
}

function getJsonDataObservable(url)
{
  const tmpObservable = new Observable((observer) =>
  {
    setInterval ( async () =>
    {
      try{
        let data = await httpServices.getJsonPromise(url)
  
        // data.temperature = "-127.00";
        console.log('[OK][SENSOR_IF] data from http connection: ', data);

        const data_to_insert = _formatSenzorPod(JSON.parse(data));
        observer.next(data_to_insert);
        //throw(new Error('test error 1'))
      }
      catch(err)
      {
          console.log('[ERR][SENSOR_IF] sensor HTTP response error: ', err);
          const data_to_insert = _formatSenzorPod(ERROR_DATA);

          // ERROR REPORTING disabled for this observer; ALL info will be logged into the database !!!
          // observer.error(err);
          observer.next(data_to_insert);
        };
    }, 15000 ); // 15second period for querying the sensors/endpoints
  });

  return tmpObservable;
}

sensors_if = {
  getJsonDataObservable
};

module.exports = sensors_if;
