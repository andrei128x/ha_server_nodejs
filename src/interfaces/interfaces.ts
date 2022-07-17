import { DotenvParseOutput } from "dotenv";
import { TempSensor } from "../routes/devices/temp-sensor";
import { RouteManager } from "../routes/route-manager";
import { DatabaseConnectorService } from "../services/database-connector.service";
import { ExpressWebService } from "../services/express-web.service";

export type IEnvList = { VARS: DotenvParseOutput };


export function IsEnvList(item: any): item is DotenvParseOutput
{
    return (item as DotenvParseOutput) && typeof (item as DotenvParseOutput) === 'object';
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

export interface IDetectionDataARP
{
    ip: string;
    mac: string;
    vendor: string;
    timestamp: number;
}

export enum IDeviceType
{
    GATE = 'GATE',
    LIGHT_SONOFF = 'LIGHT_SONOFF',
    TEMPERATURE = 'TEMPERATURE'
}

export interface IDeviceItem
{
    [itemName: string]: string;
}

export interface IDeviceHandler
{
    name: TempSensor;
}

export interface IDeviceDefinition  //TODO - define elements that need to handle this device
{
    deviceType: IDeviceType;

    displayName: string;

    addressMAC: string;
    addressIP?: string;

    heartbeatPeriod?: number;

    scanDetectionData?: IDetectionDataARP;

    items: IDeviceItem;
    handler: ((_: unknown[]) => unknown) | null;    //[x] - forgot original purpose; I presume handler function or class
}


export interface IAppData
{
  VARS: DotenvParseOutput;
  httpServer?: ExpressWebService;
  databaseMongoService?: DatabaseConnectorService;
  routeManager?: RouteManager;
  detectedDevicesARP?: IDetectionDataARP[];
}

