import { IDeviceDefinition } from "../interfaces/interfaces";

export const config: IDeviceDefinition[] =
    [
        {
            deviceName: "gate",
            mac_address: "84:F3:EB:EE:47:46",
            items: {
                heartbeat_endpoint: '$address$',
                URL_DEVICE_GATE_OPENER: 'http://$address$/servo/click'      // this will be replaced within the initialization function
            },

            handler: null
        },
        {
            deviceName: "door light",
            mac_address: "C8:2B:96:E9:5C:43",
            items: {
                heartbeat_endpoint: "192.168.1.254",
                URL_DEVICE_LIGHT_SWITCH: 'http://$address$:8081/zeroconf/switch',
                URL_DEVICE_LIGHT_INFO: `http://$address$:8081/zeroconf/info`,
            },
            handler: null
        }

    ]
