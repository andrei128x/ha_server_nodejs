import http from 'http';
import https from 'https';

// return JSON data as a promise for the specified URL, using POST(mostly) for body transmission of JSON data
export async function requestJsonPromise(url: string, data?: any): Promise<string>
{
    console.log('Http request started...');

    const postPayload = data?.data ? JSON.stringify(data?.data) : "";
    const size = Buffer.byteLength(postPayload);
    const httpMetdod = data?.method || 'GET';

    const engine = url.includes('https://') ? https : http; // work-around to make it work with either HTTP and HTTPS 

    // console.log(`---${url}  | ${JSON.stringify(data||{})} | ${size} | ${http_method}`); // debug request content

    const options = {
        method: httpMetdod,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': size
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
            let incomingData: string = '';

            // console.log(`STATUS: ${resp.statusCode}`);   // debug response
            // console.log(`HEADERS: ${JSON.stringify(resp.headers)}`);


            // A chunk of data has been recieved.
            resp.on('data', chunk =>
            {
                incomingData += chunk;
                // console.log(` >>>> data chunk: ${chunk}`);
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () =>
            {
                // console.log('[OK][HTTP] HTTP data incoming: ', data);
                resolve(incomingData);
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

        req.write(postPayload);
    });

    return tmpPromise;
}
