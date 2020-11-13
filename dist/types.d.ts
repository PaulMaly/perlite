import { TemplateResult, SVGTemplateResult, nothing } from 'lit-html';
export declare type RenderResult = TemplateResult | SVGTemplateResult | typeof nothing;
export declare type State = {} | ((...ctx: any[]) => {});
export declare type Targets = Node | NodeList | Node[];
export declare type Config = {
    render: (state: ProxyConstructor, emit: (type: string, detail: object, opts?: object) => void, ...ctx: any[]) => RenderResult;
    target: HTMLElement;
    state: State;
    [key: string]: any;
};
export declare type Configs = Config | {
    target: Targets;
};
export declare type Widget = {
    target: Node;
    state: ProxyConstructor;
    model: object;
    on: (type: string, fn: (e: CustomEvent) => void, opts?: object | boolean) => () => void;
    ctx: (fn: (...ctx: any[]) => any) => any;
    effect: (fn: () => void, opts?: object) => () => void;
    destroy: () => void;
    render: () => void;
};
export declare type Widgets = {
    [key: number]: Widget;
    target: Targets;
    on: (type: string, fn: (e: CustomEvent) => void, opts?: object | boolean) => (() => void)[];
    effect: (fn: (state: ProxyConstructor) => () => void, opts?: object) => (() => void)[];
    state: (fn: (state: ProxyConstructor) => void) => void;
    ctx: (fn: (...ctx: any[]) => any) => any;
    destroy: () => void;
    render: () => void;
    forEach: (fn: (widget: Widget, index: number, widgets: Widget[]) => void) => void;
};
