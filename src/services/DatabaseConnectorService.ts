/*
    Purpose: module provides database operation services
    TODO:   select function based on property name
*/
import { IEnvVariable } from '../interfaces/interfaces';

// connect to MLAB.COM's account
import { connect as mongooseConnect } from 'mongoose';

import { sensorData } from '../models/MongoModel';
import { throwHere, logOthers } from '../utils/utils';


export class DatabaseConnectorService
{
    mongoServer: String;

    constructor(envData: IEnvVariable)
    {
        this.mongoServer = envData?.URL_MONGO_SERVER;

        this.databaseConnect();
    }

    // connect to the MongoDB database
    databaseConnect()
    {
        let connected;

        try
        {
            if (this.mongoServer)
                throwHere();

            await mongooseConnect
                (
                    this.mongoServer
                    , { useNewUrlParser: true, useUnifiedTopology: true }
                    , err =>
                    {
                        if (err) 
                        {
                            console.log(`[DB][CONNECT] callback result: ${err}`);
                            // console.log(`[DB][CONNECT] callback result: ${err}; throwing error so it does not hang`);
                            // throw (err);
                        }
                    }
                );

            console.log(`[OK][DB] Connected to MongoDB database`);
            connected = true;
        }
        catch (err)
        {
            console.log(`[ERROR][DB] ${err}`);
            connected = false;
        }

        return connected;
    }

    // insert array of properties into the MongoDB database
    insertSomeDataPromise(data: any[])
    {
        try
        {
            sensorData.insertMany
                (
                    data,
                    {},
                    (error: any, dataAdded: any) =>
                    {
                        if (error)
                        {
                            console.log('[DB] Error at insert : ', error);
                        } else
                        {
                            // console.log('Date introduse: ', dataAdded);
                        }
                    });
        }
        catch (err)
        {
            console.log('[DB][INSERT] Error at insert : ', err);
        }
    }

    findSomeDataPromise(deviceName: string, propertyName: string)
    {
        try
        {
            console.log('searching');
            const data = sensorData.find
                (
                    { sensor_name: deviceName, property_name: propertyName },
                    null,
                    // { limit: 2880, sort: { _id: -1 }, socketTimeoutMS: 1000 }
                    { limit: 2880, sort: { _id: -1 } },
                    // (err: any) => { if (err) { console.log(`[DB][SEARCH] callback result: ${err}; throwing error so it does not hang`); } }
                );
            return data;
        }
        catch (err)
        {
            console.log('[DB] Error connecting to MongoDB database - FIND function');
            return [];  // returns empty set
        }
    }

    removeSomeData(daysAgo?: any)
    {
        try
        {
            const result = sensorData.deleteMany(
                { timestamp: { $lt: String(Date.now() - 1000 * 3600 * 24 * 7 * 6) } }, // more than 6 weeks old to milliseconds
                {},
                (err: any) => { if (true) { console.log(`[DB][CLEAN-UP] callback result: ${err}`); } }
            );

            console.log(`[OK][DB] Cleaned-up succeeded`);
        }
        catch (err)
        {
            logOthers('[ERROR][SENSORS] Exception in removeSomeData function');
        }
    }
}