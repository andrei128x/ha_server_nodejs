/*
Purpose: module provides possibilities to trigger periodic actions
TODO:   refactor and add capabilities similar to Linux's Cron
*/

// includes
const defaultDelay = 10000;

// definitions
export class PeriodicTimer
{
    private static jobList: NodeJS.Timeout[] = [];

    constructor(cbk: (someArgs?: any) => void, delay: number = defaultDelay, ...args: any)
    {
        cbk(args);
        const newSize = PeriodicTimer.jobList.push(setInterval(cbk, delay, ...args));

        console.log(`[OK][CRON] Cron ID ${newSize} value set to ${delay === defaultDelay ? '10000[dafault]' : delay} ms`);
    }

    showJobs()
    {
        return PeriodicTimer.jobList;
    }

}
