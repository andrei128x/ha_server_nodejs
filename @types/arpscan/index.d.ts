declare module 'arpscan/promise';

interface options
{
    command: string;
    args: string[];
    interface: string;
    parser: (out: any) => (line: any) => void;
    sudo: boolean;
}

function arpscan(options: any): Promise<any>;