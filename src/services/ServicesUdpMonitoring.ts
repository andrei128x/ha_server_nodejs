/*
  PURPOSE:  listen on UDP port 2001, process current gate state and forward computed state to WebSocket clients (browser UI)

  TODO:     periodic PING-PONG WebSocket, to detect and fix a broken channel
            reference at https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections

*/

// import section
import dgram = require('dgram');
const serverUDP = dgram.createSocket('udp4');

import fs = require('fs');
import https = require('https');
import WebSocket = require('ws');
import { Timestamp } from 'rxjs';
import { Server } from 'http';
import { EnvironmentMapper } from '../utils/environmentMapper';

// global state variable that keeps track of Mongo connection
const VARS = EnvironmentMapper.parseEnvironment();


export class ServiceUdpMonitoring
{
    counter: number = 0;
    // oldTime: number = Date.now();
    wss: WebSocket.Server = null;
    timeHistory: { [from: string]: number } = {}

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
        this.wss.on('connection', (ws) => this.connectionStarted(ws));
    }


    private listeningStarted(): () => void
    {
        return () =>
        {
            const address = serverUDP.address();
            console.log(`serverUDP listening ${address.address}:${address.port}`);
        };
    }


    private messageReceived(msg: string, rinfo: dgram.RemoteInfo)
    {
        // console.log(rinfo.address);
        // return;

        let raw: any = null;
        try
        {

            raw = JSON.parse(msg);

            let state: String;
            switch (raw.gateState)
            {
                case 1:
                    state = 'IDLE';
                    break;
                case 2:
                    state = 'DEBOUNCE';
                    break;
                case 3:
                    state = 'OPENING';
                    break;
                case 4:
                    state = 'OPENED';
                    break;
                case 5:
                    state = 'CLOSING';
                    break
                case 6:
                    state = 'CLOSED';
                    break;
                default: state = 'INIT';
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
            }

            const printMsg = `{ "C":${this.counter}, "A0":${vars.ADC0}, "A1":${vars.ADC1}, "avg0":${vars.avg0}, "avg1":${vars.avg1}, "read0":${vars.read0}, "read1":${vars.read1}, "stable":${vars.stable}, "state":${vars.state}, "RSSI":${vars.RSSI} }`;

            this.wss.clients.forEach(socket =>
            {
                if (rinfo.address == VARS.URL_HEARTBEAT_GATE_PING_ADDR) socket.send(`${state}`);
            })

            let elapsed: string | number;
            let timeNow: number = Date.now();

            elapsed = this.timeHistory[rinfo.address] ? timeNow - this.timeHistory[rinfo.address] : 'N/A';
            this.timeHistory[rinfo.address] = timeNow;

            console.log(`[RX]: ${printMsg} | ${(state as String).padStart(8, ' ')} | delta(ms): ${elapsed} | ${rinfo.address}`);

            // this.oldTime = timeNow;
            // this.timeHistory['from']

            // serverUDP.send(printMsg, 2001, '192.168.100.32');

            this.counter++;
        }
        catch (err)
        {
            console.log(`\n${err}: ${msg} \n`);
        }

    }


    private connectionStarted(ws: WebSocket)
    {
        ws.on('message', function incoming(message)
        {
            console.log('received: %s', message);
        });
    }
}