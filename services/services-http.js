
/*
    PURPOSE:  module where various sensors are defined and their data is acquired
    TODO:     make connected sensors to  be plug-and-play: parse returned json and return a list compatible with model
*/

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = new require('http');

const app = express();
const router = express.Router();

const PORT = 3000;


function initExpressApp()
{
    app.use(bodyParser.json());
    app.use(cors());
    app.use('/', router);
    app.disable('x-powered-by');

    // defining fallback route here
    app.get('*', function (req, res)
    {
        res.sendStatus(404);
    });

    app.listen(PORT, function ()
    {
        console.log(`[HTTP] Listening on port ${PORT} ...`);
    });
}



// return JSON data as a promise for the specified URL
function getJsonPromise(url)
{
    // console.log('Http request started...');
    const tmpPromise = new Promise((resolve, reject) =>
    {
        console.log('.');

        http.get(url, (resp) =>
        {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) =>
            {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () =>
            {
                // console.log('[OK][HTTP] HTTP data incoming: ', data);
                resolve(data);
            });
        }).on('error', (err) =>
        {
            console.log('[ERROR][HTTP] HTTP_GET error: ' + err);
            reject(err);
        }).setTimeout(5000, () =>
        {
            console.log('[ERROR][HTTP] Timeout error');
            reject('ERR_TIMEOUT');
        });
    });

    return tmpPromise;
}

module.exports = {
    initExpressApp,
    router,
    getJsonPromise
};
