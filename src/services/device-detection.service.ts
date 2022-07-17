import arpscan from "arpscan/promise";
import { CONFIG_DATA } from "../config/config";
import { IAppData, IDetectionDataARP, IDeviceDefinition, IDeviceType } from "../interfaces/interfaces";
import { TempSensor } from "../routes/devices/temp-sensor";

const options = {
    command: '/usr/sbin/arp-scan',
    args: ['-l'],
    interface: 'eth0',
    // parser: plm,
    sudo: false
}

let scannedDeviceListRaw: IDetectionDataARP[] = [];
let scannedDeviceListByMAC: { [mac: string]: IDetectionDataARP } = {};

export async function scanNetwork(env: IAppData): Promise<void>
{
    try
    {
        scannedDeviceListRaw = await arpscan(options);    // use the 'arp-scan' Linux tool to scan for network devices

        scannedDeviceListRaw.forEach((element: any) =>
        {
            if (element.vendor?.includes('Espressif'))
            {
                let mac: string = element.mac;
                scannedDeviceListByMAC[mac] = element;
                updateEnvironmentData(env.VARS, element);
            }
        });

        console.log(scannedDeviceListRaw);
        console.log(scannedDeviceListByMAC.length);
    }
    catch (err)
    {
        console.log(err);
    }

    env.detectedDevicesARP = scannedDeviceListRaw;
}

function updateEnvironmentData(envData: any, element: any)
{

    console.log(`   found device: ${element.mac}`);

    // set up gate ip 
    if (element.mac == envData.URL_HEARTBEAT_GATE_PING_MAC)
    {
        envData.URL_HEARTBEAT_GATE_PING_ADDR = element.ip;
        envData.URL_DEVICE_GATE_OPENER = `http://${element.ip}/servo/click`;

        console.log(`GATE is at IP: ${envData.URL_HEARTBEAT_GATE_PING_ADDR}\n`);
    }

    // set up light ip 
    if (element.mac == envData.URL_HEARTBEAT_DOOR_LIGHT_PING_MAC)
    {
        envData.URL_HEARTBEAT_DOOR_LIGHT_PING_ADDR = element.ip;
        envData.URL_DEVICE_LIGHT_SWITCH = `http://${element.ip}:8081/zeroconf/switch`;
        envData.URL_DEVICE_LIGHT_INFO = `http://${element.ip}:8081/zeroconf/info`;

        console.log(`LIGHT is at IP: ${envData.URL_HEARTBEAT_DOOR_LIGHT_PING_ADDR}\n`);
    }

    // set up temperature sensor
    if (element.mac == envData.URL_HEARTBEAT_TEMPERATURE_PING_MAC)
    {
        envData.URL_HEARTBEAT_TEMPERATURE_PING_ADDR = element.ip;
        envData.URL_DEVICE_TEMP_SENSOR = `http://${element.ip}/info.json`

        console.log(`TEMPERATURE sensor is at IP: ${envData.URL_HEARTBEAT_TEMPERATURE_PING_ADDR}\n`);
    }

}
