import ping from 'ping';
import { DotenvParseOutput } from 'dotenv';
import { CronJob } from '../models/cron-job.model';


import { DatabaseConnectorService } from './database-connector.service';

export class TimerJobsService
{

    envData: DotenvParseOutput;
    mongoConnection: DatabaseConnectorService;

    constructor(envData: DotenvParseOutput, mongoConnection: DatabaseConnectorService)
    {
        this.envData = envData;
        this.mongoConnection = mongoConnection;

        this.setUpPingGateHeartbeat();
        this.setUpPingDoorLightHeartbeat();

        this.setUpPeriodicAutoCleanUp();
    }

    setUpPingGateHeartbeat()
    {
        // MOVE to CronJobs file
        const cfgs = {
            timeout: 2,
            numeric: false,
            extra: ['-i .5', '-c 3']
        };

        const localCronJob1 = new CronJob(() =>
        {
            ping.promise.probe(this.envData.URL_HEARTBEAT_GATE_PING_ADDR, cfgs)
                .then((r: any) =>
                {
                    // console.log(`[OK][INDEX] Ping response: ${r.host} | ${r.numeric_host} | ${r.stddev} | ${r.alive}`);
                    // console.log(`\nRaw response:\n${r.output}`);
                });

            // TODO: add the ping results to the database

        }, 5000);
    }


    setUpPingDoorLightHeartbeat()
    {
        // MOVE to CronJobs
        const cfgs = {
            timeout: 2,
            numeric: false,
            extra: ['-i .5', '-c 3']
        };

        const localCronJob1 = new CronJob(() =>
        {
            ping.promise.probe(this.envData.URL_HEARTBEAT_DOOR_LIGHT_PING_ADDR, cfgs).then((r: any) =>
            {
                // console.log(`[OK][INDEX] Ping response: ${r.host} | ${r.numeric_host} | ${r.stddev} | ${r.alive}`);
                // console.log(`\nRaw response:\n${r.output}`);
            });

            // TODO: add the ping results to the database

        }, 5000);
    }


    setUpPeriodicAutoCleanUp()
    {
        // MongoDB autoCleanUp of old data
        const localCronJob2 = new CronJob(() =>
        {
            if (this.mongoConnection.connected) this.mongoConnection.removeSomeData();
        }, 24 * 3600 * 1000);    // clean-up job runs once every 24 hours
    }



}
