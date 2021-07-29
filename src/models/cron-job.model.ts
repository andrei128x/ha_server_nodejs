/*
Purpose: module provides possibilities to trigger periodic actions
TODO:   refactor and add capabilities similar to Linux's Cron
*/

// includes
export interface ITimerTrigger
{
    idx: number;
    jobList: NodeJS.Timeout[];
}

// definitions
export class CronJob implements ITimerTrigger
{
    idx: number = 0;
    jobList: NodeJS.Timeout[] = [];

    constructor(cbk: any, delay = 10000, ...args: any)
    {
        if (!this.idx)
        {
            this.idx = 0;
            this.jobList = [];
        }

        this.jobList.push(setInterval(cbk, delay, ...args));

        console.log(`[OK][CRON] Cron ID ${this.idx} value set to ${delay === 10000 ? '10000[dafault]' : delay} ms`);

        this.idx++;
    }

    showJobs()
    {
        return this.jobList;
    }

}
