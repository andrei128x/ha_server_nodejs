/*
Purpose: module provides possibilities to trigger periodic actions
TODO:   refactor and add capabilities similar to Linux's Cron
*/

'use strict';   //always 'use strict'


//includes
const md5 = require('md5');


//definitions
class CronJob
{
    constructor(cbk, delay, ...args)
    {
        if(!CronJob.idx)
        {
            CronJob.idx     = 0;
            CronJob.jobList = [];
        }
        
        CronJob.jobList[CronJob.idx] = setInterval(cbk, delay, ...args )

        console.log(`[CRON] : ${CronJob.idx}`);

        CronJob.idx++;
    }

    showJobs()
    {
        return CronJob.jobList;
    }
  
}


module.exports = CronJob