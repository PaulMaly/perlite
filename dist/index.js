(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('hyperactiv'), require('lit-html'), require('lit-html/directives/repeat'), require('lit-html/directives/cache'), require('lit-html/directives/until'), require('lit-html/directives/live'), require('lit-html/directives/guard'), require('lit-html/directives/class-map'), require('lit-html/directives/style-map'), require('lit-html/directives/if-defined'), require('lit-html/directives/async-append'), require('lit-html/directives/async-replace'), require('lit-html/directives/template-content'), require('lit-html/directives/unsafe-html'), require('lit-html/directives/unsafe-svg')) :
    typeof define === 'function' && define.amd ? define(['exports', 'hyperactiv', 'lit-html', 'lit-html/directives/repeat', 'lit-html/directives/cache', 'lit-html/directives/until', 'lit-html/directives/live', 'lit-html/directives/guard', 'lit-html/directives/class-map', 'lit-html/directives/style-map', 'lit-html/directives/if-defined', 'lit-html/directives/async-append', 'lit-html/directives/async-replace', 'lit-html/directives/template-content', 'lit-html/directives/unsafe-html', 'lit-html/directives/unsafe-svg'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.perlite = {}, global.hr, global.litHtml, global.repeat, global.cache, global.until, global.live, global.guard, global.classMap, global.styleMap, global.ifDefined, global.asyncAppend, global.asyncReplace, global.templateContent, global.unsafeHtml, global.unsafeSvg));
}(this, (function (exports, hr, litHtml, repeat, cache, until, live, guard, classMap, styleMap, ifDefined, asyncAppend, asyncReplace, templateContent, unsafeHtml, unsafeSvg) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var hr__default = /*#__PURE__*/_interopDefaultLegacy(hr);

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    const noop = () => { };
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

    const each = (items, template, keyFn = (item) => item) => repeat.repeat(items, keyFn, template);

    const ref = litHtml.directive((fn) => (part) => fn(part.element));

    const decorators = new WeakMap();
    const decorator = litHtml.directive((handler, ...state) => {
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

    const bind = litHtml.directive((handleEvent) => (part) => {
        if (!(part instanceof litHtml.EventPart)) {
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

    const capture = litHtml.directive((handleEvent) => (part) => {
        if (!(part instanceof litHtml.EventPart)) {
            throw new Error('"capture" directive can only be used in event listeners');
        }
        part.setValue(typeof handleEvent === 'object' ? Object.assign(Object.assign({}, handleEvent), { capture: true }) :
            { handleEvent, capture: true });
    });

    const once = litHtml.directive((handleEvent) => (part) => {
        if (!(part instanceof litHtml.EventPart)) {
            throw new Error('"once" directive can only be used in event listeners');
        }
        part.setValue(typeof handleEvent === 'object' ? Object.assign(Object.assign({}, handleEvent), { once: true }) :
            { handleEvent, once: true });
    });

    const passive = litHtml.directive((handleEvent) => (part) => {
        if (!(part instanceof litHtml.EventPart)) {
            throw new Error('"passive" directive can only be used in event listeners');
        }
        part.setValue(typeof handleEvent === 'object' ? Object.assign(Object.assign({}, handleEvent), { passive: true }) :
            { handleEvent, passive: true });
    });

    const prevent = litHtml.directive((handler) => (part) => {
        if (!(part instanceof litHtml.EventPart)) {
            throw new Error('"prevent" directive can only be used in event listeners');
        }
        const { handleEvent } = handler, options = __rest(handler, ["handleEvent"]);
        part.setValue(Object.assign({ handleEvent: function (event) {
                event.preventDefault();
                (handleEvent || handler).call(this, event);
            } }, options));
    });

    const stop = litHtml.directive((handler, immediate = false) => (part) => {
        if (!(part instanceof litHtml.EventPart)) {
            throw new Error('"stop" directive can only be used in event listeners');
        }
        const { handleEvent } = handler, options = __rest(handler, ["handleEvent"]);
        part.setValue(Object.assign({ handleEvent: function (event) {
                immediate ? event.stopImmediatePropagation() : event.stopPropagation();
                (handleEvent || handler).call(this, event);
            } }, options));
    });

    const self = litHtml.directive((handler) => (part) => {
        if (!(part instanceof litHtml.EventPart)) {
            throw new Error('"self" directive can only be used in event listeners');
        }
        const { handleEvent } = handler, options = __rest(handler, ["handleEvent"]);
        part.setValue(Object.assign({ handleEvent: function (event) {
                (event.target === event.currentTarget)
                    && (handleEvent || handler).call(this, event);
            } }, options));
    });

    const { observe, computed, dispose } = hr__default['default'];
    const $ = (_a, ...context) => {
        var { render: template = () => litHtml.nothing, state: data = {}, target = document.body } = _a, options = __rest(_a, ["render", "state", "target"]);
        const model = (typeof data === 'function') ? data(...context) : data;
        Object.entries(target.dataset).forEach(([key, value]) => {
            if (key in model)
                model[key] = attrToVal(value);
        });
        const state = observe(model, Object.assign({ batch: true, deep: true, bind: true }, options));
        const emit = (type, detail, { bubbles = false, cancelable = true } = {}) => {
            target.dispatchEvent(new CustomEvent(type, { detail, bubbles, cancelable }));
        };
        let mounted = false;
        const rerender = () => {
            litHtml.render(template(state, emit, ...context), target);
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
        const destroy = () => {
            observer.disconnect();
            dispose(renderer);
            effects.forEach((cancel) => cancel());
            effects.clear();
            events.forEach((off) => off());
            events.clear();
            target.innerHTML = '';
            emit('destroy', model);
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
    const $$ = (_a, ...context) => {
        var { target } = _a, config = __rest(_a, ["target"]);
        if (!target.length) {
            target = [target];
        }
        const widgets = Array.prototype.map.call(target, (target) => {
            return $(Object.assign(Object.assign({}, config), { target }), ...context);
        });
        return Object.assign(Object.assign({}, widgets), { effect: (fn, opts) => {
                const cancels = widgets.map((widget) => widget.effect(fn(widget.state), opts));
                return () => cancels.forEach(cancel => cancel());
            }, on: (...args) => {
                const offs = widgets.map((widget) => widget.on(...args));
                return () => offs.forEach(off => off());
            }, destroy: () => widgets.forEach((widget) => widget.destroy()), render: () => widgets.forEach((widget) => widget.render()), state: (fn) => {
                widgets.forEach((widget) => fn(widget.state));
            }, ctx: (fn) => fn(...context), forEach: Array.prototype.forEach.bind(widgets), target });
    };

    Object.keys(litHtml).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return litHtml[k];
            }
        });
    });
    Object.keys(repeat).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return repeat[k];
            }
        });
    });
    Object.keys(cache).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return cache[k];
            }
        });
    });
    Object.keys(until).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return until[k];
            }
        });
    });
    Object.keys(live).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return live[k];
            }
        });
    });
    Object.keys(guard).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return guard[k];
            }
        });
    });
    Object.keys(classMap).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return classMap[k];
            }
        });
    });
    Object.keys(styleMap).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return styleMap[k];
            }
        });
    });
    Object.keys(ifDefined).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return ifDefined[k];
            }
        });
    });
    Object.keys(asyncAppend).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return asyncAppend[k];
            }
        });
    });
    Object.keys(asyncReplace).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return asyncReplace[k];
            }
        });
    });
    Object.keys(templateContent).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return templateContent[k];
            }
        });
    });
    Object.keys(unsafeHtml).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return unsafeHtml[k];
            }
        });
    });
    Object.keys(unsafeSvg).forEach(function (k) {
        if (k !== 'default') Object.defineProperty(exports, k, {
            enumerable: true,
            get: function () {
                return unsafeSvg[k];
            }
        });
    });
    exports.$ = $;
    exports.$$ = $$;
    exports.attrToVal = attrToVal;
    exports.bind = bind;
    exports.call = call;
    exports.camelCase = camelCase;
    exports.capture = capture;
    exports.computed = computed;
    exports.decorator = decorator;
    exports.dispose = dispose;
    exports.each = each;
    exports.kebabCase = kebabCase;
    exports.memo = memo;
    exports.noop = noop;
    exports.observe = observe;
    exports.once = once;
    exports.passive = passive;
    exports.prevent = prevent;
    exports.ref = ref;
    exports.self = self;
    exports.stop = stop;
    exports.tick = tick;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
