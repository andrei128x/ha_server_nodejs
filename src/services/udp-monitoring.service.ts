/*
  PURPOSE:  listen on UDP port 2001, process current gate state and forward computed state to WebSocket clients (browser UI)

  TODO:     periodic PING-PONG WebSocket, to detect and fix a broken channel
            reference at https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections

*/

// import section
import * as dgram from 'dgram';

import * as fs from 'fs';
import * as https from 'https';
import WebSocket from 'ws';
import { Server } from 'http';
import { EnvironmentMapper } from '../utils/environment-mapper';
import { requestJsonPromise } from '../utils/http-utils';

// global state variable that keeps track of Mongo connection
const VARS = EnvironmentMapper.parseEnvironment();
const serverUDP = dgram.createSocket('udp4');


export class UdpMonitoringService
{
    counter: number = 0;
    // oldTime: number = Date.now();
    wss: WebSocket.Server;
    timeHistory: { [from: string]: number } = {}
    currentState: String = 'NOT INITIALIZED';
    data = '00000';

    constructor(serverHttp: Server)
    {
        const httpsServer = https.createServer({
            cert: fs.readFileSync('/home/focus7/certbot/cert1.pem'),
            key: fs.readFileSync('/home/focus7/certbot/privkey1.pem')
        });

        serverUDP.on('error', (err) =>
        {
            console.log(`serverUDP error:\n${err.stack}`);
            serverUDP.close();
        });

        serverUDP.on('listening', this.listeningStarted());
        serverUDP.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => this.messageReceived(msg.toString(), rinfo));

        serverUDP.bind(2001);

        this.wss = new WebSocket.Server({ server: serverHttp }, () => { console.log('works !!!') });
        this.wss.on('connection', (ws:WebSocket) => this.wsConnectionStarted(ws));
    }


    private listeningStarted(): () => void
    {
        return () =>
        {
            const address = serverUDP.address();
            console.log(`serverUDP listening ${address.address}:${address.port}`);
        };
    }


    private async messageReceived(msg: string, rinfo: dgram.RemoteInfo)
    {
        // console.log(rinfo.address);
        // return;

        let raw: any = null;
        try
        {

            raw = JSON.parse(msg);
            // console.log(`${msg}`);

            switch (raw.gateState)
            {
                case 1:
                    this.currentState = 'IDLE';
                    break;
                case 2:
                    this.currentState = 'DEBOUNCE'; // TODO - add timer to count how long does it take to open the gate and to send it directly via websocket !!
                    break;
                case 3:
                    if (this.currentState == 'DEBOUNCE')
                    {
                        const wirePusherURL = `https://wirepusher.com/send?id=Wba8mpgaR&title=Gate Opening&message=${new Date().toLocaleTimeString('en-US')}&type=YourCustomType&message_id=${Date.now()}`;
                        console.log(wirePusherURL); // debug WIREPUSHER service

                        await requestJsonPromise(wirePusherURL);
                    }
                    this.currentState = 'OPENING';
                    break;
                case 4:
                    this.currentState = 'OPENED';
                    break;
                case 5:
                    if (this.currentState == 'DEBOUNCE')
                    {
                        const wirePusherURL = `https://wirepusher.com/send?id=Wba8mpgaR&title=Gate Closing&message=${new Date().toLocaleTimeString('en-US')}&type=YourCustomType&message_id=${Date.now()}`;
                        // console.log(wirePusherURL); //debug WIREPUSHER service

                        await requestJsonPromise(wirePusherURL);
                    }
                    this.currentState = 'CLOSING';
                    break;
                case 6:
                    this.currentState = 'CLOSED';
                    break;
                default: this.currentState = 'INIT';
            }

            const vars =
            {
                "ADC0": raw.ADC0.toString().padStart(8, " ")
                , "ADC1": raw.ADC1.toString().padStart(8, " ")
                , "avg0": raw.avg0.toString().padStart(8, " ")
                , "avg1": raw.avg1.toString().padStart(8, " ")
                , "read0": raw.read0.toString().padStart(8, " ")
                , "read1": raw.read1.toString().padStart(8, " ")
                , "stable": raw.stableSig.toString().padStart(2, " ")
                , "state": raw.gateState.toString().padStart(2, " ")
                , "RSSI": raw.RSSI.toString().padStart(4, " ")
            };

            const printMsg = `{ "C":${this.counter}, "A0":${vars.ADC0}, "A1":${vars.ADC1}, "avg0":${vars.avg0}, "avg1":${vars.avg1}, "read0":${vars.read0}, "read1":${vars.read1}, "stable":${vars.stable}, "state":${vars.state}, "RSSI":${vars.RSSI} }`;

            this.wss.clients.forEach(socket =>
            {
                if (rinfo.address == VARS.URL_HEARTBEAT_GATE_PING_ADDR) socket.send(`${this.currentState}`);
            });

            let elapsed: string | number;
            let timeNow: number = Date.now();

            elapsed = this.timeHistory[rinfo.address] ? timeNow - this.timeHistory[rinfo.address] : 'N/A';
            this.timeHistory[rinfo.address] = timeNow;

            console.log(`[UDP][RX]: ${printMsg} | ${(this.currentState as String).padStart(8, ' ')} | delta(ms): ${elapsed} | ${rinfo.address}`);

            // this.oldTime = timeNow;
            // this.timeHistory['from']

            // serverUDP.send(printMsg, 2001, '192.168.100.32');

            this.arduinoUdpFun();

            this.counter++;
        }
        catch (err)
        {
            console.log(`\n${err}: ${msg} \n`);
        }

    }

    private arduinoUdpFun()
    {
        const index = Math.floor(Math.random() * 5);
        const val = Math.floor(Math.random() * 10);

        this.data = this.data.substring(0, index) + val + this.data.substring(index + 1);

        // serverUDP.send(this.data, 8888, '192.168.1.39'); // fun with Arduino - test
        serverUDP.send(String(Math.floor(Math.random() * 10000)).padStart(4, '0'), 8888, '192.168.1.48'); // fun with Arduino - test
    }

    private wsConnectionStarted(ws: WebSocket)
    {
        ws.on('message', function incoming(message)
        {
            console.log(`received websocket: '${message}' from ${ws}`);
        });
    }
}
