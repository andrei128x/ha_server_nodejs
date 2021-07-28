
/*
    PURPOSE:  module where various sensors are defined and their data is acquired
    TODO:     make connected sensors to  be plug-and-play: parse returned json and return a list compatible with model
*/

import express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import * as http from 'http';
import * as https from 'https';
import RateLimiter from 'express-rate-limit';


export class HttpUtilities
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

    // return JSON data as a promise for the specified URL, using POST(mostly) for body transmission of JSON data
    requestJsonPromise(url: string, data?: any): Promise<string>
    {
        console.log('Http request started...');

        const post_payload = data?.data ? JSON.stringify(data?.data) : "";
        const size = Buffer.byteLength(post_payload);
        const http_method = data?.method || 'GET';

        const engine = url.includes('https://') ? https : http; // work-around to make it work with either HTTP and HTTPS 

        // console.log(`---${url}  | ${JSON.stringify(data||{})} | ${size} | ${http_method}`); // debug request content

        let options = {
            method: http_method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': size,
            }
        }

        /**
         * @tmpPromise Promise<JSON>
         */
        const tmpPromise = new Promise<string>((resolve, reject) =>
        {
            process.stdout.write('[HTTP]');

            const req = engine.request(url, options, resp =>
            {
                let data: string = '';

                // console.log(`STATUS: ${resp.statusCode}`);   // debug response
                // console.log(`HEADERS: ${JSON.stringify(resp.headers)}`);


                // A chunk of data has been recieved.
                resp.on('data', chunk =>
                {
                    data += chunk;
                    // console.log(` >>>> data chunk: ${chunk}`);
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () =>
                {
                    // console.log('[OK][HTTP] HTTP data incoming: ', data);
                    resolve(data);
                });
            }).on('error', err =>
            {
                console.log(`[ERROR][HTTP] HTTP_GET error: ${err}`);
                // req.abort();
                reject(err);
            }).setTimeout(1000, () =>
            {
                console.log('[ERROR][HTTP] Timeout error');
                // req.abort();
                reject('ERR_TIMEOUT');
            });

            // console.log(`>>>> ${post_payload}`);

            req.write(post_payload);
        });

        return tmpPromise;
    }

}


// return JSON data as a promise for the specified URL
async function getJsonPromise(url: string): Promise<string>
{
    console.log('Http GET started...');
    throw ('Function deprecated');

    /**
     * @tmpPromise Promise<JSON>
     */
    const tmpPromise = new Promise<string>((resolve, reject) =>
    {
        process.stdout.write('[HTTP]');

        const engine = url.includes('https://') ? https : http; // work-around to make it work with either HTTP and HTTPS 

        engine.get(url, resp =>
        {
            let data: string = '';

            // A chunk of data has been recieved.
            resp.on('data', chunk =>
            {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () =>
            {
                // console.log('[OK][HTTP] HTTP data incoming: ', data);
                resolve(data);
            });
        }).on('error', err =>
        {
            console.log(`[ERROR][HTTP] HTTP_GET error: ${err}`);
            reject(err);
        }).setTimeout(1000, () =>
        {
            console.log('[ERROR][HTTP] Timeout error');
            reject('ERR_TIMEOUT');
        });
    });

    return await tmpPromise;
}
