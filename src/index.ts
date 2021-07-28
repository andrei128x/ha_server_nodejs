/*
  PURPOSE:  App that gathers sensor data and adds it to a MongoDB database
  todo:     use UDP protocol
  todo:     periodic query sensors for data - done

*/

// import section
import { IEnvVariable } from './interfaces/interfaces';

import { scanNetwork } from './services/DeviceDetectionService';

import { HttpUtilities } from './services/HttpUtilities';
import { DatabaseConnectorService } from './services/DatabaseConnectorService';

import { ServiceUdpMonitoring } from './services/UdpMonitoring';

import { EnvironmentMapper } from './utils/environmentMapper';
import { setConsole } from './utils/console_util';

import { Jobs } from './services/CronJobsService';

class WebApp
{

  VARS: IEnvVariable;
  httpServer: HttpUtilities | null = null; // Express service available without database connection
  databaseMongoService: DatabaseConnectorService; // global state variable that keeps track of Mongo connection



  constructor()
  {
    setConsole();
    console.log('\n');

    this.VARS = EnvironmentMapper.parseEnvironment();
    scanNetwork(this.VARS);    // detect local devices based on their MAC address, and configure their specific APIs

    this.httpServer = new HttpUtilities(); // Express service available without database connection
    this.databaseMongoService = new DatabaseConnectorService(this.VARS);


    const httpServer = Jobs.init(this.VARS); // Express service available without database connection

    const streamSourceUDP = new ServiceUdpMonitoring(this.httpServer.httpListeningServer);
  }
}

// [ START APP HERE - entrypoint ]
new WebApp();
// [ END APP HERE ]

