import { TemplateResult, SVGTemplateResult, nothing } from 'lit-html';

export type RenderResult = TemplateResult | SVGTemplateResult | typeof nothing;

export type State = {} | ((...ctx: any[]) => {});

export type Targets = Node | NodeList | Node[];

export type Config = {
    render: (
        state: ProxyConstructor,
        emit: (type: string, detail: object, opts?: object) => void,
        ...ctx: any[]
    ) => RenderResult;
    target: HTMLElement;
    state: State;
    [key: string]: any;
}

export type Configs = Config | { target: Targets };

export type Widget = {
    target: Node;
    state: ProxyConstructor;
    model: object;
    on: (type: string, fn: (e: CustomEvent) => void, opts?: object | boolean) => () => void;
    ctx: (fn: (...ctx: any[]) => any) => any;
    effect: (fn: () => void, opts?: object) => () => void;
    destroy: () => void;
    render: () => void;
}

export type Widgets = {
    [key: number]: Widget;
    target: Targets;
    on: (type: string, fn: (e: CustomEvent) => void, opts?: object | boolean) => () => void;
    effect: (fn: (state: ProxyConstructor) => () => void, opts?: object) => () => void;
    state: (fn: (state: ProxyConstructor) => void) => void;
    ctx: (fn: (...ctx: any[]) => any) => any;
    destroy: () => void;
    render: () => void;
    forEach: (fn: (widget: Widget, index: number, widgets: Widget[]) => void) => void;
}