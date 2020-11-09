import { TemplateResult, SVGTemplateResult, nothing } from 'lit-html';
export declare type RenderResult = TemplateResult | SVGTemplateResult | typeof nothing;
export declare type ReactiveState = typeof Proxy;
export declare type State = {} | ((...args: any[]) => {});
export declare type Target = Node;
export declare type Targets = Target | NodeList | Node[];
export declare type Config = {
    render: (...args: any[]) => RenderResult;
    target: HTMLElement;
    state: State;
    [key: string]: any;
};
export declare type Configs = Config | {
    target: Targets;
};
export declare type Widget = {
    state: typeof Proxy;
    target: Target;
    on: (...args: any[]) => () => void;
    effect: (fn: () => void, opts: {}) => () => void;
    destroy: () => void;
    render: () => void;
    [key: string]: any;
};
export declare type Widgets = {
    [key: number]: Widget;
    target: Targets;
    on: (...args: any[]) => () => void;
    effect: (...args: any[]) => () => void;
    state: (fn: ({}: {}) => void) => () => void;
    destroy: () => void;
    render: () => void;
    forEach: (...args: any[]) => void;
};
