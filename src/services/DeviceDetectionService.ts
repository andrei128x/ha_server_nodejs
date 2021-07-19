import * as arpScanner from 'arpscan/promise';

const options = {
    command: '/usr/sbin/arp-scan',
    args: ['-l'],
    interface: 'eth0',
    // parser: plm,
    sudo: false
}

// function onResult(data)
// {
//     console.log(`ARP results:\n ${data}`);
// }

// function onError(err)
// {
//     console.log(`ARP resolutions error:${err}`);
// }

let deviceList = [];
let newList = [];

export async function scanNetwork(env)
{
    try
    {
        deviceList = await arpScanner(options); // use the 'arp-scan' Linux tool to scan for network devices

        deviceList.forEach(element =>
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

function updateEnvironmentData(envData, element)
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

}