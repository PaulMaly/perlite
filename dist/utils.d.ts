export declare const noop: () => void;
export declare const tick: (fn?: (() => any)) => Promise<any>;
export declare const memo: (fn: (...args: any[]) => any, invalidate?: (...args: any[]) => any) => (...args: any[]) => any;
export declare function attrToVal(str: string): any;
export declare function camelCase(str: string): string;
export declare function dashCase(str: string): string;
