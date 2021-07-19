import * as ping from 'ping';
import { IEnvVariable, ISensorData } from '../interfaces/interfaces';
import { ISensorModel } from '../models/MongoModel';
import { CronJob } from '../models/CronJobModel';
import * as sensorsInterface from './SensorsConnector';
import { Request } from 'express';
import * as cors from 'cors';
import * as http from 'http';

import * as servicesHttpServer from './HttpUtilities';
import * as servicesMongoData from './DatabaseConnectorService';

export class Jobs
{

    static httpServer:http.Server|null = null; // Express service available without database connection
    static serviceMongoActive:Boolean = false; // global state variable that keeps track of Mongo connection
    static VARS:IEnvVariable|null = null;

    private constructor()
    {

    }

    static async init(envData:IEnvVariable)
    {
        Jobs.VARS = envData;

        Jobs.httpServer = await servicesHttpServer.initExpressApp(); // Express service available without database connection
        Jobs.serviceMongoActive = await servicesMongoData.databaseConnect();

        Jobs.setUpRouteGateOpener();
        Jobs.setUpRouteGateOpenerMOCK();
    
        Jobs.setUpRouteDoorLightSwitch();
    
        Jobs.setUpRouteOutgoingSensorsData();
        Jobs.setUpRouteIncomingSensorsStream();
    
        Jobs.setUpPeriodicAutoCleanUp();
    
        Jobs.setUpPingGateHeartbeat();
        Jobs.setUpPingDoorLightHeartbeat();


        return Jobs.httpServer;

    }

    static setUpRouteOutgoingSensorsData()
    {
        // TODO : Analyze the possibility to replace the POLLING API with realtime UDP communication
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


    static async setUpRouteIncomingSensorsStream()
    {
        // TODO : MOVE to specific module file !!!
        sensorsInterface
            .getJsonDataObservable(Jobs.VARS.URL_DEVICE_TEMP_SENSOR) // observable generates PERIODIC data
            .subscribe(
                (data: ISensorData[]) =>
                {
                    if (Jobs.serviceMongoActive)
                        servicesMongoData.insertSomeDataPromise(data);
                    else
                        console.log('[ERROR][INDEX] Error at insert: database connection is NOT active');
                },
                (err: any) =>
                {
                    console.log('[ERROR][INDEX] HTTP Observer connection error: ', err);
                });
    }


    static async setUpRouteGateOpener()
    {
        // MOVE TO ROUTES file !!!
        // forward request to open the gate to the specific IoT device
        servicesHttpServer.router.get('/api/click', async (req: Request, res: any, next: any) =>
        {
            try
            {
                // let data = await servicesHttpServer.getJsonPromise(URL_DEVICE_GATE_OPENER_MOCK) // testing one
                const data = await servicesHttpServer.getJsonPromise(Jobs.VARS.URL_DEVICE_GATE_OPENER); // real one

                console.log('[OK][INDEX] Servo button responded correctly');

                /* OLD WAY */
                // res.contentType = 'application/json';
                // setTimeout(() => { res.status(200).send({ response: '[OK]' }); }, 2000);

                /* NEW WAY */
                res.status(200).json({ response: '[OK]' });

            } catch (err)
            {
                // console.log('[ERROR][INDEX]Servo API did NOT respond correctly');
                // res.status(400).send({ response: '[FAIL]' });
                res.status(400).send({ response: `${err}` });
            }
        });
    }


    static async setUpRouteGateOpenerMOCK()
    {
        // MOVE to ROUTES file !!!
        // forward request to open the gate to the specific IoT device
        servicesHttpServer.router.get('/api/click_test', async (req: Request, res: any, next: any) =>
        {
            try
            {

                const wirePusherURL = `https://wirepusher.com/send?id=Wba8mpgaR&title=Gate Event&message=${new Date().toLocaleTimeString()}&type=YourCustomType&message_id=${Date.now()}`;
                console.log(wirePusherURL);

                const data = await servicesHttpServer.getJsonPromise(Jobs.VARS.URL_DEVICE_GATE_OPENER_MOCK) // testing one
                //const data = await servicesHttpServer.getJsonPromise(VARS.URL_DEVICE_GATE_OPENER_MOCK); // real one

                console.log('[OK][INDEX] MOCK Servo button responded correctly');
                res.contentType = 'application/json';
                // setTimeout(() => { res.status(200).send({ response: '[OK]' }); }, 2000);

                res.status(200).send({ response: '[OK]' });
            } catch (err)
            {
                // console.log('[ERROR][INDEX]Servo API did NOT respond correctly');
                // res.status(400).send({ response: '[FAIL]' });
                res.status(400).send({ response: `${err}` });
            }
        });
    }
    static async setUpRouteDoorLightSwitch()
    {
        const SWITCH_DEFAULT_STATE = 'unknown'
        let currentState: string = SWITCH_DEFAULT_STATE;

        // TODO : MOVE to ROUTES file !!!
        // forward request to open the gate to the specific IoT device
        servicesHttpServer.router.get('/api/door_switch/:switchState', async (req: Request, res: any, next: any) =>
        {
            try
            {

                let requestedState = req.params.switchState;

                if (requestedState === 'state')
                {
                    // res.contentType = 'application/json';
                    let payload: { data: {}; } = {
                        "data": {}
                    }

                    const data = await servicesHttpServer.requestJsonPromise(Jobs.VARS.URL_DEVICE_LIGHT_INFO, { data: payload, method: 'POST' });
                    console.log(`[OK][INDEX] Light switch button responded: ${data}`);

                    currentState = JSON.parse(data).data.switch || SWITCH_DEFAULT_STATE;

                    res.json({ response: '[OK]', state: currentState });
                }
                else
                {
                    requestedState = requestedState == 'on' ? 'on' : 'off';

                    let payload: { data: { switch: string; }; } = {
                        "data": {
                            "switch": requestedState
                        }
                    }

                    const data = await servicesHttpServer.requestJsonPromise(Jobs.VARS.URL_DEVICE_LIGHT_SWITCH, { data: payload, method: 'POST' });

                    console.log(`[OK][INDEX] Light switch button responded: ${data}`);
                    // res.contentType = 'application/json';
                    // setTimeout(() => { res.status(200).json({ response: '[OK]' }); }, 2000);
                    currentState = requestedState;
                    res.status(200).json({ response: '[OK]', state: currentState });
                }
            } catch (err)
            {
                console.log('[ERROR][INDEX] Light switch API did NOT respond correctly', err);
                // res.status(400).json({ response: '[FAIL]' });
                res.status(400).json({ response: '[FAIL]', state: SWITCH_DEFAULT_STATE });
            }
        });
    }


    static setUpPingGateHeartbeat()
    {
        // MOVE to CronJobs file
        const cfgs = {
            timeout: 2,
            numeric: false,
            extra: ['-i .5', '-c 3']
        };

        const localCronJob1 = new CronJob(() =>
        {
            ping.promise.probe(Jobs.VARS.URL_HEARTBEAT_GATE_PING_ADDR, cfgs).then((r: any) =>
            {
                // console.log(`[OK][INDEX] Ping response: ${r.host} | ${r.numeric_host} | ${r.stddev} | ${r.alive}`);
                // console.log(`\nRaw response:\n${r.output}`);
            });

            // TODO: add the ping results to the database

        }, 5000);
    }


    static setUpPingDoorLightHeartbeat()
    {
        // MOVE to CronJobs
        const cfgs = {
            timeout: 2,
            numeric: false,
            extra: ['-i .5', '-c 3']
        };

        const localCronJob1 = new CronJob(() =>
        {
            ping.promise.probe(Jobs.VARS.URL_HEARTBEAT_DOOR_LIGHT_PING_ADDR, cfgs).then((r: any) =>
            {
                // console.log(`[OK][INDEX] Ping response: ${r.host} | ${r.numeric_host} | ${r.stddev} | ${r.alive}`);
                // console.log(`\nRaw response:\n${r.output}`);
            });

            // TODO: add the ping results to the database

        }, 5000);
    }


    static setUpPeriodicAutoCleanUp()
    {
        // MongoDB autoCleanUp of old data
        const localCronJob2 = new CronJob(() =>
        {
            if (Jobs.serviceMongoActive) servicesMongoData.removeSomeData();
        }, 24 * 3600 * 1000);    // clean-up job runs once every 24 hours
    }

}
