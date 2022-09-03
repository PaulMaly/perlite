import hr from 'hyperactiv';
import { directive, EventPart, nothing, render } from 'lit-html';
export * from 'lit-html';
import { repeat as repeat$1 } from 'lit-html/directives/repeat';
export * from 'lit-html/directives/repeat';
export * from 'lit-html/directives/cache';
export * from 'lit-html/directives/until';
export * from 'lit-html/directives/live';
export * from 'lit-html/directives/guard';
export * from 'lit-html/directives/class-map';
export * from 'lit-html/directives/style-map';
export * from 'lit-html/directives/if-defined';
export * from 'lit-html/directives/async-append';
export * from 'lit-html/directives/async-replace';
export * from 'lit-html/directives/template-content';
export * from 'lit-html/directives/unsafe-html';
export * from 'lit-html/directives/unsafe-svg';

const noop = (...args) => { };
const tick = (fn = noop) => new Promise((resolve) => setTimeout(resolve)).then(fn);
const memo = (fn, invalidate) => {
    const cache = new Map();
    return (...args) => {
        let key;
        if (typeof invalidate === 'function') {
            const validOrKey = invalidate.apply(fn, args);
            if (validOrKey === false) {
                key = JSON.stringify(args);
                cache.delete(key);
            }
            else if (validOrKey !== true) {
                key = validOrKey;
            }
        }
        if (key === undefined) {
            key = JSON.stringify(args);
        }
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn.apply(fn, args);
        cache.set(key, result);
        return result;
    };
};
function attrToVal(str) {
    if (str === 'true' || str === 'false') {
        return str === 'true';
    }
    else if (str === 'null') {
        return null;
    }
    else if (str === 'undefined') {
        return undefined;
    }
    else if (str !== '' && !isNaN(Number(str))) {
        return Number(str);
    }
    else {
        try {
            return JSON.parse(str);
        }
        catch (e) { }
    }
    return str;
}
function camelCase(str, pascal = false) {
    const camel = str.replace(/-([a-z])/g, (_, w) => w.toUpperCase());
    return pascal ? camel.replace(/^\w/, s => s.toUpperCase()) : camel;
}
function kebabCase(str) {
    return str.replace(/[A-Z]/g, '-$&').toLowerCase();
}

const each = (items, template, keyFn = (item) => item) => repeat$1(items, keyFn, template);

const ref = directive((fn) => (part) => fn(part.element));

const decorators = new WeakMap();
const decorator = directive((handler, ...state) => {
    const self = (part) => {
        const el = part.element;
        if (decorators.has(part)) {
            const [decorator, prevHandler] = decorators.get(part);
            if (prevHandler !== handler) {
                decorator.destroy();
                decorators.delete(part);
                self(part);
            }
            else {
                decorator.update(...state);
            }
        }
        else {
            const decorator = handler(el, ...state);
            decorators.set(part, [decorator, handler]);
        }
    };
    return self;
});

const bind = directive((handleEvent) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"bind" directive can only be used in event listeners');
    }
    const el = part.element;
    const isInput = el instanceof HTMLInputElement;
    const isSelect = el instanceof HTMLSelectElement;
    const isTextarea = el instanceof HTMLTextAreaElement;
    const isButton = el instanceof HTMLButtonElement;
    if (!isInput && !isSelect && !isTextarea && !isButton) {
        throw new Error('"bind" directive can only be applied to input/select/textarea/button elements.');
    }
    part.setValue(function (...args) {
        let value = el.defaultValue;
        if (isSelect && el.options.length > 0) {
            const i = el.selectedIndex >= 0 ? el.selectedIndex : 0;
            value = el.options[i].value;
        }
        else if (isInput) {
            switch (el.type) {
                case 'number':
                case 'range':
                    value = el.valueAsNumber;
                    break;
                case 'checkbox':
                case 'radio':
                    value = !!el.checked;
                    break;
                case 'time':
                case 'date':
                case 'datetime':
                case 'datetime-local':
                    value = el.valueAsDate;
                    break;
                default:
                    value = el.value;
            }
        }
        else {
            value = el.value;
        }
        handleEvent.call(this, value, ...args);
    });
});

const call = (handleEvent, ...args) => function (...argv) {
    handleEvent.call(this, ...argv, ...args);
};

const capture = directive((handleEvent) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"capture" directive can only be used in event listeners');
    }
    part.setValue(typeof handleEvent === 'object' ?
        { ...handleEvent, capture: true } :
        { handleEvent, capture: true });
});

const once = directive((handleEvent) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"once" directive can only be used in event listeners');
    }
    part.setValue(typeof handleEvent === 'object' ?
        { ...handleEvent, once: true } :
        { handleEvent, once: true });
});

const passive = directive((handleEvent) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"passive" directive can only be used in event listeners');
    }
    part.setValue(typeof handleEvent === 'object' ?
        { ...handleEvent, passive: true } :
        { handleEvent, passive: true });
});

const prevent = directive((handler) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"prevent" directive can only be used in event listeners');
    }
    const { handleEvent, ...options } = handler;
    part.setValue({
        handleEvent: function (event) {
            event.preventDefault();
            (handleEvent || handler).call(this, event);
        },
        ...options
    });
});

const stop = directive((handler, immediate = false) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"stop" directive can only be used in event listeners');
    }
    const { handleEvent, ...options } = handler;
    part.setValue({
        handleEvent: function (event) {
            immediate ? event.stopImmediatePropagation() : event.stopPropagation();
            (handleEvent || handler).call(this, event);
        },
        ...options
    });
});

const self = directive((handler) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"self" directive can only be used in event listeners');
    }
    const { handleEvent, ...options } = handler;
    part.setValue({
        handleEvent: function (event) {
            (event.target === event.currentTarget)
                && (handleEvent || handler).call(this, event);
        },
        ...options
    });
});

const { observe, computed, dispose } = hr;
const $ = ({ render: template = () => nothing, state: data = {}, target = document.body, ...options }, ...context) => {
    const model = (typeof data === 'function') ? data(...context) : data;
    Object.entries(target.dataset).forEach(([key, value]) => {
        if (key in model)
            model[key] = attrToVal(value);
    });
    const state = observe(model, {
        batch: true,
        deep: true,
        bind: true,
        ...options
    });
    const emit = (type, detail, { bubbles = false, cancelable = true } = {}) => {
        target.dispatchEvent(new CustomEvent(type, { detail, bubbles, cancelable }));
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
        if (mounted && !document.contains(target))
            return destroy();
        emit('state', model);
        return Promise.resolve()
            .then(() => computeAsync(rerender))
            .catch(err => emit('error', err));
    });
    const events = new Set();
    const on = (type, fn, opts) => {
        target.addEventListener(type, fn, opts);
        const off = () => {
            target.removeEventListener(type, fn, opts);
            return events.delete(off);
        };
        events.add(off);
        return off;
    };
    const effects = new Set();
    const effect = (fn, opts) => {
        const handle = computed(fn, opts);
        const cancel = () => {
            dispose(handle);
            return effects.delete(cancel);
        };
        effects.add(cancel);
        return cancel;
    };
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type !== 'attributes')
                return;
            const el = mutation.target;
            const key = camelCase(mutation.attributeName.replace('data-', ''));
            if (!(key in state))
                return;
            const value = el.getAttribute(mutation.attributeName);
            if (value !== mutation.oldValue) {
                const val = attrToVal(value);
                if (state[key] !== val)
                    state[key] = val;
            }
        });
    });
    observer.observe(target, {
        attributeFilter: Object.entries(model).reduce((attrs, [key, val]) => {
            if (typeof val !== 'function') {
                attrs.push(`data-${kebabCase(key)}`);
            }
            return attrs;
        }, []),
        attributeOldValue: true,
        characterData: false,
        childList: false,
        subtree: false
    });
    const destroy = (cb = noop) => {
        emit('destroy', model);
        observer.disconnect();
        dispose(renderer);
        effects.forEach((cancel) => cancel());
        effects.clear();
        events.forEach((off) => off());
        events.clear();
        target.innerHTML = '';
        cb(model);
    };
    const ctx = (fn) => fn(...context);
    return {
        on,
        ctx,
        model,
        state,
        effect,
        target,
        destroy,
        render: rerender,
    };
};
const $$ = ({ target, ...config }, ...context) => {
    if (!target.length) {
        target = [target];
    }
    const widgets = Array.prototype.map.call(target, (target) => {
        return $({ ...config, target }, ...context);
    });
    return {
        ...widgets,
        effect: (fn, opts) => {
            const cancels = widgets.map((widget) => widget.effect(fn(widget.state), opts));
            return () => cancels.forEach(cancel => cancel());
        },
        on: (...args) => {
            const offs = widgets.map((widget) => widget.on(...args));
            return () => offs.forEach(off => off());
        },
        destroy: (cb) => widgets.forEach((widget) => widget.destroy(cb)),
        render: () => widgets.forEach((widget) => widget.render()),
        state: (fn) => {
            widgets.forEach((widget) => fn(widget.state));
        },
        ctx: (fn) => fn(...context),
        forEach: Array.prototype.forEach.bind(widgets),
        target,
    };
};

export { $, $$, attrToVal, bind, call, camelCase, capture, computed, decorator, dispose, each, kebabCase, memo, noop, observe, once, passive, prevent, ref, self, stop, tick };
