export declare const noop: (...args: any[]) => void;
export declare const tick: (fn?: (() => any)) => Promise<undefined>;
export declare const memo: (fn: (...args: any[]) => any, invalidate?: (...args: any[]) => any) => (...args: any[]) => any;
export declare function attrToVal(str: string): any;
export declare function camelCase(str: string, pascal?: boolean): string;
export declare function kebabCase(str: string): string;
