import { TemplateResult, SVGTemplateResult, nothing } from 'lit-html';

export type RenderResult = TemplateResult | SVGTemplateResult | typeof nothing;

export type ReactiveState = typeof Proxy;

export type State = {} | ((...args: any[]) => {});

export type Target = Node;
export type Targets = Target | NodeList | Node[];

export type Config = {
    render: (...args: any[]) => RenderResult;
    target: HTMLElement;
    state: State;
    [key: string]: any;
}

export type Configs = Config | { target: Targets };

export type Widget = {
    state: typeof Proxy;
    target: Target;
    on: (...args: any[]) => () => void;
    effect: (fn: () => void, opts: {}) => () => void;
    destroy: () => void;
    render: () => void;
    [key: string]: any;
}

export type Widgets = {
    [key: number]: Widget;
    target: Targets;
    on: (...args: any[]) => () => void;
    effect: (...args: any[]) => () => void;
    state: (fn: ({ }) => void) => () => void;
    destroy: () => void;
    render: () => void;
    forEach: (...args: any[]) => void;
}