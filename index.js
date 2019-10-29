/*
  PURPOSE:  App that gathers sensor data and adds it to a MongoDB database
  todo:     use UDP protocol
  todo:     periodic query sensors for data - done

*/
'use strict';

// require section
const sensorsInterface = require('./services/services-sensorsIF');
const servicesMongoData = require('./services/services-database-interface');
const servicesHttpServer = require('./services/services-http');
const serviceCronJob = require('./services/service-cron-jobs')
const ping = require('ping')

const VARS = require('dotenv').config().parsed;

// global state variable that keeps track of Mongo connection
var mongoServerActive = false;


function setUpRouteSensorsOutgoingData()
{
    servicesHttpServer.router.get('/api', async (req, res, next) =>
    {
        try
        {
            const data = await servicesMongoData.findSomeDataPromise('senzor_pod', 'temperature');
            console.log(`[OK][INDEX] Got database response: ${data} items`);

            const tempData = data.map(x => { return ` "${x.property_value}"`; });
            const timestampData = data.map(x => { return `"${(x.timestamp === undefined ? '?' : x.timestamp)}"`; });

            res.status(200).send(JSON.parse(
                `{"data": [${tempData}],\n\n "times": [${timestampData}]}`
            ));
        }
        catch (err)
        {
            console.log(err);
        }
    });
}


async function setUpRouteSensorsIncomingStream()
{
    sensorsInterface
        .getJsonDataObservable(VARS.URL_DEVICE_TEMP_SENSOR) // observable generates PERIODIC data
        .subscribe(
            (data) =>
            {
                if (mongoServerActive)
                {
                    servicesMongoData.insertSomeDataPromise(data);
                }
                else
                {
                    console.log('[ERROR][INDEX] Error at insert: database connection is NOT active')
                }
            },
            (err) =>
            {
                console.log('[ERROR][INDEX] HTTP Observer connection error: ', err);
            });
}



async function setUpRouteGateOpener()
{
    // forward request to open the gate to the specific IoT device
    servicesHttpServer.router.get('/api/click', async (req, res, next) =>
    {
        try
        {
            // let data = await servicesHttpServer.getJsonPromise(URL_DEVICE_GATE_OPENER_MOCK) // testing one
            const data = await servicesHttpServer.getJsonPromise(VARS.URL_DEVICE_GATE_OPENER); // real one

            // console.log('[OK][INDEX] Servo button responded correctly');
            res.contentType='application/json';
            setTimeout( ()=>{ res.status(200).send({response:'[OK]'}) }, 2000);
        } catch (err)
        {
            // console.log('[ERROR][INDEX]Servo API did NOT respond correctly');
            res.status(400).send({response:'[FAIL]'});
        }
    });
}


function setUpPingMonitor()
{
    const cfgs = {
        timeout: 2,
        numeric: false,
        extra: ["-i .5", "-c 3"],
    };

    let localCronJob1 = new serviceCronJob(() =>
    {
        ping.promise.probe(VARS.URL_TEST_PING_ADDR, cfgs).then((r) =>
        {
            console.log(`Response: ${r.host} | ${r.numeric_host} | ${r.stddev} | ${r.alive}`);
            //console.log(`\nRaw response:\n${r.output}`);
        })

        // TODO: add the ping results to the database

    }, 5000)
}


// [ START APP HERE ]
(async function mainEntryPointHere()
{
    console.log('\n');

    servicesHttpServer.initExpressApp(); // Express service available without database connection
    mongoServerActive = await servicesMongoData.databaseConnect();

    setUpRouteGateOpener();

    setUpRouteSensorsOutgoingData();
    setUpRouteSensorsIncomingStream();

    setUpPingMonitor();

})() // END MAIN



const testSrvr = require('./services/services-dummy-tests');

testSrvr.startTestHttpServer();

