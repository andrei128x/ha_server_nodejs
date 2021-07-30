
/*
    PURPOSE:  module where various sensors are defined and their data is acquired
    TODO:     make connected sensors to  be plug-and-play: parse returned json and return a list compatible with model
*/

import express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import * as http from 'http';
import RateLimiter from 'express-rate-limit';


export class ExpressWebService
{

    PORT = 3000;

    app: express.Application;
    router: express.Router;
    httpListeningServer: http.Server;

    constructor()
    {
        this.app = express();
        this.router = express.Router();

        this.app.use(bodyParser.json());
        this.app.use(cors());
        this.app.use('/', this.router);
        this.app.disable('x-powered-by');

        const rateLimit = RateLimiter({
            windowMs: 10000, // 1 minute
            max: 1 // limit each IP to N requests per windowMs
        });

        this.app.use('*', rateLimit);

        // defining fallback route here
        this.app.get('*', (req, res) =>
        {
            res.sendStatus(404);
        });

        this.httpListeningServer = this.app.listen(this.PORT, () =>
        {
            console.log(`[HTTP] Listening on port ${this.PORT} ...`);
        });
    }
}
