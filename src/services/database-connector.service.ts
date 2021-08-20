/*
    Purpose: module provides database operation services
    TODO:   select function based on property name
*/

// connect to MLAB.COM's account
import { DotenvParseOutput } from 'dotenv';
import { connect as mongooseConnect } from 'mongoose';

import { sensorData } from '../models/mongo.model';
import { throwHere, logOthers } from '../utils/system-utils';


export class DatabaseConnectorService
{
    private mongoServer: string;
    private connected: boolean;

    constructor(envData: DotenvParseOutput)
    {
        this.connected = false;
        this.mongoServer = envData?.URL_MONGO_SERVER;
        this.databaseConnect();

    }

    // connect to the MongoDB database
    async databaseConnect()
    {
        try
        {
            if (this.mongoServer)
                throwHere();

            mongooseConnect
                (
                    this.mongoServer
                    , { useNewUrlParser: true, useUnifiedTopology: true }
                    , err =>
                    {
                        if (err)
                        // tslint:disable-next-line: curly
                        {
                            console.log(`[DB][CONNECT] callback result: ${err}`);
                            // console.log(`[DB][CONNECT] callback result: ${err}; throwing error so it does not hang`);
                            // throw (err);
                        }
                    }
                );

            console.log(`[OK][DB] Connected to MongoDB database`);
            this.connected = true;
        }
        catch (err)
        {
            console.log(`[ERROR][DB] ${err}`);
            this.connected = false;
        }

        return this.connected;
    }


    isConnected()
    {
        return this.connected;
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

    async findSomeDataPromise(deviceName: string, propertyName: string)
    {
        try
        {
            console.log('searching');
            const data = sensorData.find
                (
                    { sensor_name: deviceName, property_name: propertyName },
                    null,
                    // { limit: 2880, sort: { _id: -1 }, socketTimeoutMS: 1000 }
                    { limit: 2880, sort: { _id: -1 } }
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

    removeSomeData(daysAgo?: number)
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
