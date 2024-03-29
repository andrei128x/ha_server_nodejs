/**
 * @comment empty for now
 */
import { DotenvParseOutput } from 'dotenv';
import { ISensorData } from '../interfaces/interfaces';
import { ISensorModel } from '../models/mongo.model';

import rateLimit from 'express-rate-limit';

import { requestJsonPromise } from '../utils/http-utils';
import { ExpressWebService } from '../services/express-web.service';
import { DatabaseConnectorService } from '../services/database-connector.service';
import { createJsonDataObservable } from '../services/sensors-connector.service';


type RequestParams = Request & { params: { switchState: 'on' | 'off' | 'state' } };

export class RouteManager
{
    private httpServer: ExpressWebService;
    private mongoConnection: DatabaseConnectorService;
    private envData: DotenvParseOutput;

    constructor(envData: DotenvParseOutput, httpServer: ExpressWebService, mongoConnection: DatabaseConnectorService)
    {
        this.envData = envData;
        this.httpServer = httpServer;
        this.mongoConnection = mongoConnection;

        this.setUpRouteGateOpener();
        this.setUpRouteGateOpenerMOCK();

        this.setUpRouteDoorLightSwitch();

    }


    async setUpRouteGateOpener()
    {
        // MOVE TO ROUTES file !!!
        // forward request to open the gate to the specific IoT device
        this.httpServer.router.get('/api/click', async (req: Request, res: any, next: any) =>
        {
            try
            {
                // let data = await httpServer.getJsonPromise(URL_DEVICE_GATE_OPENER_MOCK) // testing one
                const data = await requestJsonPromise(this.envData.URL_DEVICE_GATE_OPENER); // real one

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


    async setUpRouteGateOpenerMOCK()
    {
        // MOVE to ROUTES file !!!
        // forward request to open the gate to the specific IoT device
        this.httpServer.router.get('/api/click_test', async (req: Request, res: any, next: any) =>
        {
            try
            {

                const wirePusherURL = `https://wirepusher.com/send?id=Wba8mpgaR&title=Gate Event&message=${new Date().toLocaleTimeString()}&type=YourCustomType&message_id=${Date.now()}`;
                console.log(wirePusherURL);

                const data = await requestJsonPromise(this.envData.URL_DEVICE_GATE_OPENER_MOCK); // testing one
                // const data = await httpServer.getJsonPromise(VARS.URL_DEVICE_GATE_OPENER_MOCK); // real one

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


    async setUpRouteDoorLightSwitch()
    {
        const SWITCH_DEFAULT_STATE = 'unknown';
        let currentState: string = SWITCH_DEFAULT_STATE;



        // TODO : MOVE to ROUTES file !!!
        // forward request to open the gate to the specific IoT device
        this.httpServer.router.get('/api/door_switch/:switchState', async (req: RequestParams, res: any, next: any) =>
        {
            try
            {

                let requestedState = req.params.switchState;

                if (requestedState === 'state')
                {
                    // res.contentType = 'application/json';
                    const payload: { data: {} } = {
                        'data': {}
                    };

                    const data = await requestJsonPromise(this.envData.URL_DEVICE_LIGHT_INFO, { data: payload, method: 'POST' });
                    console.log(`[OK][INDEX] Light switch button responded: ${data}`);

                    currentState = JSON.parse(data).data.switch || SWITCH_DEFAULT_STATE;

                    res.json({ response: '[OK]', state: currentState });
                }
                else
                {
                    requestedState = requestedState == 'on' ? 'on' : 'off';

                    const payload: { data: { switch: string } } = {
                        'data': {
                            'switch': requestedState
                        }
                    };

                    const data = await requestJsonPromise(this.envData.URL_DEVICE_LIGHT_SWITCH, { data: payload, method: 'POST' });

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
}
