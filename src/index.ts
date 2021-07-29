/*
  PURPOSE:  App that gathers sensor data and adds it to a MongoDB database
  todo:     use UDP protocol
  todo:     periodic query sensors for data - done

*/

// import section
import { IEnvVariable } from './interfaces/interfaces';

import { scanNetwork } from './services/device-detection.service';

import { ExpressWebService } from './services/express-web.service';
import { DatabaseConnectorService } from './services/database-connector.service';

import { UdpMonitoringService } from './services/udp-monitoring.service';

import { EnvironmentMapper } from './utils/environment-mapper';
import { setConsole } from './utils/console-util';

import { TimerJobsService } from './services/timer-jobs.service';
import { RouteManager } from './routes/route-manager';

class WebApp
{
  VARS: IEnvVariable;
  httpServer: ExpressWebService | null = null; // Express service available without database connection
  databaseMongoService: DatabaseConnectorService; // global state variable that keeps track of Mongo connection
  routeManager: RouteManager;


  constructor()
  {
    setConsole();
    console.log('\n');

    this.VARS = EnvironmentMapper.parseEnvironment();
    scanNetwork(this.VARS);    // detect local devices based on their MAC address, and configure their specific APIs

    this.httpServer = new ExpressWebService(); // Express service available without database connection
    this.databaseMongoService = new DatabaseConnectorService(this.VARS);

    this.routeManager = new RouteManager(this.VARS, this.httpServer, this.databaseMongoService);

    const httpServer = new TimerJobsService(this.VARS, this.databaseMongoService); // Express service available without database connection

    const streamSourceUDP = new UdpMonitoringService(this.httpServer.httpListeningServer);
  }
}


// [ START APP HERE - entrypoint ]
// tslint:disable-next-line: no-unused-expression
new WebApp();
// [ END APP HERE ]

