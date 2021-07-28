import * as path from 'path';

export function setConsole()
{
    ['debug', 'log', 'warn', 'error'].forEach((methodName) =>
    {
        const originalLoggingMethod: any = console[methodName as keyof Console];

        console[methodName as keyof Console] = (firstArgument: any, ...otherArguments: any) =>
        {
            const originalPrepareStackTrace = Error.prepareStackTrace;
            Error.prepareStackTrace = (_, stack) => stack;

            const callee: any = new Error().stack![1];
            Error.prepareStackTrace = originalPrepareStackTrace;

            // const relativeFileName = path.relative(process.cwd(), callee.getFileName());
            const relativeFileName = path.relative(process.cwd(), callee.getFileName()).split('/')[2]; // only filename, w/o path
            const prefix = `${relativeFileName}:${callee.getLineNumber()}:`;
            if (typeof firstArgument === 'string')
            {
                originalLoggingMethod('\x1b[33m%s\x1b[0m', prefix, ' ' + firstArgument, ...otherArguments);
            } else
            {
                originalLoggingMethod('\x1b[33m%s\x1b[0m', prefix, firstArgument, ...otherArguments);
            }
        };
    });
}
