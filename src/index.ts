/*
  PURPOSE:  App that gathers sensor data and adds it to a MongoDB database
  todo:     use UDP protocol
  todo:     periodic query sensors for data - done

*/

// import section
import { IEnvVariable } from './interfaces/interfaces';

import { scanNetwork } from './services/DeviceDetectionService';
import { ServiceUdpMonitoring } from './services/UdpMonitoring';

import { EnvironmentMapper } from './utils/environmentMapper';
import { setConsole } from './utils/console_util';

import { Jobs } from './services/CronJobsService';
const envVars:IEnvVariable = EnvironmentMapper.parseEnvironment();


// [ START APP HERE - entrypoint ]
(async function mainEntryPointHere()
{
    setConsole();

    console.log('\n');

    await scanNetwork(envVars);    // detect local devices based on their MAC address, and configure their specific APIs
    
    const httpServer = await Jobs.init(envVars); // Express service available without database connection

    const streamSourceUDP = new ServiceUdpMonitoring(httpServer);


})();
// [ END APP HERE ]

