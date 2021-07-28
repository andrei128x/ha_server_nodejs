export interface IEnvVariable
{
    [envParameter: string]: string;
}


export type IEnvList = { VARS: IEnvVariable };


export function IsEnvList(item: any): item is IEnvVariable
{
    return ((item as IEnvVariable)) && typeof (item as IEnvVariable) === 'object';
}


export interface ISensorData
{
    sensor_name: string;
    property_name: string;
    property_value: string;
    timestamp: string;
}


export interface ISensorRawData
{
    temperature: number;
    uptime: string;
    reset: string;
}

export interface IDeviceItem
{
    [itemName: string]: string;
}

export interface IDeviceHeartBeatItem
{
    heartbeat_endpoint: string;
    heartbeat_period?: number;
}

export interface IDeviceDefinition
{
    deviceName: string;
    mac_address: string;

    address?: string;

    heartbeat_address?: string;
    heartbeat_period?: number;

    items: IDeviceItem | IDeviceHeartBeatItem;
    handler: ((_: unknown[]) => unknown) | null;
}
