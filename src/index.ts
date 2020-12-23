/*
  PURPOSE:  App that gathers sensor data and adds it to a MongoDB database
  todo:     use UDP protocol
  todo:     periodic query sensors for data - done

*/

// import section

import * as ping from 'ping';
import { EnvironmentMapper } from './utils/environmentMapper';
import * as sensorsInterface from './services/servicesSensorsConnector';
import * as servicesHttpServer from './services/servicesHttp';
import * as servicesMongoData from './services/servicesDatabaseConnector';
import { CronJob } from './services/servicesCronJobs';
import { logOthers } from './utils/utils';
import { ISensorModel } from './models/models';
import { ISensorData } from './interfaces/interfaces';
import { Request } from 'express';

import { ServiceUdpMonitoring } from './services/ServicesUdpMonitoring';

// global state variable that keeps track of Mongo connection
const VARS = EnvironmentMapper.parseEnvironment();
let serviceMongoActive = false;


function setUpRouteOutgoingSensorsData()
{
    servicesHttpServer.router.get('/api', async (req: Request, res: any, next: any) =>
    {
        try
        {
            const data = await servicesMongoData.findSomeDataPromise('senzor_pod', 'temperature');
            // console.log(`[OK][INDEX] Got database response: ${data} items`);

            const tempData = data.map((x: ISensorModel) => ` "${x.property_value}"`);
            const timestampData = data.map((x: ISensorModel) => `"${(x.timestamp === undefined ? '?' : x.timestamp)}"`);

            res.status(200).send(JSON.parse(
                `{"data": [${tempData}],\n\n "times": [${timestampData}]}`
            ));
        }
        catch (err)
        {
            console.log(`[ERROR][INDEX] Setting up router reported: ${err}`);
        }
    });
}


async function setUpRouteIncomingSensorsStream()
{
    sensorsInterface
        .getJsonDataObservable(VARS.URL_DEVICE_TEMP_SENSOR) // observable generates PERIODIC data
        .subscribe(
            (data: ISensorData[]) =>
            {
                if (serviceMongoActive)
                    servicesMongoData.insertSomeDataPromise(data);
                else
                    console.log('[ERROR][INDEX] Error at insert: database connection is NOT active');
            },
            (err: any) =>
            {
                console.log('[ERROR][INDEX] HTTP Observer connection error: ', err);
            });
}


async function setUpRouteGateOpener()
{
    // forward request to open the gate to the specific IoT device
    servicesHttpServer.router.get('/api/click', async (req: Request, res: any, next: any) =>
    {
        try
        {
            // let data = await servicesHttpServer.getJsonPromise(URL_DEVICE_GATE_OPENER_MOCK) // testing one
            const data = await servicesHttpServer.getJsonPromise(VARS.URL_DEVICE_GATE_OPENER); // real one

            console.log('[OK][INDEX] Servo button responded correctly');

            /* OLD WAY */
            // res.contentType = 'application/json';
            // setTimeout(() => { res.status(200).send({ response: '[OK]' }); }, 2000);

            /* NEW WAY */
            res.status(200).json({ response: '[OK]' });

        } catch (err)
        {
            // console.log('[ERROR][INDEX]Servo API did NOT respond correctly');
            res.status(400).send({ response: '[FAIL]' });
        }
    });
}


async function setUpRouteGateOpenerMOCK()
{
    // forward request to open the gate to the specific IoT device
    servicesHttpServer.router.get('/api/click_test', async (req: Request, res: any, next: any) =>
    {
        try
        {
            // let data = await servicesHttpServer.getJsonPromise(URL_DEVICE_GATE_OPENER_MOCK) // testing one
            const data = await servicesHttpServer.getJsonPromise(VARS.URL_DEVICE_GATE_OPENER_MOCK); // real one

            console.log('[OK][INDEX] MOCK Servo button responded correctly');
            res.contentType = 'application/json';
            setTimeout(() => { res.status(200).send({ response: '[OK]' }); }, 2000);
        } catch (err)
        {
            // console.log('[ERROR][INDEX]Servo API did NOT respond correctly');
            res.status(400).send({ response: '[FAIL]' });
        }
    });
}


let currentState = 'unknown';
async function setUpRouteDoorLightSwitch()
{
    // forward request to open the gate to the specific IoT device
    servicesHttpServer.router.get('/api/door_switch/:switchState', async (req: Request, res: any, next: any) =>
    {
        try
        {
            let payload: { data: { switch: string; }; };

            let requestedState = req.params.switchState;

            if (requestedState === 'state')
            {
                // res.contentType = 'application/json';
                res.json({ response: '[OK]', state: currentState });
            }
            else
            {
                requestedState = requestedState == 'on' ? 'on' : 'off';
                
                payload = {
                    "data": {
                        "switch": requestedState
                    }
                }

                const data = await servicesHttpServer.requestJsonPromise(VARS.URL_DEVICE_LIGHT_SWITCH, { data: payload, method: 'POST' });

                console.log('[OK][INDEX] Light switch button responded correctly');
                // res.contentType = 'application/json';
                // setTimeout(() => { res.status(200).json({ response: '[OK]' }); }, 2000);
                currentState = requestedState;
                res.status(200).json({ response: '[OK]', state: currentState });
            }
        } catch (err)
        {
            console.log('[ERROR][INDEX] Light switch API did NOT respond correctly', err);
            res.status(400).json({ response: '[FAIL]' });
        }
    });
}


function setUpPingGateHeartbeat()
{
    const cfgs = {
        timeout: 2,
        numeric: false,
        extra: ['-i .5', '-c 3']
    };

    const localCronJob1 = new CronJob(() =>
    {
        ping.promise.probe(VARS.URL_HEARTBEAT_GATE_PING_ADDR, cfgs).then((r: any) =>
        {
            // console.log(`[OK][INDEX] Ping response: ${r.host} | ${r.numeric_host} | ${r.stddev} | ${r.alive}`);
            // console.log(`\nRaw response:\n${r.output}`);
        });

        // TODO: add the ping results to the database

    }, 5000);
}

function setUpPingDoorLightHeartbeat()
{
    const cfgs = {
        timeout: 2,
        numeric: false,
        extra: ['-i .5', '-c 3']
    };

    const localCronJob1 = new CronJob(() =>
    {
        ping.promise.probe(VARS.URL_HEARTBEAT_DOOR_LIGHT_PING_ADDR, cfgs).then((r: any) =>
        {
            // console.log(`[OK][INDEX] Ping response: ${r.host} | ${r.numeric_host} | ${r.stddev} | ${r.alive}`);
            // console.log(`\nRaw response:\n${r.output}`);
        });

        // TODO: add the ping results to the database

    }, 5000);
}

function setUpPeriodicAutoCleanUp()
{
    const localCronJob2 = new CronJob(() =>
    {
        if (serviceMongoActive) servicesMongoData.removeSomeData();
    }, 24 * 3600 * 1000);    // clean-up job runs once every 24 hours
}

// [ START APP HERE ]
(async function mainEntryPointHere()
{
    console.log('\n');

    const httpServer = servicesHttpServer.initExpressApp(); // Express service available without database connection
    serviceMongoActive = await servicesMongoData.databaseConnect();

    setUpRouteGateOpener();
    setUpRouteGateOpenerMOCK();

    setUpRouteDoorLightSwitch();

    setUpRouteOutgoingSensorsData();
    setUpRouteIncomingSensorsStream();

    setUpPeriodicAutoCleanUp();

    setUpPingGateHeartbeat();
    setUpPingDoorLightHeartbeat();

    const streamSourceUDP = new ServiceUdpMonitoring(httpServer);


})(); // END MAIN

