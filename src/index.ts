import hr from 'hyperactiv';
import { render, nothing } from 'lit-html';

import { attrToVal, camelCase, dashCase } from './utils';

import type * as Type from './types';

const { observe, computed, dispose } = hr;

export * from './utils';
export * from './types';
export * from './directives';
export * from 'lit-html';

export { observe, computed, dispose };

export const $ = (
    {
        render: template = () => nothing,
        state: data = {},
        target = document.body,
        ...options
    }: Type.Config,
    ...context
): Type.Widget => {
    const model = (typeof data === 'function') ? data(...context) : data;

    Object.entries(target.dataset).forEach(([key, value]) => {
        if (key in model) model[key] = attrToVal(value);
    });

    const state: ProxyConstructor = observe(model, {
        batch: true,
        deep: true,
        bind: true,
        ...options
    });

    const emit = (type: string, detail: object, { bubbles = false, cancelable = true } = {}) => {
        target.dispatchEvent(
            new CustomEvent(type, { detail, bubbles, cancelable })
        );
    };

    let mounted = false;
    const rerender = () => {
        render(template(state, emit, ...context), target);
        if (!mounted) {
            emit('mount', model);
            mounted = true;
        }
        emit('update', model);
    };
    const renderer = computed(({ computeAsync }) => {
        if (mounted && !document.contains(target)) return destroy();
        emit('state', model);
        return Promise.resolve().then(() => computeAsync(rerender));
    });

    const events = new Set();
    const on = (type: string, fn: (e: CustomEvent) => void, opts?: object | boolean) => {
        target.addEventListener(type, fn, opts);
        const off = () => {
            target.removeEventListener(type, fn, opts);
            return events.delete(off);
        };
        events.add(off);
        return off;
    };

    const effects = new Set();
    const effect = (fn: () => void, opts?: object) => {
        const handle = computed(fn, opts);
        const cancel = () => {
            dispose(handle);
            return effects.delete(cancel);
        };
        effects.add(cancel);
        return cancel;
    };

    const observer = new MutationObserver((mutations: MutationRecord[]) => {
        mutations.forEach((mutation) => {
            if (mutation.type !== 'attributes') return;

            const el: Element = mutation.target as Element;
            const key = camelCase(mutation.attributeName.replace('data-', ''));

            if (!(key in state)) return;

            const value = el.getAttribute(mutation.attributeName);
            if (value !== mutation.oldValue) {
                const val = attrToVal(value);
                if (state[key] !== val) state[key] = val;
            }
        });
    });

    observer.observe(target, {
        attributeFilter: Object.entries(model).reduce((attrs, [key, val]) => {
            if (typeof val !== 'function') {
                attrs.push(`data-${dashCase(key)}`);
            }
            return attrs;
        }, []),
        attributeOldValue: true,
        characterData: false,
        childList: false,
        subtree: false
    });

    const destroy = () => {
        emit('destroy', model);
        observer.disconnect();
        dispose(renderer);
        effects.forEach((cancel: () => any) => cancel());
        effects.clear();
        events.forEach((off: () => any) => off());
        events.clear();
        target.innerHTML = ''; // is this the best way to clean up the DOM?
    };

    const ctx = (fn: (...ctx: any[]) => any) => fn(...context);

    return {
        on,
        ctx,
        model, // plain state (object)
        state, // reactive state (proxy)
        effect,
        target,
        destroy,
        render: rerender
    };
};

export const $$ = ({ target, ...config }: Type.Configs, ...context): Type.Widgets => {
    if (!(target as NodeList | Node[]).length) {
        target = [target] as Node[];
    }

    const widgets = Array.prototype.map.call(target, (target: HTMLElement) => {
        return $({ ...config, target } as Type.Config, ...context);
    });

    return {
        ...widgets,
        effect: (fn, opts): [] => widgets.map((widget: Type.Widget) => widget.effect(fn(widget.state), opts)),
        on: (...args): [] => widgets.map((widget: Type.Widget) => widget.on(...args)),
        destroy: (): void => widgets.forEach((widget: Type.Widget) => widget.destroy()),
        render: (): void => widgets.forEach((widget: Type.Widget) => widget.render()),
        state: (fn: (state: ProxyConstructor) => void): void => {
            widgets.forEach((widget: Type.Widget) => fn(widget.state))
        },
        ctx: (fn: (...ctx: any[]) => any) => fn(...context),
        forEach: Array.prototype.forEach.bind(widgets),
        target
    };
};