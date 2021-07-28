import { IEnvList, IsEnvList, IEnvVariable } from '../interfaces/interfaces';
import { DotenvParseOutput, config } from 'dotenv';
import { throwHere } from './utils';
import { resolve } from 'path';

export class EnvironmentMapper implements IEnvList
{
    VARS: IEnvVariable = {};

    static parseEnvironment(): IEnvVariable
    {
        const envFile: string = 'system-vars.env';

        // logOthers({ 'x': resolve(envFile) });

        let environmentData: DotenvParseOutput | undefined;

        if (!EnvironmentMapper.prototype.VARS)
        {
            environmentData = config({ path: resolve(envFile) }).parsed;

            if (!IsEnvList(environmentData))
                throwHere(environmentData);

            EnvironmentMapper.prototype.VARS = environmentData;
        }

        return EnvironmentMapper.prototype.VARS;
    }
}
