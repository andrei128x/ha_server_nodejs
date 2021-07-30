const arpscan = require('arpscan/promise');
// import arpScanner from "arpscan/promise";

const options = {
    command: '/usr/sbin/arp-scan',
    args: ['-l'],
    interface: 'eth0',
    // parser: plm,
    sudo: false
}

let deviceList = [];
let newList = [];

export async function scanNetwork(env: unknown)
{
    try
    {
        // deviceList = await arpscan.arpScanner(   options); // use the 'arp-scan' Linux tool to scan for network devices
        deviceList = await arpscan(options);

        deviceList.forEach((element: any) =>
        {
            if (element.vendor.includes('Espressif'))
            {
                newList[element.mac] = element;

                updateEnvironmentData(env, element);
            }
        });

        // console.log(deviceList);
        // console.log(newList);
        // console.log(newList.length);
    }
    catch (err)
    {
        console.log(err);
    }
}

function updateEnvironmentData(envData: any, element: any)
{

    console.log(`   found device: ${element.mac}`);

    // set up gate ip 
    if (element.mac == envData.URL_HEARTBEAT_GATE_PING_MAC)
    {
        envData.URL_HEARTBEAT_GATE_PING_ADDR = element.ip;
        envData.URL_DEVICE_GATE_OPENER = `http://${element.ip}/servo/click`;

        console.log(`GATE is at IP: ${envData.URL_HEARTBEAT_GATE_PING_ADDR}`)
    }

    // set up light ip 
    if (element.mac == envData.URL_HEARTBEAT_DOOR_LIGHT_PING_MAC)
    {
        envData.URL_HEARTBEAT_DOOR_LIGHT_PING_ADDR = element.ip;
        envData.URL_DEVICE_LIGHT_SWITCH = `http://${element.ip}:8081/zeroconf/switch`;
        envData.URL_DEVICE_LIGHT_INFO = `http://${element.ip}:8081/zeroconf/info`;

        console.log(`LIGHT is at IP: ${envData.URL_HEARTBEAT_DOOR_LIGHT_PING_ADDR}`)
    }

    // set up temperature sensor
    if (element.mac == envData.URL_HEARTBEAT_TEMPERATURE_PING_MAC)
    {
        envData.URL_HEARTBEAT_TEMPERATURE_PING_ADDR = element.ip;
        envData.URL_DEVICE_TEMP_SENSOR = `http://${element.ip}/info.json`

        console.log(`TEMPERATURE sensor is at IP: ${envData.URL_DEVICE_TEMP_SENSOR}`)
    }

}