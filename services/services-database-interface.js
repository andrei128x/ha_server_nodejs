/*
    Purpose: module provides database operation services
    TODO:   select function based on property name
*/

'use strict';

// connect to MLAB.COM's account
const mongoose = require('mongoose');

// const router = express.Router();
const sensorModels = require('../models/models');
const mongoServer=require('dotenv').config().parsed.URL_MONGO_SERVER || new Error('[ERROR][DB] \'.env\' parse error') ;


function loadEnvironmentVariables()
{
    console.log();
}


// connect to the MongoDB database
async function databaseConnect()
{
    let connected;

    loadEnvironmentVariables()

    try
    {
        await mongoose.connect
            (
                db,
                { useNewUrlParser: true },
                function (err)
                {
                    if (err) { console.log(`[DB][CONNECT] callback result: ${err}; throwing error so it does not hang`); throw (err); }
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
async function insertSomeDataPromise(data)
{
    try
    {
        sensorModels.sensorData.insertMany
            (
                data,
                (error, dataAdded) =>
                {
                    if (error)
                    {
                        console.log('[DB] Error at insert : ', error);
                    } else
                    {
                        // console.log('Date introduse: ', dataAdded);
                    }
                })
    }
    catch (err)
    {
        console.log('[DB][INSERT] Error at insert : ', err);
    }
}

async function findSomeDataPromise(deviceName, propertyName)
{
    try
    {
        console.log('searching');
        let data = await sensorModels.sensorData.find
            (
                { sensor_name: deviceName, property_name: propertyName },
                null,
                { limit: 2880, sort: { _id: -1 }, socketTimeoutMS: 1000 }
                // {limit: 288, sort:{_id: -1}}
                , (err) => { if (true) { console.log(`[DB][SEARCH] callback result: ${err}; throwing error so it does not hang`) } }
            );
        return data;
    }
    catch (err)
    {
        console.log('[DB] Error connecting to MongoDB database - FIND function');
        return [];  //returns empty set
    }
}

async function removeSomeData(daysAgo)
{
    try
    {
        let result = await sensorModels.sensorData.deleteMany(
            { timestamp: { $lt: Date.now() - 1000 * 3600 * 24 * 7 * 6 } } // more than 6 weeks old to milliseconds
            ,
            (err) => { if (true) { console.log(`[DB][CLEAN-UP] callback result: ${err}`) } }
        )

        console.log(`[OK][DB] Cleaned-up succeeded`);
    }
    catch (err)
    {

    }
}

// EXPORTS
module.exports = {
    databaseConnect,
    insertSomeDataPromise,
    findSomeDataPromise,
    removeSomeData
};
