import { IAppData, IDetectionDataARP } from "../interfaces/interfaces";
import fs from 'fs';
import * as child from 'child_process';

let scannedDeviceListRaw: IDetectionDataARP[] = [];
let scannedDeviceListByMAC: { [mac: string]: IDetectionDataARP } = {};

export async function scanNetwork(env: IAppData): Promise<void>
{
    env.detectedDevicesARP = scannedDeviceListRaw;

    await pingAllNetwork();
    updateDeviceLists(env);

    // console.log(scannedDeviceListRaw);
    console.log(`Total devices in list: ${scannedDeviceListRaw.length}`);
}

function updateDeviceLists(env: IAppData): void
{
    const procFile: string[] = fs.readFileSync('/proc/net/arp', { encoding: 'utf8' }).split('\n');

    procFile.forEach(line =>
    {
        // console.log(line);
        const lineParts: string[] = line.split(/[\s]+/);

        // console.log(lineParts);
        if (lineParts.length == 6)
        {
            const device: IDetectionDataARP = {
                ip: lineParts[0],
                mac: lineParts[3].toUpperCase(),
                vendor: 'Espressif',
                timestamp: 0
            };

            /* if MAC is valid and it does not already exist in the list */
            if ((lineParts[2] == '0x2') && (!scannedDeviceListByMAC[device.mac]))
            {
                scannedDeviceListRaw.push(device);
                scannedDeviceListByMAC[device.mac] = device;
                updateEnvironmentData(env.VARS, device);

            }
        };
    });
}

async function pingAllNetwork(): Promise<void>
{
    const nmapEvent = child.spawn('nmap', ['-sn', '-n', '192.168.1.0/24']);

    nmapEvent.stdout.on('close', (code: number) =>
    {
        if (code == 0)
            return Promise.resolve();
        else
            return Promise.reject('[DETECTION] Spawn error');
    });
}

function updateEnvironmentData(envData: any, element: any)
{

    process.stdout.write(`   found device: ${element.mac}`);

    // set up gate ip 
    if (element.mac == envData.URL_HEARTBEAT_GATE_PING_MAC)
    {
        envData.URL_HEARTBEAT_GATE_PING_ADDR = element.ip;
        envData.URL_DEVICE_GATE_OPENER = `http://${element.ip}/servo/click`;

        console.log(` - GATE is at IP: ${envData.URL_HEARTBEAT_GATE_PING_ADDR}\n`);
    }

    // set up light ip 
    if (element.mac == envData.URL_HEARTBEAT_DOOR_LIGHT_PING_MAC)
    {
        envData.URL_HEARTBEAT_DOOR_LIGHT_PING_ADDR = element.ip;
        envData.URL_DEVICE_LIGHT_SWITCH = `http://${element.ip}:8081/zeroconf/switch`;
        envData.URL_DEVICE_LIGHT_INFO = `http://${element.ip}:8081/zeroconf/info`;

        console.log(` - LIGHT is at IP: ${envData.URL_HEARTBEAT_DOOR_LIGHT_PING_ADDR}\n`);
    }

    // set up temperature sensor
    if (element.mac == envData.URL_HEARTBEAT_TEMPERATURE_PING_MAC)
    {
        envData.URL_HEARTBEAT_TEMPERATURE_PING_ADDR = element.ip;
        envData.URL_DEVICE_TEMP_SENSOR = `http://${element.ip}/info.json`

        console.log(` - TEMPERATURE sensor is at IP: ${envData.URL_HEARTBEAT_TEMPERATURE_PING_ADDR}\n`);
    }

    console.log();    
}
