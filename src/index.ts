/*
  PURPOSE:  App that gathers sensor data and adds it to a MongoDB database
  todo:     use UDP protocol
  todo:     periodic query sensors for data - done

*/

// import section
import { scanNetwork } from './services/device-detection.service';

import { ExpressWebService } from './services/express-web.service';
import { DatabaseConnectorService } from './services/database-connector.service';

import { UdpMonitoringService } from './services/udp-monitoring.service';

import { EnvironmentMapper } from './utils/environment-mapper';
import { setConsole } from './utils/console-util';

import { TimerJobsService } from './services/timer-jobs.service';
import { RouteManager } from './routes/route-manager';
import { IAppData } from './interfaces/interfaces';

class WebApp
{
  appData!: IAppData;

  constructor()
  {
    setConsole();
    console.log('\n');

    this.initAsync();
  }

  private async initAsync()
  {
    console.log('starting EnvironmentMapper...');

    this.appData = { VARS: {} };
    this.appData.VARS = await new EnvironmentMapper().envData;

    // console.log(JSON.stringify(this.appData.VARS));

    console.log('scanning network for devices ...');
    await scanNetwork(this.appData); // detect local devices based on their MAC address, and configure their specific APIs

    console.log('starting ExpressWebService...');
    this.appData.httpServer = new ExpressWebService(); // Express service available without database connection
    this.appData.databaseMongoService = new DatabaseConnectorService(this.appData.VARS);

    console.log('starting RouteManager...');
    this.appData.routeManager = new RouteManager(this.appData.VARS, this.appData.httpServer, this.appData.databaseMongoService);

    console.log('starting TimerJobsService...');
    const timerJobs = new TimerJobsService(this.appData); // list consisting of periodic jobs

    console.log('starting UdpMonitoringService...');
    const streamSourceUDP = new UdpMonitoringService(this.appData.VARS, this.appData.httpServer.httpListeningServer);
  }
}


// [ START APP HERE - entrypoint ]
// tslint:disable-next-line: no-unused-expression
new WebApp();
// [ END APP HERE ]
