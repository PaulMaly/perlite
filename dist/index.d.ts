import type * as Type from './types';
declare const observe: any, computed: any, dispose: any;
export * from './utils';
export * from './types';
export * from './directives';
export * from 'lit-html';
export { observe, computed, dispose };
export declare const $: ({ render: template, state: data, target, ...options }: Type.Config, ...context: any[]) => Type.Widget;
export declare const $$: ({ target, ...config }: Type.Configs, ...context: any[]) => Type.Widgets;
