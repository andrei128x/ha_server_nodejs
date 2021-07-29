export class EGlobalError extends Error
{
    constructor(message?: string)
    {
        super(message ? message : `unknown error`);
    }
}

export function logOthers(stuff?: any): void
{
    console.log(`[OTHER] Info: ${JSON.stringify(stuff || {})}`);
}


export function throwHere(stuff?: any): never
{
    throw new EGlobalError(`[OTHER] Exception happened: ${JSON.stringify(stuff || {})}`);
}

