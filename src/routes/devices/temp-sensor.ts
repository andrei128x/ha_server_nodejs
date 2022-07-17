import { IDeviceDefinition } from "../../interfaces/interfaces";

export class TempSensor
{
    constructor(device: IDeviceDefinition)
    {
        if (device.addressIP)
        {
            console.log(`${device.addressIP}     ==================    ${device.items.URL_DEVICE_QUERY}` );
            device.items.URL_DEVICE_QUERY = device.items.URL_DEVICE_QUERY?.replace('<detected_ip>', device.addressIP);

            console.log(`xxxxxxxxxxxxxxxxxxxxxxxxxxx ${JSON.stringify(device, null, 4)}`);
        }
    }


    
    async setUpRouteOutgoingSensorsData()
    {
        const apiLimiter = rateLimit({
            windowMs: 60 * 1000, // 1 minut
            max: 2
        });

        // TODO : Analyze the possibility to replace the POLLING API with realtime UDP communication
        this.httpServer.router.get('/api/temperature', apiLimiter, async (req: Request, res: any, next: any) =>
        {
            try
            {
                const data = await this.mongoConnection.findSomeDataPromise('senzor_pod', 'temperature');
                // console.log(`[OK][INDEX] Got database response: ${data} items`);

                const tempData = data.map((x: ISensorModel) => ` "${x.property_value}"`);
                const timestampData = data.map((x: ISensorModel) => `"${(x.timestamp === undefined ? '?' : x.timestamp)}"`);

                res.status(200).send(JSON.parse(
                    `{"data": [${tempData}],\n\n "times": [${timestampData}]}`
                ));
            }
            catch (err)
            {
                console.log(`[ERROR][INDEX] Setting up router reported: ${err}`);
            }
        });
    }


    async setUpRouteIncomingSensorsStream()
    {
        // TODO : MOVE to specific module file !!!
        console.log(`Observable URL ${this.envData.URL_DEVICE_TEMP_SENSOR}`);
        
        createJsonDataObservable(this.envData.URL_DEVICE_TEMP_SENSOR) // observable generates PERIODIC data
            .subscribe(
                (data: ISensorData[]) =>
                {
                    if (this.envData.serviceMongoActive)
                        this.mongoConnection.insertSomeDataPromise(data);
                    else
                        console.log('[ERROR][INDEX] Error at insert: database connection is NOT active');
                },
                (err: any) =>
                {
                    console.log('[ERROR][INDEX] HTTP Observer connection error: ', err);
                });
    }








}
