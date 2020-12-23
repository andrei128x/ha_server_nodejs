"use strict";
/*
Purpose: module provides possibilities to trigger periodic actions
TODO:   refactor and add capabilities similar to Linux's Cron
*/
Object.defineProperty(exports, "__esModule", { value: true });
// definitions
class CronJob {
    constructor(cbk, delay = 10000, ...args) {
        this.idx = 0;
        this.jobList = [];
        if (!this.idx) {
            this.idx = 0;
            this.jobList = [];
        }
        this.jobList.push(setInterval(cbk, delay, ...args));
        console.log(`[OK][CRON] Cron ID ${this.idx} value set to ${delay === 10000 ? '10000[dafault]' : delay} ms`);
        this.idx++;
    }
    showJobs() {
        return this.jobList;
    }
}
exports.CronJob = CronJob;
