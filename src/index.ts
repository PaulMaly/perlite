import hr from 'hyperactiv';
import { render, nothing } from 'lit-html';

import { attrToVal, camelCase, dashCase } from './utils';

import type * as Type from './types';

const { observe, computed, dispose } = hr;

export * from './types';
export * from './directives';
export * from 'lit-html';

export { observe, computed, dispose };

export const noop = () => { };

export const tick = (fn = noop) => new Promise((resolve) => setTimeout(resolve)).then(fn);

export const $ = (
    {
        render: template = () => nothing,
        state: getState = {},
        target = document.body,
        ...options
    }: Type.Config,
    ...context
): Type.Widget => {
    const plainState = (typeof getState === 'function') ? getState(...context) : getState;

    Object.entries(target.dataset).forEach(([key, value]) => {
        if (key in plainState) plainState[key] = attrToVal(value);
    });

    const state: Type.ReactiveState = observe(plainState, {
        batch: true,
        deep: true,
        bind: true,
        ...options
    });

    const emit = (name, detail, { bubbles = false, cancelable = true } = {}) => {
        target.dispatchEvent(
            new CustomEvent(name, { detail, bubbles, cancelable })
        );
    };

    let mounted = false;
    const rerender = () => {
        render(template(state, emit, ...context), target);
        if (!mounted) {
            emit('mount', plainState);
            mounted = true;
        }
        emit('update', plainState);
    };
    const renderer = computed(({ computeAsync }) => {
        if (mounted && !document.contains(target)) return destroy();
        return Promise.resolve().then(() => computeAsync(rerender));
    });

    const events = new Set();
    const on = (...args: [string, () => any]) => {
        target.addEventListener(...args);
        const off = () => {
            target.removeEventListener(...args);
            return events.delete(off);
        };
        events.add(off);
        return off;
    };

    const effects = new Set();
    const effect = (...args: any[]) => {
        const handle = computed(...args);
        const cancel = () => {
            dispose(handle);
            return effects.delete(cancel);
        };
        effects.add(cancel);
        return cancel;
    };

    const targetObserver = new MutationObserver((mutations: MutationRecord[]) => {
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

    targetObserver.observe(target, {
        attributeFilter: Object.entries(plainState).reduce((attrs, [key, val]) => {
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
        emit('destroy', plainState);
        targetObserver.disconnect();
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
        state,
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
        effect: (...args) => widgets.map(widget => widget.effect(...args)),
        on: (...args) => widgets.map(widget => widget.on(...args)),
        destroy: () => widgets.forEach(widget => widget.destroy()),
        render: () => widgets.forEach(widget => widget.render()),
        state: fn => widgets.forEach(widget => fn(widget.state)),
        ctx: (fn: (...ctx: any[]) => any) => fn(...context),
        forEach: Array.prototype.forEach.bind(widgets),
        target
    };
};