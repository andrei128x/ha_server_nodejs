import * as ping from 'ping';
import { IEnvVariable, ISensorData, IsEnvList } from '../interfaces/interfaces';
import { ISensorModel } from '../models/MongoModel';
import { CronJob } from '../models/CronJobModel';
import * as sensorsInterface from './SensorsConnectorService';
import { Request } from 'express';
import * as http from 'http';


import rateLimit from 'express-rate-limit';

export class Jobs
{

    static VARS: IEnvVariable;

    static async init(envData: IEnvVariable)
    {
        if (IsEnvList(envData))
        {
            Jobs.VARS = envData;


            Jobs.setUpRouteGateOpener();
            Jobs.setUpRouteGateOpenerMOCK();

            Jobs.setUpRouteDoorLightSwitch();

            Jobs.setUpRouteOutgoingSensorsData();
            Jobs.setUpRouteIncomingSensorsStream();

            Jobs.setUpPeriodicAutoCleanUp();

            Jobs.setUpPingGateHeartbeat();
            Jobs.setUpPingDoorLightHeartbeat();
        }
        else 
        {
            throw (`ENV is empty`);
        }

        return Jobs.httpServer;

    }


}
