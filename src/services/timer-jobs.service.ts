import ping from 'ping';
import { DotenvParseOutput } from 'dotenv';
import { PeriodicTimer } from '../utils/periodic-timers';


import { DatabaseConnectorService } from './database-connector.service';
import { scanNetwork } from './device-detection.service';

const pingConfigs = {
    timeout: 2,
    numeric: false,
    extra: ['-i .5', '-c 3']
};
export class TimerJobsService
{

    private envData: DotenvParseOutput;
    private mongoConnection: DatabaseConnectorService;

    constructor(envData: DotenvParseOutput, mongoConnection: DatabaseConnectorService)
    {
        this.envData = envData;
        this.mongoConnection = mongoConnection;

        this.setUpPingGateHeartbeat();
        this.setUpPingDoorLightHeartbeat();

        this.setUpPeriodicAutoCleanUp();

        this.autoUpdateDevices();
    }

    setUpPingGateHeartbeat()
    {
        // MOVE to PeriodicTimers file
        const cfgs = pingConfigs;

        const localPeriodicTimer1 = new PeriodicTimer(() =>
        {
            if (this.envData.URL_HEARTBEAT_GATE_PING_ADDR)
                ping.promise.probe(this.envData.URL_HEARTBEAT_GATE_PING_ADDR, cfgs)
                    .then((_r: any) =>
                    {
                        // console.log(`[OK][TIMER-JOBS] Ping response: ${r.host} | ${r.numeric_host} | ${r.stddev} | ${r.alive}`);
                        // console.log(`\nRaw response:\n${r.output}`);
                    })
            else console.log('[ERR][TIMER-JOBS] GATE IP address not set');

            // TODO: add the ping results to the database

        }, 5000);
    }


    setUpPingDoorLightHeartbeat()
    {
        // MOVE to PeriodicTimers
        const cfgs = pingConfigs;

        const localPeriodicTimer1 = new PeriodicTimer(() =>
        {
            if (this.envData.URL_HEARTBEAT_DOOR_LIGHT_PING_ADDR)
                ping.promise.probe(this.envData.URL_HEARTBEAT_DOOR_LIGHT_PING_ADDR, cfgs)
                    .then((_r: any) =>
                    {
                        // console.log(`[OK][TIMER-JOBS] Ping response: ${r.host} | ${r.numeric_host} | ${r.stddev} | ${r.alive}`);
                        // console.log(`\nRaw response:\n${r.output}`);
                    })
            else console.log('[ERR][TIMER-JOBS] DOOR IP address not set');

            // TODO: add the ping results to the database

        }, 5000);
    }


    setUpPeriodicAutoCleanUp()
    {
        // MongoDB autoCleanUp of old data
        const localPeriodicTimer2 = new PeriodicTimer(() =>
        {
            if (this.mongoConnection.isConnected()) this.mongoConnection.removeSomeData();
        }, 24 * 3600 * 1000);    // clean-up job runs once every 24 hours
    }


    autoUpdateDevices()
    {
        // Periodic update of devices list based on MAC changes
        const localPeriodicTimer2 = new PeriodicTimer(async () =>
        {
            await scanNetwork(this.envData);
        }, 180 * 1000);    // clean-up job runs once every N * 1000 milliseconds
    }

}
