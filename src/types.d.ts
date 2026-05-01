/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "pdf-parse" {
    function pdf(dataBuffer: Buffer, options?: any): Promise<{
        numpages: number;
        numrender: number;
        info: any;
        metadata: any;
        text: string;
        version: string;
    }>;
    export = pdf;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
