/*
  PURPOSE:  App that gathers sensor data and adds it to a MongoDB database
  todo:     use UDP protocol
  todo:     periodic query sensors for data - done

*/

// import section
import { DotenvParseOutput } from 'dotenv';
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
  VARS: DotenvParseOutput = {};
  httpServer!: ExpressWebService;
  databaseMongoService!: DatabaseConnectorService;
  routeManager!: RouteManager;


  constructor()
  {
    setConsole();
    console.log('\n');

    this.initAsync();
  }

  private async initAsync()
  {
    console.log('starting EnvironmentMapper...');    
    this.VARS = await new EnvironmentMapper().envData;
    
    console.log('scanning network for devices ...');    
    await scanNetwork(this.VARS); // detect local devices based on their MAC address, and configure their specific APIs
    
    console.log('starting ExpressWebService...');    
    this.httpServer = new ExpressWebService(); // Express service available without database connection
    this.databaseMongoService = new DatabaseConnectorService(this.VARS);

    console.log('starting RouteManager...');    
    this.routeManager = new RouteManager(this.VARS, this.httpServer, this.databaseMongoService);
    
    console.log('starting TimerJobsService...');    
    const httpServer = new TimerJobsService(this.VARS, this.databaseMongoService); // Express service available without database connection
    
    console.log('starting UdpMonitoringService...');    
    const streamSourceUDP = new UdpMonitoringService(this.VARS, this.httpServer.httpListeningServer);
  }
}


// [ START APP HERE - entrypoint ]
// tslint:disable-next-line: no-unused-expression
new WebApp();
// [ END APP HERE ]

