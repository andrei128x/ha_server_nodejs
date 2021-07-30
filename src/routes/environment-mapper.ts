import { IsEnvList } from '../interfaces/interfaces';
import { DotenvParseOutput, config } from 'dotenv';
import { throwHere } from './system-utils';
import { resolve } from 'path';

export class EnvironmentMapper
{
    envData: DotenvParseOutput;

    constructor()
    {
        console.log('parsing ENV data...');
        
        this.envData = {};
        this.init();
    }

    private async init()
    {
        this.envData =  await this.parseEnvironment();
        process.stdout.write('[DONE]');
        
    }

    private async parseEnvironment(): Promise<DotenvParseOutput>
    {
        const envFile: string = './src/config/system-vars.env';

        // logOthers({ 'x': resolve(envFile) });

        let environmentData: DotenvParseOutput;

        environmentData = (config({ path: resolve(envFile) }).parsed) || {};    // this parses the ENV data from a file, if the system in empty

        if (!IsEnvList(environmentData))
            throwHere(environmentData);

        return environmentData;
    }
}
