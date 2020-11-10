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

const BIND_IGNORED = [
    'String',
    'Number',
    'Object',
    'Array',
    'Boolean',
    'Date'
];

function isObj(object) { return object && typeof object === 'object' }
function setHiddenKey(object, key, value) {
    Object.defineProperty(object, key, { value, enumerable: false, configurable: true });
}
function defineBubblingProperties(object, key, parent) {
    setHiddenKey(object, '__key', key);
    setHiddenKey(object, '__parent', parent);
}
function getInstanceMethodKeys(object) {
    return (
        Object
            .getOwnPropertyNames(object)
            .concat(
                Object.getPrototypeOf(object) &&
                BIND_IGNORED.indexOf(Object.getPrototypeOf(object).constructor.name) < 0 ?
                    Object.getOwnPropertyNames(Object.getPrototypeOf(object)) :
                    []
            )
            .filter(prop => prop !== 'constructor' && typeof object[prop] === 'function')
    )
}

const data = {
    computedStack: [],
    observersMap: new WeakMap(),
    computedDependenciesTracker: new WeakMap()
};

let timeout = null;
const queue = new Set();
function process() {
    for(const task of queue) {
        task();
    }
    queue.clear();
    timeout = null;
}

function enqueue(task, batch) {
    if(timeout === null)
        timeout = setTimeout(process, batch === true ? 0 : batch);
    queue.add(task);
}

const { observersMap, computedStack, computedDependenciesTracker } = data;

function observe(obj, options = {}) {
    // 'deep' is slower but reasonable; 'shallow' a performance enhancement but with side-effects
    const {
        props,
        ignore,
        batch,
        deep = true,
        bubble,
        bind
    } = options;

    // Ignore if the object is already observed
    if(obj.__observed) {
        return obj
    }

    // If the prop is explicitely not excluded
    const isWatched = prop => (!props || props.includes(prop)) && (!ignore || !ignore.includes(prop));

    // Add the object to the observers map.
    // observersMap signature : Map<Object, Map<Property, Set<Computed function>>>
    // In other words, observersMap is a map of observed objects.
    // For each observed object, each property is mapped with a set of computed functions depending on this property.
    // Whenever a property is set, we re-run each one of the functions stored inside the matching Set.
    observersMap.set(obj, new Map());

    // If the deep flag is set, observe nested objects/arrays
    if(deep) {
        Object.entries(obj).forEach(function([key, val]) {
            if(isObj(val)) {
                obj[key] = observe(val, options);
                // If bubble is set, we add keys to the object used to bubble up the mutation
                if(bubble) {
                    defineBubblingProperties(obj[key], key, obj);
                }
            }
        });
    }

    // Proxify the object in order to intercept get/set on props
    const proxy = new Proxy(obj, {
        get(_, prop) {
            if(prop === '__observed')
                return true

            // If the prop is watched
            if(isWatched(prop)) {
                // If a computed function is being run
                if(computedStack.length) {
                    const propertiesMap = observersMap.get(obj);
                    if(!propertiesMap.has(prop))
                        propertiesMap.set(prop, new Set());
                    // Tracks object and properties accessed during the function call
                    const tracker = computedDependenciesTracker.get(computedStack[0]);
                    if(tracker) {
                        if(!tracker.has(obj)) {
                            tracker.set(obj, new Set());
                        }
                        tracker.get(obj).add(prop);
                    }
                    // Link the computed function and the property being accessed
                    propertiesMap.get(prop).add(computedStack[0]);
                }
            }

            return obj[prop]
        },
        set(_, prop, value) {
            if(prop === '__handler') {
                // Don't track bubble handlers
                setHiddenKey(obj, '__handler', value);
            } else if(!isWatched(prop)) {
                // If the prop is ignored
                obj[prop] = value;
            } else if(Array.isArray(obj) && prop === 'length' || obj[prop] !== value) {
                // If the new/old value are not equal
                const deeper = deep && isObj(value);
                const propertiesMap = observersMap.get(obj);

                // Remove bubbling infrastructure and pass old value to handlers
                const oldValue = obj[prop];
                if(isObj(oldValue))
                    delete obj[prop];

                // If the deep flag is set we observe the newly set value
                obj[prop] = deeper ? observe(value, options) : value;

                // Co-opt assigned object into bubbling if appropriate
                if(deeper && bubble) {
                    defineBubblingProperties(obj[prop], prop, obj);
                }

                const ancestry = [ prop ];
                let parent = obj;
                while(parent) {
                    // If a handler explicitly returns 'false' then stop propagation
                    if(parent.__handler && parent.__handler(ancestry, value, oldValue, proxy) === false) {
                        break
                    }
                    // Continue propagation, traversing the mutated property's object hierarchy & call any __handlers along the way
                    if(parent.__key && parent.__parent) {
                        ancestry.unshift(parent.__key);
                        parent = parent.__parent;
                    } else {
                        parent = null;
                    }
                }

                const dependents = propertiesMap.get(prop);
                if(dependents) {
                    // Retrieve the computed functions depending on the prop
                    for(const dependent of dependents) {
                        const tracker = computedDependenciesTracker.get(dependent);
                        // If the function has been disposed or if the prop has not been used
                        // during the latest function call, delete the function reference
                        if(dependent.__disposed || tracker && (!tracker.has(obj) || !tracker.get(obj).has(prop))) {
                            dependents.delete(dependent);
                        } else if(dependent !== computedStack[0]) {
                            // Run the computed function
                            if(batch) {
                                enqueue(dependent, batch);
                            } else {
                                dependent();
                            }
                        }
                    }
                }
            }

            return true
        }
    });

    if(bind) {
        // Need this for binding es6 classes methods which are stored in the object prototype
        getInstanceMethodKeys(obj).forEach(key => obj[key] = obj[key].bind(proxy));
    }

    return proxy
}

const { computedStack: computedStack$1, computedDependenciesTracker: computedDependenciesTracker$1 } = data;

function computed(wrappedFunction, { autoRun = true, callback, bind, disableTracking = false } = {}) {
    // Proxify the function in order to intercept the calls
    const proxy = new Proxy(wrappedFunction, {
        apply(target, thisArg, argsList) {
            function observeComputation(fun) {
                // Track object and object properties accessed during this function call
                if(!disableTracking) {
                    computedDependenciesTracker$1.set(callback || proxy, new WeakMap());
                }
                // Store into the stack a reference to the computed function
                computedStack$1.unshift(callback || proxy);
                // Run the computed function - or the async function
                const result = fun ?
                    fun() :
                    target.apply(bind || thisArg, argsList);
                // Remove the reference
                computedStack$1.shift();
                // Return the result
                return result
            }

            // Inject the computeAsync argument which is used to manually declare when the computation takes part
            argsList.push({
                computeAsync: function(target) { return observeComputation(target) }
            });

            return observeComputation()
        }
    });

    // If autoRun, then call the function at once
    if(autoRun) {
        proxy();
    }

    return proxy
}

// The disposed flag which is used to remove a computed function reference pointer
function dispose(computedFunction) {
    data.computedDependenciesTracker.delete(computedFunction);
    return computedFunction.__disposed = true
}

var hr = {
    observe,
    computed,
    dispose
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const directives = new WeakMap();
/**
 * Brands a function as a directive factory function so that lit-html will call
 * the function during template rendering, rather than passing as a value.
 *
 * A _directive_ is a function that takes a Part as an argument. It has the
 * signature: `(part: Part) => void`.
 *
 * A directive _factory_ is a function that takes arguments for data and
 * configuration and returns a directive. Users of directive usually refer to
 * the directive factory as the directive. For example, "The repeat directive".
 *
 * Usually a template author will invoke a directive factory in their template
 * with relevant arguments, which will then return a directive function.
 *
 * Here's an example of using the `repeat()` directive factory that takes an
 * array and a function to render an item:
 *
 * ```js
 * html`<ul><${repeat(items, (item) => html`<li>${item}</li>`)}</ul>`
 * ```
 *
 * When `repeat` is invoked, it returns a directive function that closes over
 * `items` and the template function. When the outer template is rendered, the
 * return directive function is called with the Part for the expression.
 * `repeat` then performs it's custom logic to render multiple items.
 *
 * @param f The directive factory function. Must be a function that returns a
 * function of the signature `(part: Part) => void`. The returned function will
 * be called with the part object.
 *
 * @example
 *
 * import {directive, html} from 'lit-html';
 *
 * const immutable = directive((v) => (part) => {
 *   if (part.value !== v) {
 *     part.setValue(v)
 *   }
 * });
 */
const directive = (f) => ((...args) => {
    const d = f(...args);
    directives.set(d, true);
    return d;
});
const isDirective = (o) => {
    return typeof o === 'function' && directives.has(o);
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * True if the custom elements polyfill is in use.
 */
const isCEPolyfill = typeof window !== 'undefined' &&
    window.customElements != null &&
    window.customElements.polyfillWrapFlushCallback !==
        undefined;
/**
 * Reparents nodes, starting from `start` (inclusive) to `end` (exclusive),
 * into another container (could be the same container), before `before`. If
 * `before` is null, it appends the nodes to the container.
 */
const reparentNodes = (container, start, end = null, before = null) => {
    while (start !== end) {
        const n = start.nextSibling;
        container.insertBefore(start, before);
        start = n;
    }
};
/**
 * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
 * `container`.
 */
const removeNodes = (container, start, end = null) => {
    while (start !== end) {
        const n = start.nextSibling;
        container.removeChild(start);
        start = n;
    }
};

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {};
/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */
const nothing = {};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * Suffix appended to all bound attribute names.
 */
const boundAttributeSuffix = '$lit$';
/**
 * An updatable Template that tracks the location of dynamic parts.
 */
class Template {
    constructor(result, element) {
        this.parts = [];
        this.element = element;
        const nodesToRemove = [];
        const stack = [];
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(element.content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        // Keeps track of the last index associated with a part. We try to delete
        // unnecessary nodes, but we never want to associate two different parts
        // to the same index. They must have a constant node between.
        let lastPartIndex = 0;
        let index = -1;
        let partIndex = 0;
        const { strings, values: { length } } = result;
        while (partIndex < length) {
            const node = walker.nextNode();
            if (node === null) {
                // We've exhausted the content inside a nested template element.
                // Because we still have parts (the outer for-loop), we know:
                // - There is a template in the stack
                // - The walker will find a nextNode outside the template
                walker.currentNode = stack.pop();
                continue;
            }
            index++;
            if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                if (node.hasAttributes()) {
                    const attributes = node.attributes;
                    const { length } = attributes;
                    // Per
                    // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                    // attributes are not guaranteed to be returned in document order.
                    // In particular, Edge/IE can return them out of order, so we cannot
                    // assume a correspondence between part index and attribute index.
                    let count = 0;
                    for (let i = 0; i < length; i++) {
                        if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                            count++;
                        }
                    }
                    while (count-- > 0) {
                        // Get the template literal section leading up to the first
                        // expression in this attribute
                        const stringForPart = strings[partIndex];
                        // Find the attribute name
                        const name = lastAttributeNameRegex.exec(stringForPart)[2];
                        // Find the corresponding attribute
                        // All bound attributes have had a suffix added in
                        // TemplateResult#getHTML to opt out of special attribute
                        // handling. To look up the attribute value we also need to add
                        // the suffix.
                        const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                        const attributeValue = node.getAttribute(attributeLookupName);
                        node.removeAttribute(attributeLookupName);
                        const statics = attributeValue.split(markerRegex);
                        this.parts.push({ type: 'attribute', index, name, strings: statics });
                        partIndex += statics.length - 1;
                    }
                }
                if (node.tagName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
            }
            else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                const data = node.data;
                if (data.indexOf(marker) >= 0) {
                    const parent = node.parentNode;
                    const strings = data.split(markerRegex);
                    const lastIndex = strings.length - 1;
                    // Generate a new text node for each literal section
                    // These nodes are also used as the markers for node parts
                    for (let i = 0; i < lastIndex; i++) {
                        let insert;
                        let s = strings[i];
                        if (s === '') {
                            insert = createMarker();
                        }
                        else {
                            const match = lastAttributeNameRegex.exec(s);
                            if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                                s = s.slice(0, match.index) + match[1] +
                                    match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                            }
                            insert = document.createTextNode(s);
                        }
                        parent.insertBefore(insert, node);
                        this.parts.push({ type: 'node', index: ++index });
                    }
                    // If there's no text, we must insert a comment to mark our place.
                    // Else, we can trust it will stick around after cloning.
                    if (strings[lastIndex] === '') {
                        parent.insertBefore(createMarker(), node);
                        nodesToRemove.push(node);
                    }
                    else {
                        node.data = strings[lastIndex];
                    }
                    // We have a part for each match found
                    partIndex += lastIndex;
                }
            }
            else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                if (node.data === marker) {
                    const parent = node.parentNode;
                    // Add a new marker node to be the startNode of the Part if any of
                    // the following are true:
                    //  * We don't have a previousSibling
                    //  * The previousSibling is already the start of a previous part
                    if (node.previousSibling === null || index === lastPartIndex) {
                        index++;
                        parent.insertBefore(createMarker(), node);
                    }
                    lastPartIndex = index;
                    this.parts.push({ type: 'node', index });
                    // If we don't have a nextSibling, keep this node so we have an end.
                    // Else, we can remove it to save future costs.
                    if (node.nextSibling === null) {
                        node.data = '';
                    }
                    else {
                        nodesToRemove.push(node);
                        index--;
                    }
                    partIndex++;
                }
                else {
                    let i = -1;
                    while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                        // Comment node has a binding marker inside, make an inactive part
                        // The binding won't work, but subsequent bindings will
                        // TODO (justinfagnani): consider whether it's even worth it to
                        // make bindings in comments work
                        this.parts.push({ type: 'node', index: -1 });
                        partIndex++;
                    }
                }
            }
        }
        // Remove text binding nodes after the walk to not disturb the TreeWalker
        for (const n of nodesToRemove) {
            n.parentNode.removeChild(n);
        }
    }
}
const endsWith = (str, suffix) => {
    const index = str.length - suffix.length;
    return index >= 0 && str.slice(index) === suffix;
};
const isTemplatePartActive = (part) => part.index !== -1;
// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
const createMarker = () => document.createComment('');
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-characters
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
 * space character except " ".
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex = 
// eslint-disable-next-line no-control-regex
/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
class TemplateInstance {
    constructor(template, processor, options) {
        this.__parts = [];
        this.template = template;
        this.processor = processor;
        this.options = options;
    }
    update(values) {
        let i = 0;
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.setValue(values[i]);
            }
            i++;
        }
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.commit();
            }
        }
    }
    _clone() {
        // There are a number of steps in the lifecycle of a template instance's
        // DOM fragment:
        //  1. Clone - create the instance fragment
        //  2. Adopt - adopt into the main document
        //  3. Process - find part markers and create parts
        //  4. Upgrade - upgrade custom elements
        //  5. Update - set node, attribute, property, etc., values
        //  6. Connect - connect to the document. Optional and outside of this
        //     method.
        //
        // We have a few constraints on the ordering of these steps:
        //  * We need to upgrade before updating, so that property values will pass
        //    through any property setters.
        //  * We would like to process before upgrading so that we're sure that the
        //    cloned fragment is inert and not disturbed by self-modifying DOM.
        //  * We want custom elements to upgrade even in disconnected fragments.
        //
        // Given these constraints, with full custom elements support we would
        // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
        //
        // But Safari does not implement CustomElementRegistry#upgrade, so we
        // can not implement that order and still have upgrade-before-update and
        // upgrade disconnected fragments. So we instead sacrifice the
        // process-before-upgrade constraint, since in Custom Elements v1 elements
        // must not modify their light DOM in the constructor. We still have issues
        // when co-existing with CEv0 elements like Polymer 1, and with polyfills
        // that don't strictly adhere to the no-modification rule because shadow
        // DOM, which may be created in the constructor, is emulated by being placed
        // in the light DOM.
        //
        // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
        // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
        // in one step.
        //
        // The Custom Elements v1 polyfill supports upgrade(), so the order when
        // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
        // Connect.
        const fragment = isCEPolyfill ?
            this.template.element.content.cloneNode(true) :
            document.importNode(this.template.element.content, true);
        const stack = [];
        const parts = this.template.parts;
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        let partIndex = 0;
        let nodeIndex = 0;
        let part;
        let node = walker.nextNode();
        // Loop through all the nodes and parts of a template
        while (partIndex < parts.length) {
            part = parts[partIndex];
            if (!isTemplatePartActive(part)) {
                this.__parts.push(undefined);
                partIndex++;
                continue;
            }
            // Progress the tree walker until we find our next part's node.
            // Note that multiple parts may share the same node (attribute parts
            // on a single element), so this loop may not run at all.
            while (nodeIndex < part.index) {
                nodeIndex++;
                if (node.nodeName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
                if ((node = walker.nextNode()) === null) {
                    // We've exhausted the content inside a nested template element.
                    // Because we still have parts (the outer for-loop), we know:
                    // - There is a template in the stack
                    // - The walker will find a nextNode outside the template
                    walker.currentNode = stack.pop();
                    node = walker.nextNode();
                }
            }
            // We've arrived at our part's node.
            if (part.type === 'node') {
                const part = this.processor.handleTextExpression(this.options);
                part.insertAfterNode(node.previousSibling);
                this.__parts.push(part);
            }
            else {
                this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
            }
            partIndex++;
        }
        if (isCEPolyfill) {
            document.adoptNode(fragment);
            customElements.upgrade(fragment);
        }
        return fragment;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Our TrustedTypePolicy for HTML which is declared using the html template
 * tag function.
 *
 * That HTML is a developer-authored constant, and is parsed with innerHTML
 * before any untrusted expressions have been mixed in. Therefor it is
 * considered safe by construction.
 */
const policy = window.trustedTypes &&
    trustedTypes.createPolicy('lit-html', { createHTML: (s) => s });
const commentMarker = ` ${marker} `;
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
class TemplateResult {
    constructor(strings, values, type, processor) {
        this.strings = strings;
        this.values = values;
        this.type = type;
        this.processor = processor;
    }
    /**
     * Returns a string of HTML used to create a `<template>` element.
     */
    getHTML() {
        const l = this.strings.length - 1;
        let html = '';
        let isCommentBinding = false;
        for (let i = 0; i < l; i++) {
            const s = this.strings[i];
            // For each binding we want to determine the kind of marker to insert
            // into the template source before it's parsed by the browser's HTML
            // parser. The marker type is based on whether the expression is in an
            // attribute, text, or comment position.
            //   * For node-position bindings we insert a comment with the marker
            //     sentinel as its text content, like <!--{{lit-guid}}-->.
            //   * For attribute bindings we insert just the marker sentinel for the
            //     first binding, so that we support unquoted attribute bindings.
            //     Subsequent bindings can use a comment marker because multi-binding
            //     attributes must be quoted.
            //   * For comment bindings we insert just the marker sentinel so we don't
            //     close the comment.
            //
            // The following code scans the template source, but is *not* an HTML
            // parser. We don't need to track the tree structure of the HTML, only
            // whether a binding is inside a comment, and if not, if it appears to be
            // the first binding in an attribute.
            const commentOpen = s.lastIndexOf('<!--');
            // We're in comment position if we have a comment open with no following
            // comment close. Because <-- can appear in an attribute value there can
            // be false positives.
            isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
                s.indexOf('-->', commentOpen + 1) === -1;
            // Check to see if we have an attribute-like sequence preceding the
            // expression. This can match "name=value" like structures in text,
            // comments, and attribute values, so there can be false-positives.
            const attributeMatch = lastAttributeNameRegex.exec(s);
            if (attributeMatch === null) {
                // We're only in this branch if we don't have a attribute-like
                // preceding sequence. For comments, this guards against unusual
                // attribute values like <div foo="<!--${'bar'}">. Cases like
                // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
                // below.
                html += s + (isCommentBinding ? commentMarker : nodeMarker);
            }
            else {
                // For attributes we use just a marker sentinel, and also append a
                // $lit$ suffix to the name to opt-out of attribute-specific parsing
                // that IE and Edge do for style and certain SVG attributes.
                html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
                    attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] +
                    marker;
            }
        }
        html += this.strings[l];
        return html;
    }
    getTemplateElement() {
        const template = document.createElement('template');
        let value = this.getHTML();
        if (policy !== undefined) {
            // this is secure because `this.strings` is a TemplateStringsArray.
            // TODO: validate this when
            // https://github.com/tc39/proposal-array-is-template-object is
            // implemented.
            value = policy.createHTML(value);
        }
        template.innerHTML = value;
        return template;
    }
}
/**
 * A TemplateResult for SVG fragments.
 *
 * This class wraps HTML in an `<svg>` tag in order to parse its contents in the
 * SVG namespace, then modifies the template to remove the `<svg>` tag so that
 * clones only container the original fragment.
 */
class SVGTemplateResult extends TemplateResult {
    getHTML() {
        return `<svg>${super.getHTML()}</svg>`;
    }
    getTemplateElement() {
        const template = super.getTemplateElement();
        const content = template.content;
        const svgElement = content.firstChild;
        content.removeChild(svgElement);
        reparentNodes(content, svgElement.firstChild);
        return template;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const isPrimitive = (value) => {
    return (value === null ||
        !(typeof value === 'object' || typeof value === 'function'));
};
const isIterable = (value) => {
    return Array.isArray(value) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !!(value && value[Symbol.iterator]);
};
/**
 * Writes attribute values to the DOM for a group of AttributeParts bound to a
 * single attribute. The value is only set once even if there are multiple parts
 * for an attribute.
 */
class AttributeCommitter {
    constructor(element, name, strings) {
        this.dirty = true;
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.parts = [];
        for (let i = 0; i < strings.length - 1; i++) {
            this.parts[i] = this._createPart();
        }
    }
    /**
     * Creates a single part. Override this to create a differnt type of part.
     */
    _createPart() {
        return new AttributePart(this);
    }
    _getValue() {
        const strings = this.strings;
        const l = strings.length - 1;
        const parts = this.parts;
        // If we're assigning an attribute via syntax like:
        //    attr="${foo}"  or  attr=${foo}
        // but not
        //    attr="${foo} ${bar}" or attr="${foo} baz"
        // then we don't want to coerce the attribute value into one long
        // string. Instead we want to just return the value itself directly,
        // so that sanitizeDOMValue can get the actual value rather than
        // String(value)
        // The exception is if v is an array, in which case we do want to smash
        // it together into a string without calling String() on the array.
        //
        // This also allows trusted values (when using TrustedTypes) being
        // assigned to DOM sinks without being stringified in the process.
        if (l === 1 && strings[0] === '' && strings[1] === '') {
            const v = parts[0].value;
            if (typeof v === 'symbol') {
                return String(v);
            }
            if (typeof v === 'string' || !isIterable(v)) {
                return v;
            }
        }
        let text = '';
        for (let i = 0; i < l; i++) {
            text += strings[i];
            const part = parts[i];
            if (part !== undefined) {
                const v = part.value;
                if (isPrimitive(v) || !isIterable(v)) {
                    text += typeof v === 'string' ? v : String(v);
                }
                else {
                    for (const t of v) {
                        text += typeof t === 'string' ? t : String(t);
                    }
                }
            }
        }
        text += strings[l];
        return text;
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            this.element.setAttribute(this.name, this._getValue());
        }
    }
}
/**
 * A Part that controls all or part of an attribute value.
 */
class AttributePart {
    constructor(committer) {
        this.value = undefined;
        this.committer = committer;
    }
    setValue(value) {
        if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
            this.value = value;
            // If the value is a not a directive, dirty the committer so that it'll
            // call setAttribute. If the value is a directive, it'll dirty the
            // committer if it calls setValue().
            if (!isDirective(value)) {
                this.committer.dirty = true;
            }
        }
    }
    commit() {
        while (isDirective(this.value)) {
            const directive = this.value;
            this.value = noChange;
            directive(this);
        }
        if (this.value === noChange) {
            return;
        }
        this.committer.commit();
    }
}
/**
 * A Part that controls a location within a Node tree. Like a Range, NodePart
 * has start and end locations and can set and update the Nodes between those
 * locations.
 *
 * NodeParts support several value types: primitives, Nodes, TemplateResults,
 * as well as arrays and iterables of those types.
 */
class NodePart {
    constructor(options) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.options = options;
    }
    /**
     * Appends this part into a container.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendInto(container) {
        this.startNode = container.appendChild(createMarker());
        this.endNode = container.appendChild(createMarker());
    }
    /**
     * Inserts this part after the `ref` node (between `ref` and `ref`'s next
     * sibling). Both `ref` and its next sibling must be static, unchanging nodes
     * such as those that appear in a literal section of a template.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterNode(ref) {
        this.startNode = ref;
        this.endNode = ref.nextSibling;
    }
    /**
     * Appends this part into a parent part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendIntoPart(part) {
        part.__insert(this.startNode = createMarker());
        part.__insert(this.endNode = createMarker());
    }
    /**
     * Inserts this part after the `ref` part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterPart(ref) {
        ref.__insert(this.startNode = createMarker());
        this.endNode = ref.endNode;
        ref.endNode = this.startNode;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        if (this.startNode.parentNode === null) {
            return;
        }
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        const value = this.__pendingValue;
        if (value === noChange) {
            return;
        }
        if (isPrimitive(value)) {
            if (value !== this.value) {
                this.__commitText(value);
            }
        }
        else if (value instanceof TemplateResult) {
            this.__commitTemplateResult(value);
        }
        else if (value instanceof Node) {
            this.__commitNode(value);
        }
        else if (isIterable(value)) {
            this.__commitIterable(value);
        }
        else if (value === nothing) {
            this.value = nothing;
            this.clear();
        }
        else {
            // Fallback, will render the string representation
            this.__commitText(value);
        }
    }
    __insert(node) {
        this.endNode.parentNode.insertBefore(node, this.endNode);
    }
    __commitNode(value) {
        if (this.value === value) {
            return;
        }
        this.clear();
        this.__insert(value);
        this.value = value;
    }
    __commitText(value) {
        const node = this.startNode.nextSibling;
        value = value == null ? '' : value;
        // If `value` isn't already a string, we explicitly convert it here in case
        // it can't be implicitly converted - i.e. it's a symbol.
        const valueAsString = typeof value === 'string' ? value : String(value);
        if (node === this.endNode.previousSibling &&
            node.nodeType === 3 /* Node.TEXT_NODE */) {
            // If we only have a single text node between the markers, we can just
            // set its value, rather than replacing it.
            // TODO(justinfagnani): Can we just check if this.value is primitive?
            node.data = valueAsString;
        }
        else {
            this.__commitNode(document.createTextNode(valueAsString));
        }
        this.value = value;
    }
    __commitTemplateResult(value) {
        const template = this.options.templateFactory(value);
        if (this.value instanceof TemplateInstance &&
            this.value.template === template) {
            this.value.update(value.values);
        }
        else {
            // Make sure we propagate the template processor from the TemplateResult
            // so that we use its syntax extension, etc. The template factory comes
            // from the render function options so that it can control template
            // caching and preprocessing.
            const instance = new TemplateInstance(template, value.processor, this.options);
            const fragment = instance._clone();
            instance.update(value.values);
            this.__commitNode(fragment);
            this.value = instance;
        }
    }
    __commitIterable(value) {
        // For an Iterable, we create a new InstancePart per item, then set its
        // value to the item. This is a little bit of overhead for every item in
        // an Iterable, but it lets us recurse easily and efficiently update Arrays
        // of TemplateResults that will be commonly returned from expressions like:
        // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
        // If _value is an array, then the previous render was of an
        // iterable and _value will contain the NodeParts from the previous
        // render. If _value is not an array, clear this part and make a new
        // array for NodeParts.
        if (!Array.isArray(this.value)) {
            this.value = [];
            this.clear();
        }
        // Lets us keep track of how many items we stamped so we can clear leftover
        // items from a previous render
        const itemParts = this.value;
        let partIndex = 0;
        let itemPart;
        for (const item of value) {
            // Try to reuse an existing part
            itemPart = itemParts[partIndex];
            // If no existing part, create a new one
            if (itemPart === undefined) {
                itemPart = new NodePart(this.options);
                itemParts.push(itemPart);
                if (partIndex === 0) {
                    itemPart.appendIntoPart(this);
                }
                else {
                    itemPart.insertAfterPart(itemParts[partIndex - 1]);
                }
            }
            itemPart.setValue(item);
            itemPart.commit();
            partIndex++;
        }
        if (partIndex < itemParts.length) {
            // Truncate the parts array so _value reflects the current state
            itemParts.length = partIndex;
            this.clear(itemPart && itemPart.endNode);
        }
    }
    clear(startNode = this.startNode) {
        removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
    }
}
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
class BooleanAttributePart {
    constructor(element, name, strings) {
        this.value = undefined;
        this.__pendingValue = undefined;
        if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
            throw new Error('Boolean attributes can only contain a single expression');
        }
        this.element = element;
        this.name = name;
        this.strings = strings;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const value = !!this.__pendingValue;
        if (this.value !== value) {
            if (value) {
                this.element.setAttribute(this.name, '');
            }
            else {
                this.element.removeAttribute(this.name);
            }
            this.value = value;
        }
        this.__pendingValue = noChange;
    }
}
/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */
class PropertyCommitter extends AttributeCommitter {
    constructor(element, name, strings) {
        super(element, name, strings);
        this.single =
            (strings.length === 2 && strings[0] === '' && strings[1] === '');
    }
    _createPart() {
        return new PropertyPart(this);
    }
    _getValue() {
        if (this.single) {
            return this.parts[0].value;
        }
        return super._getValue();
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.element[this.name] = this._getValue();
        }
    }
}
class PropertyPart extends AttributePart {
}
// Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the third
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.
let eventOptionsSupported = false;
// Wrap into an IIFE because MS Edge <= v41 does not support having try/catch
// blocks right into the body of a module
(() => {
    try {
        const options = {
            get capture() {
                eventOptionsSupported = true;
                return false;
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.addEventListener('test', options, options);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.removeEventListener('test', options, options);
    }
    catch (_e) {
        // event options not supported
    }
})();
class EventPart {
    constructor(element, eventName, eventContext) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.element = element;
        this.eventName = eventName;
        this.eventContext = eventContext;
        this.__boundHandleEvent = (e) => this.handleEvent(e);
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const newListener = this.__pendingValue;
        const oldListener = this.value;
        const shouldRemoveListener = newListener == null ||
            oldListener != null &&
                (newListener.capture !== oldListener.capture ||
                    newListener.once !== oldListener.once ||
                    newListener.passive !== oldListener.passive);
        const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
        if (shouldRemoveListener) {
            this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        if (shouldAddListener) {
            this.__options = getOptions(newListener);
            this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        this.value = newListener;
        this.__pendingValue = noChange;
    }
    handleEvent(event) {
        if (typeof this.value === 'function') {
            this.value.call(this.eventContext || this.element, event);
        }
        else {
            this.value.handleEvent(event);
        }
    }
}
// We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.
const getOptions = (o) => o &&
    (eventOptionsSupported ?
        { capture: o.capture, passive: o.passive, once: o.once } :
        o.capture);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Creates Parts when a template is instantiated.
 */
class DefaultTemplateProcessor {
    /**
     * Create parts for an attribute-position binding, given the event, attribute
     * name, and string literals.
     *
     * @param element The element containing the binding
     * @param name  The attribute name
     * @param strings The string literals. There are always at least two strings,
     *   event for fully-controlled bindings with a single expression.
     */
    handleAttributeExpressions(element, name, strings, options) {
        const prefix = name[0];
        if (prefix === '.') {
            const committer = new PropertyCommitter(element, name.slice(1), strings);
            return committer.parts;
        }
        if (prefix === '@') {
            return [new EventPart(element, name.slice(1), options.eventContext)];
        }
        if (prefix === '?') {
            return [new BooleanAttributePart(element, name.slice(1), strings)];
        }
        const committer = new AttributeCommitter(element, name, strings);
        return committer.parts;
    }
    /**
     * Create parts for a text-position binding.
     * @param templateFactory
     */
    handleTextExpression(options) {
        return new NodePart(options);
    }
}
const defaultTemplateProcessor = new DefaultTemplateProcessor();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */
function templateFactory(result) {
    let templateCache = templateCaches.get(result.type);
    if (templateCache === undefined) {
        templateCache = {
            stringsArray: new WeakMap(),
            keyString: new Map()
        };
        templateCaches.set(result.type, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== undefined) {
        return template;
    }
    // If the TemplateStringsArray is new, generate a key from the strings
    // This key is shared between all templates with identical content
    const key = result.strings.join(marker);
    // Check if we already have a Template for this key
    template = templateCache.keyString.get(key);
    if (template === undefined) {
        // If we have not seen this key before, create a new Template
        template = new Template(result, result.getTemplateElement());
        // Cache the Template for this key
        templateCache.keyString.set(key, template);
    }
    // Cache all future queries for this TemplateStringsArray
    templateCache.stringsArray.set(result.strings, template);
    return template;
}
const templateCaches = new Map();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const parts = new WeakMap();
/**
 * Renders a template result or other value to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result Any value renderable by NodePart - typically a TemplateResult
 *     created by evaluating a template tag like `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */
const render = (result, container, options) => {
    let part = parts.get(container);
    if (part === undefined) {
        removeNodes(container, container.firstChild);
        parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
        part.appendInto(container);
    }
    part.setValue(result);
    part.commit();
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
if (typeof window !== 'undefined') {
    (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.3.0');
}
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);
/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 */
const svg = (strings, ...values) => new SVGTemplateResult(strings, values, 'svg', defaultTemplateProcessor);

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
function camelCase(str) {
    return str.replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}
function dashCase(str) {
    return str.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// Helper functions for manipulating parts
// TODO(kschaaf): Refactor into Part API?
const createAndInsertPart = (containerPart, beforePart) => {
    const container = containerPart.startNode.parentNode;
    const beforeNode = beforePart === undefined ? containerPart.endNode :
        beforePart.startNode;
    const startNode = container.insertBefore(createMarker(), beforeNode);
    container.insertBefore(createMarker(), beforeNode);
    const newPart = new NodePart(containerPart.options);
    newPart.insertAfterNode(startNode);
    return newPart;
};
const updatePart = (part, value) => {
    part.setValue(value);
    part.commit();
    return part;
};
const insertPartBefore = (containerPart, part, ref) => {
    const container = containerPart.startNode.parentNode;
    const beforeNode = ref ? ref.startNode : containerPart.endNode;
    const endNode = part.endNode.nextSibling;
    if (endNode !== beforeNode) {
        reparentNodes(container, part.startNode, endNode, beforeNode);
    }
};
const removePart = (part) => {
    removeNodes(part.startNode.parentNode, part.startNode, part.endNode.nextSibling);
};
// Helper for generating a map of array item to its index over a subset
// of an array (used to lazily generate `newKeyToIndexMap` and
// `oldKeyToIndexMap`)
const generateMap = (list, start, end) => {
    const map = new Map();
    for (let i = start; i <= end; i++) {
        map.set(list[i], i);
    }
    return map;
};
// Stores previous ordered list of parts and map of key to index
const partListCache = new WeakMap();
const keyListCache = new WeakMap();
/**
 * A directive that repeats a series of values (usually `TemplateResults`)
 * generated from an iterable, and updates those items efficiently when the
 * iterable changes based on user-provided `keys` associated with each item.
 *
 * Note that if a `keyFn` is provided, strict key-to-DOM mapping is maintained,
 * meaning previous DOM for a given key is moved into the new position if
 * needed, and DOM will never be reused with values for different keys (new DOM
 * will always be created for new keys). This is generally the most efficient
 * way to use `repeat` since it performs minimum unnecessary work for insertions
 * and removals.
 *
 * IMPORTANT: If providing a `keyFn`, keys *must* be unique for all items in a
 * given call to `repeat`. The behavior when two or more items have the same key
 * is undefined.
 *
 * If no `keyFn` is provided, this directive will perform similar to mapping
 * items to values, and DOM will be reused against potentially different items.
 */
const repeat = directive((items, keyFnOrTemplate, template) => {
    let keyFn;
    if (template === undefined) {
        template = keyFnOrTemplate;
    }
    else if (keyFnOrTemplate !== undefined) {
        keyFn = keyFnOrTemplate;
    }
    return (containerPart) => {
        if (!(containerPart instanceof NodePart)) {
            throw new Error('repeat can only be used in text bindings');
        }
        // Old part & key lists are retrieved from the last update
        // (associated with the part for this instance of the directive)
        const oldParts = partListCache.get(containerPart) || [];
        const oldKeys = keyListCache.get(containerPart) || [];
        // New part list will be built up as we go (either reused from
        // old parts or created for new keys in this update). This is
        // saved in the above cache at the end of the update.
        const newParts = [];
        // New value list is eagerly generated from items along with a
        // parallel array indicating its key.
        const newValues = [];
        const newKeys = [];
        let index = 0;
        for (const item of items) {
            newKeys[index] = keyFn ? keyFn(item, index) : index;
            newValues[index] = template(item, index);
            index++;
        }
        // Maps from key to index for current and previous update; these
        // are generated lazily only when needed as a performance
        // optimization, since they are only required for multiple
        // non-contiguous changes in the list, which are less common.
        let newKeyToIndexMap;
        let oldKeyToIndexMap;
        // Head and tail pointers to old parts and new values
        let oldHead = 0;
        let oldTail = oldParts.length - 1;
        let newHead = 0;
        let newTail = newValues.length - 1;
        // Overview of O(n) reconciliation algorithm (general approach
        // based on ideas found in ivi, vue, snabbdom, etc.):
        //
        // * We start with the list of old parts and new values (and
        //   arrays of their respective keys), head/tail pointers into
        //   each, and we build up the new list of parts by updating
        //   (and when needed, moving) old parts or creating new ones.
        //   The initial scenario might look like this (for brevity of
        //   the diagrams, the numbers in the array reflect keys
        //   associated with the old parts or new values, although keys
        //   and parts/values are actually stored in parallel arrays
        //   indexed using the same head/tail pointers):
        //
        //      oldHead v                 v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [ ,  ,  ,  ,  ,  ,  ]
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6] <- reflects the user's new
        //                                      item order
        //      newHead ^                 ^ newTail
        //
        // * Iterate old & new lists from both sides, updating,
        //   swapping, or removing parts at the head/tail locations
        //   until neither head nor tail can move.
        //
        // * Example below: keys at head pointers match, so update old
        //   part 0 in-place (no need to move it) and record part 0 in
        //   the `newParts` list. The last thing we do is advance the
        //   `oldHead` and `newHead` pointers (will be reflected in the
        //   next diagram).
        //
        //      oldHead v                 v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  ,  ] <- heads matched: update 0
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldHead
        //                                      & newHead
        //      newHead ^                 ^ newTail
        //
        // * Example below: head pointers don't match, but tail
        //   pointers do, so update part 6 in place (no need to move
        //   it), and record part 6 in the `newParts` list. Last,
        //   advance the `oldTail` and `oldHead` pointers.
        //
        //         oldHead v              v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  , 6] <- tails matched: update 6
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldTail
        //                                      & newTail
        //         newHead ^              ^ newTail
        //
        // * If neither head nor tail match; next check if one of the
        //   old head/tail items was removed. We first need to generate
        //   the reverse map of new keys to index (`newKeyToIndexMap`),
        //   which is done once lazily as a performance optimization,
        //   since we only hit this case if multiple non-contiguous
        //   changes were made. Note that for contiguous removal
        //   anywhere in the list, the head and tails would advance
        //   from either end and pass each other before we get to this
        //   case and removals would be handled in the final while loop
        //   without needing to generate the map.
        //
        // * Example below: The key at `oldTail` was removed (no longer
        //   in the `newKeyToIndexMap`), so remove that part from the
        //   DOM and advance just the `oldTail` pointer.
        //
        //         oldHead v           v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  , 6] <- 5 not in new map: remove
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    5 and advance oldTail
        //         newHead ^           ^ newTail
        //
        // * Once head and tail cannot move, any mismatches are due to
        //   either new or moved items; if a new key is in the previous
        //   "old key to old index" map, move the old part to the new
        //   location, otherwise create and insert a new part. Note
        //   that when moving an old part we null its position in the
        //   oldParts array if it lies between the head and tail so we
        //   know to skip it when the pointers get there.
        //
        // * Example below: neither head nor tail match, and neither
        //   were removed; so find the `newHead` key in the
        //   `oldKeyToIndexMap`, and move that old part's DOM into the
        //   next head position (before `oldParts[oldHead]`). Last,
        //   null the part in the `oldPart` array since it was
        //   somewhere in the remaining oldParts still to be scanned
        //   (between the head and tail pointers) so that we know to
        //   skip that old part on future iterations.
        //
        //         oldHead v        v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2,  ,  ,  ,  , 6] <- stuck: update & move 2
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    into place and advance
        //                                      newHead
        //         newHead ^           ^ newTail
        //
        // * Note that for moves/insertions like the one above, a part
        //   inserted at the head pointer is inserted before the
        //   current `oldParts[oldHead]`, and a part inserted at the
        //   tail pointer is inserted before `newParts[newTail+1]`. The
        //   seeming asymmetry lies in the fact that new parts are
        //   moved into place outside in, so to the right of the head
        //   pointer are old parts, and to the right of the tail
        //   pointer are new parts.
        //
        // * We always restart back from the top of the algorithm,
        //   allowing matching and simple updates in place to
        //   continue...
        //
        // * Example below: the head pointers once again match, so
        //   simply update part 1 and record it in the `newParts`
        //   array.  Last, advance both head pointers.
        //
        //         oldHead v        v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1,  ,  ,  , 6] <- heads matched: update 1
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldHead
        //                                      & newHead
        //            newHead ^        ^ newTail
        //
        // * As mentioned above, items that were moved as a result of
        //   being stuck (the final else clause in the code below) are
        //   marked with null, so we always advance old pointers over
        //   these so we're comparing the next actual old value on
        //   either end.
        //
        // * Example below: `oldHead` is null (already placed in
        //   newParts), so advance `oldHead`.
        //
        //            oldHead v     v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6] <- old head already used:
        //   newParts: [0, 2, 1,  ,  ,  , 6]    advance oldHead
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]
        //               newHead ^     ^ newTail
        //
        // * Note it's not critical to mark old parts as null when they
        //   are moved from head to tail or tail to head, since they
        //   will be outside the pointer range and never visited again.
        //
        // * Example below: Here the old tail key matches the new head
        //   key, so the part at the `oldTail` position and move its
        //   DOM to the new head position (before `oldParts[oldHead]`).
        //   Last, advance `oldTail` and `newHead` pointers.
        //
        //               oldHead v  v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4,  ,  , 6] <- old tail matches new
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]   head: update & move 4,
        //                                     advance oldTail & newHead
        //               newHead ^     ^ newTail
        //
        // * Example below: Old and new head keys match, so update the
        //   old head part in place, and advance the `oldHead` and
        //   `newHead` pointers.
        //
        //               oldHead v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4, 3,   ,6] <- heads match: update 3
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance oldHead &
        //                                      newHead
        //                  newHead ^  ^ newTail
        //
        // * Once the new or old pointers move past each other then all
        //   we have left is additions (if old list exhausted) or
        //   removals (if new list exhausted). Those are handled in the
        //   final while loops at the end.
        //
        // * Example below: `oldHead` exceeded `oldTail`, so we're done
        //   with the main loop.  Create the remaining part and insert
        //   it at the new head position, and the update is complete.
        //
        //                   (oldHead > oldTail)
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4, 3, 7 ,6] <- create and insert 7
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]
        //                     newHead ^ newTail
        //
        // * Note that the order of the if/else clauses is not
        //   important to the algorithm, as long as the null checks
        //   come first (to ensure we're always working on valid old
        //   parts) and that the final else clause comes last (since
        //   that's where the expensive moves occur). The order of
        //   remaining clauses is is just a simple guess at which cases
        //   will be most common.
        //
        // * TODO(kschaaf) Note, we could calculate the longest
        //   increasing subsequence (LIS) of old items in new position,
        //   and only move those not in the LIS set. However that costs
        //   O(nlogn) time and adds a bit more code, and only helps
        //   make rare types of mutations require fewer moves. The
        //   above handles removes, adds, reversal, swaps, and single
        //   moves of contiguous items in linear time, in the minimum
        //   number of moves. As the number of multiple moves where LIS
        //   might help approaches a random shuffle, the LIS
        //   optimization becomes less helpful, so it seems not worth
        //   the code at this point. Could reconsider if a compelling
        //   case arises.
        while (oldHead <= oldTail && newHead <= newTail) {
            if (oldParts[oldHead] === null) {
                // `null` means old part at head has already been used
                // below; skip
                oldHead++;
            }
            else if (oldParts[oldTail] === null) {
                // `null` means old part at tail has already been used
                // below; skip
                oldTail--;
            }
            else if (oldKeys[oldHead] === newKeys[newHead]) {
                // Old head matches new head; update in place
                newParts[newHead] =
                    updatePart(oldParts[oldHead], newValues[newHead]);
                oldHead++;
                newHead++;
            }
            else if (oldKeys[oldTail] === newKeys[newTail]) {
                // Old tail matches new tail; update in place
                newParts[newTail] =
                    updatePart(oldParts[oldTail], newValues[newTail]);
                oldTail--;
                newTail--;
            }
            else if (oldKeys[oldHead] === newKeys[newTail]) {
                // Old head matches new tail; update and move to new tail
                newParts[newTail] =
                    updatePart(oldParts[oldHead], newValues[newTail]);
                insertPartBefore(containerPart, oldParts[oldHead], newParts[newTail + 1]);
                oldHead++;
                newTail--;
            }
            else if (oldKeys[oldTail] === newKeys[newHead]) {
                // Old tail matches new head; update and move to new head
                newParts[newHead] =
                    updatePart(oldParts[oldTail], newValues[newHead]);
                insertPartBefore(containerPart, oldParts[oldTail], oldParts[oldHead]);
                oldTail--;
                newHead++;
            }
            else {
                if (newKeyToIndexMap === undefined) {
                    // Lazily generate key-to-index maps, used for removals &
                    // moves below
                    newKeyToIndexMap = generateMap(newKeys, newHead, newTail);
                    oldKeyToIndexMap = generateMap(oldKeys, oldHead, oldTail);
                }
                if (!newKeyToIndexMap.has(oldKeys[oldHead])) {
                    // Old head is no longer in new list; remove
                    removePart(oldParts[oldHead]);
                    oldHead++;
                }
                else if (!newKeyToIndexMap.has(oldKeys[oldTail])) {
                    // Old tail is no longer in new list; remove
                    removePart(oldParts[oldTail]);
                    oldTail--;
                }
                else {
                    // Any mismatches at this point are due to additions or
                    // moves; see if we have an old part we can reuse and move
                    // into place
                    const oldIndex = oldKeyToIndexMap.get(newKeys[newHead]);
                    const oldPart = oldIndex !== undefined ? oldParts[oldIndex] : null;
                    if (oldPart === null) {
                        // No old part for this value; create a new one and
                        // insert it
                        const newPart = createAndInsertPart(containerPart, oldParts[oldHead]);
                        updatePart(newPart, newValues[newHead]);
                        newParts[newHead] = newPart;
                    }
                    else {
                        // Reuse old part
                        newParts[newHead] =
                            updatePart(oldPart, newValues[newHead]);
                        insertPartBefore(containerPart, oldPart, oldParts[oldHead]);
                        // This marks the old part as having been used, so that
                        // it will be skipped in the first two checks above
                        oldParts[oldIndex] = null;
                    }
                    newHead++;
                }
            }
        }
        // Add parts for any remaining new values
        while (newHead <= newTail) {
            // For all remaining additions, we insert before last new
            // tail, since old pointers are no longer valid
            const newPart = createAndInsertPart(containerPart, newParts[newTail + 1]);
            updatePart(newPart, newValues[newHead]);
            newParts[newHead++] = newPart;
        }
        // Remove any remaining unused old parts
        while (oldHead <= oldTail) {
            const oldPart = oldParts[oldHead++];
            if (oldPart !== null) {
                removePart(oldPart);
            }
        }
        // Save order of new parts for next round
        partListCache.set(containerPart, newParts);
        keyListCache.set(containerPart, newKeys);
    };
});

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const templateCaches$1 = new WeakMap();
/**
 * Enables fast switching between multiple templates by caching the DOM nodes
 * and TemplateInstances produced by the templates.
 *
 * Example:
 *
 * ```
 * let checked = false;
 *
 * html`
 *   ${cache(checked ? html`input is checked` : html`input is not checked`)}
 * `
 * ```
 */
const cache = directive((value) => (part) => {
    if (!(part instanceof NodePart)) {
        throw new Error('cache can only be used in text bindings');
    }
    let templateCache = templateCaches$1.get(part);
    if (templateCache === undefined) {
        templateCache = new WeakMap();
        templateCaches$1.set(part, templateCache);
    }
    const previousValue = part.value;
    // First, can we update the current TemplateInstance, or do we need to move
    // the current nodes into the cache?
    if (previousValue instanceof TemplateInstance) {
        if (value instanceof TemplateResult &&
            previousValue.template === part.options.templateFactory(value)) {
            // Same Template, just trigger an update of the TemplateInstance
            part.setValue(value);
            return;
        }
        else {
            // Not the same Template, move the nodes from the DOM into the cache.
            let cachedTemplate = templateCache.get(previousValue.template);
            if (cachedTemplate === undefined) {
                cachedTemplate = {
                    instance: previousValue,
                    nodes: document.createDocumentFragment(),
                };
                templateCache.set(previousValue.template, cachedTemplate);
            }
            reparentNodes(cachedTemplate.nodes, part.startNode.nextSibling, part.endNode);
        }
    }
    // Next, can we reuse nodes from the cache?
    if (value instanceof TemplateResult) {
        const template = part.options.templateFactory(value);
        const cachedTemplate = templateCache.get(template);
        if (cachedTemplate !== undefined) {
            // Move nodes out of cache
            part.setValue(cachedTemplate.nodes);
            part.commit();
            // Set the Part value to the TemplateInstance so it'll update it.
            part.value = cachedTemplate.instance;
        }
    }
    part.setValue(value);
});

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const _state = new WeakMap();
// Effectively infinity, but a SMI.
const _infinity = 0x7fffffff;
/**
 * Renders one of a series of values, including Promises, to a Part.
 *
 * Values are rendered in priority order, with the first argument having the
 * highest priority and the last argument having the lowest priority. If a
 * value is a Promise, low-priority values will be rendered until it resolves.
 *
 * The priority of values can be used to create placeholder content for async
 * data. For example, a Promise with pending content can be the first,
 * highest-priority, argument, and a non_promise loading indicator template can
 * be used as the second, lower-priority, argument. The loading indicator will
 * render immediately, and the primary content will render when the Promise
 * resolves.
 *
 * Example:
 *
 *     const content = fetch('./content.txt').then(r => r.text());
 *     html`${until(content, html`<span>Loading...</span>`)}`
 */
const until = directive((...args) => (part) => {
    let state = _state.get(part);
    if (state === undefined) {
        state = {
            lastRenderedIndex: _infinity,
            values: [],
        };
        _state.set(part, state);
    }
    const previousValues = state.values;
    let previousLength = previousValues.length;
    state.values = args;
    for (let i = 0; i < args.length; i++) {
        // If we've rendered a higher-priority value already, stop.
        if (i > state.lastRenderedIndex) {
            break;
        }
        const value = args[i];
        // Render non-Promise values immediately
        if (isPrimitive(value) ||
            typeof value.then !== 'function') {
            part.setValue(value);
            state.lastRenderedIndex = i;
            // Since a lower-priority value will never overwrite a higher-priority
            // synchronous value, we can stop processing now.
            break;
        }
        // If this is a Promise we've already handled, skip it.
        if (i < previousLength && value === previousValues[i]) {
            continue;
        }
        // We have a Promise that we haven't seen before, so priorities may have
        // changed. Forget what we rendered before.
        state.lastRenderedIndex = _infinity;
        previousLength = 0;
        Promise.resolve(value).then((resolvedValue) => {
            const index = state.values.indexOf(value);
            // If state.values doesn't contain the value, we've re-rendered without
            // the value, so don't render it. Then, only render if the value is
            // higher-priority than what's already been rendered.
            if (index > -1 && index < state.lastRenderedIndex) {
                state.lastRenderedIndex = index;
                part.setValue(resolvedValue);
                part.commit();
            }
        });
    }
});

/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Checks binding values against live DOM values, instead of previously bound
 * values, when determining whether to update the value.
 *
 * This is useful for cases where the DOM value may change from outside of
 * lit-html, such as with a binding to an `<input>` element's `value` property,
 * a content editable elements text, or to a custom element that changes it's
 * own properties or attributes.
 *
 * In these cases if the DOM value changes, but the value set through lit-html
 * bindings hasn't, lit-html won't know to update the DOM value and will leave
 * it alone. If this is not what you want—if you want to overwrite the DOM
 * value with the bound value no matter what—use the `live()` directive:
 *
 *     html`<input .value=${live(x)}>`
 *
 * `live()` performs a strict equality check agains the live DOM value, and if
 * the new value is equal to the live value, does nothing. This means that
 * `live()` should not be used when the binding will cause a type conversion. If
 * you use `live()` with an attribute binding, make sure that only strings are
 * passed in, or the binding will update every render.
 */
const live = directive((value) => (part) => {
    let previousValue;
    if (part instanceof EventPart || part instanceof NodePart) {
        throw new Error('The `live` directive is not allowed on text or event bindings');
    }
    if (part instanceof BooleanAttributePart) {
        checkStrings(part.strings);
        previousValue = part.element.hasAttribute(part.name);
        // This is a hack needed because BooleanAttributePart doesn't have a
        // committer and does its own dirty checking after directives
        part.value = previousValue;
    }
    else {
        const { element, name, strings } = part.committer;
        checkStrings(strings);
        if (part instanceof PropertyPart) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            previousValue = element[name];
            if (previousValue === value) {
                return;
            }
        }
        else if (part instanceof AttributePart) {
            previousValue = element.getAttribute(name);
        }
        if (previousValue === String(value)) {
            return;
        }
    }
    part.setValue(value);
});
const checkStrings = (strings) => {
    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
        throw new Error('`live` bindings can only contain a single expression');
    }
};

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const previousValues = new WeakMap();
/**
 * Prevents re-render of a template function until a single value or an array of
 * values changes.
 *
 * Example:
 *
 * ```js
 * html`
 *   <div>
 *     ${guard([user.id, company.id], () => html`...`)}
 *   </div>
 * ```
 *
 * In this case, the template only renders if either `user.id` or `company.id`
 * changes.
 *
 * guard() is useful with immutable data patterns, by preventing expensive work
 * until data updates.
 *
 * Example:
 *
 * ```js
 * html`
 *   <div>
 *     ${guard([immutableItems], () => immutableItems.map(i => html`${i}`))}
 *   </div>
 * ```
 *
 * In this case, items are mapped over only when the array reference changes.
 *
 * @param value the value to check before re-rendering
 * @param f the template function
 */
const guard = directive((value, f) => (part) => {
    const previousValue = previousValues.get(part);
    if (Array.isArray(value)) {
        // Dirty-check arrays by item
        if (Array.isArray(previousValue) &&
            previousValue.length === value.length &&
            value.every((v, i) => v === previousValue[i])) {
            return;
        }
    }
    else if (previousValue === value &&
        (value !== undefined || previousValues.has(part))) {
        // Dirty-check non-arrays by identity
        return;
    }
    part.setValue(f());
    // Copy the value if it's an array so that if it's mutated we don't forget
    // what the previous values were.
    previousValues.set(part, Array.isArray(value) ? Array.from(value) : value);
});

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// IE11 doesn't support classList on SVG elements, so we emulate it with a Set
class ClassList {
    constructor(element) {
        this.classes = new Set();
        this.changed = false;
        this.element = element;
        const classList = (element.getAttribute('class') || '').split(/\s+/);
        for (const cls of classList) {
            this.classes.add(cls);
        }
    }
    add(cls) {
        this.classes.add(cls);
        this.changed = true;
    }
    remove(cls) {
        this.classes.delete(cls);
        this.changed = true;
    }
    commit() {
        if (this.changed) {
            let classString = '';
            this.classes.forEach((cls) => classString += cls + ' ');
            this.element.setAttribute('class', classString);
        }
    }
}
/**
 * Stores the ClassInfo object applied to a given AttributePart.
 * Used to unset existing values when a new ClassInfo object is applied.
 */
const previousClassesCache = new WeakMap();
/**
 * A directive that applies CSS classes. This must be used in the `class`
 * attribute and must be the only part used in the attribute. It takes each
 * property in the `classInfo` argument and adds the property name to the
 * element's `class` if the property value is truthy; if the property value is
 * falsey, the property name is removed from the element's `class`. For example
 * `{foo: bar}` applies the class `foo` if the value of `bar` is truthy.
 * @param classInfo {ClassInfo}
 */
const classMap = directive((classInfo) => (part) => {
    if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
        part.committer.name !== 'class' || part.committer.parts.length > 1) {
        throw new Error('The `classMap` directive must be used in the `class` attribute ' +
            'and must be the only part in the attribute.');
    }
    const { committer } = part;
    const { element } = committer;
    let previousClasses = previousClassesCache.get(part);
    if (previousClasses === undefined) {
        // Write static classes once
        // Use setAttribute() because className isn't a string on SVG elements
        element.setAttribute('class', committer.strings.join(' '));
        previousClassesCache.set(part, previousClasses = new Set());
    }
    const classList = (element.classList || new ClassList(element));
    // Remove old classes that no longer apply
    // We use forEach() instead of for-of so that re don't require down-level
    // iteration.
    previousClasses.forEach((name) => {
        if (!(name in classInfo)) {
            classList.remove(name);
            previousClasses.delete(name);
        }
    });
    // Add or remove classes based on their classMap value
    for (const name in classInfo) {
        const value = classInfo[name];
        if (value != previousClasses.has(name)) {
            // We explicitly want a loose truthy check of `value` because it seems
            // more convenient that '' and 0 are skipped.
            if (value) {
                classList.add(name);
                previousClasses.add(name);
            }
            else {
                classList.remove(name);
                previousClasses.delete(name);
            }
        }
    }
    if (typeof classList.commit === 'function') {
        classList.commit();
    }
});

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Stores the StyleInfo object applied to a given AttributePart.
 * Used to unset existing values when a new StyleInfo object is applied.
 */
const previousStylePropertyCache = new WeakMap();
/**
 * A directive that applies CSS properties to an element.
 *
 * `styleMap` can only be used in the `style` attribute and must be the only
 * expression in the attribute. It takes the property names in the `styleInfo`
 * object and adds the property values as CSS properties. Property names with
 * dashes (`-`) are assumed to be valid CSS property names and set on the
 * element's style object using `setProperty()`. Names without dashes are
 * assumed to be camelCased JavaScript property names and set on the element's
 * style object using property assignment, allowing the style object to
 * translate JavaScript-style names to CSS property names.
 *
 * For example `styleMap({backgroundColor: 'red', 'border-top': '5px', '--size':
 * '0'})` sets the `background-color`, `border-top` and `--size` properties.
 *
 * @param styleInfo {StyleInfo}
 */
const styleMap = directive((styleInfo) => (part) => {
    if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
        part.committer.name !== 'style' || part.committer.parts.length > 1) {
        throw new Error('The `styleMap` directive must be used in the style attribute ' +
            'and must be the only part in the attribute.');
    }
    const { committer } = part;
    const { style } = committer.element;
    let previousStyleProperties = previousStylePropertyCache.get(part);
    if (previousStyleProperties === undefined) {
        // Write static styles once
        style.cssText = committer.strings.join(' ');
        previousStylePropertyCache.set(part, previousStyleProperties = new Set());
    }
    // Remove old properties that no longer exist in styleInfo
    // We use forEach() instead of for-of so that re don't require down-level
    // iteration.
    previousStyleProperties.forEach((name) => {
        if (!(name in styleInfo)) {
            previousStyleProperties.delete(name);
            if (name.indexOf('-') === -1) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style[name] = null;
            }
            else {
                style.removeProperty(name);
            }
        }
    });
    // Add or update properties
    for (const name in styleInfo) {
        previousStyleProperties.add(name);
        if (name.indexOf('-') === -1) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style[name] = styleInfo[name];
        }
        else {
            style.setProperty(name, styleInfo[name]);
        }
    }
});

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const previousValues$1 = new WeakMap();
/**
 * For AttributeParts, sets the attribute if the value is defined and removes
 * the attribute if the value is undefined.
 *
 * For other part types, this directive is a no-op.
 */
const ifDefined = directive((value) => (part) => {
    const previousValue = previousValues$1.get(part);
    if (value === undefined && part instanceof AttributePart) {
        // If the value is undefined, remove the attribute, but only if the value
        // was previously defined.
        if (previousValue !== undefined || !previousValues$1.has(part)) {
            const name = part.committer.name;
            part.committer.element.removeAttribute(name);
        }
    }
    else if (value !== previousValue) {
        part.setValue(value);
    }
    previousValues$1.set(part, value);
});

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
var __asyncValues = (undefined && undefined.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
/**
 * A directive that renders the items of an async iterable[1], appending new
 * values after previous values, similar to the built-in support for iterables.
 *
 * Async iterables are objects with a [Symbol.asyncIterator] method, which
 * returns an iterator who's `next()` method returns a Promise. When a new
 * value is available, the Promise resolves and the value is appended to the
 * Part controlled by the directive. If another value other than this
 * directive has been set on the Part, the iterable will no longer be listened
 * to and new values won't be written to the Part.
 *
 * [1]: https://github.com/tc39/proposal-async-iteration
 *
 * @param value An async iterable
 * @param mapper An optional function that maps from (value, index) to another
 *     value. Useful for generating templates for each item in the iterable.
 */
const asyncAppend = directive((value, mapper) => async (part) => {
    var e_1, _a;
    if (!(part instanceof NodePart)) {
        throw new Error('asyncAppend can only be used in text bindings');
    }
    // If we've already set up this particular iterable, we don't need
    // to do anything.
    if (value === part.value) {
        return;
    }
    part.value = value;
    // We keep track of item Parts across iterations, so that we can
    // share marker nodes between consecutive Parts.
    let itemPart;
    let i = 0;
    try {
        for (var value_1 = __asyncValues(value), value_1_1; value_1_1 = await value_1.next(), !value_1_1.done;) {
            let v = value_1_1.value;
            // Check to make sure that value is the still the current value of
            // the part, and if not bail because a new value owns this part
            if (part.value !== value) {
                break;
            }
            // When we get the first value, clear the part. This lets the
            // previous value display until we can replace it.
            if (i === 0) {
                part.clear();
            }
            // As a convenience, because functional-programming-style
            // transforms of iterables and async iterables requires a library,
            // we accept a mapper function. This is especially convenient for
            // rendering a template for each item.
            if (mapper !== undefined) {
                // This is safe because T must otherwise be treated as unknown by
                // the rest of the system.
                v = mapper(v, i);
            }
            // Like with sync iterables, each item induces a Part, so we need
            // to keep track of start and end nodes for the Part.
            // Note: Because these Parts are not updatable like with a sync
            // iterable (if we render a new value, we always clear), it may
            // be possible to optimize away the Parts and just re-use the
            // Part.setValue() logic.
            let itemStartNode = part.startNode;
            // Check to see if we have a previous item and Part
            if (itemPart !== undefined) {
                // Create a new node to separate the previous and next Parts
                itemStartNode = createMarker();
                // itemPart is currently the Part for the previous item. Set
                // it's endNode to the node we'll use for the next Part's
                // startNode.
                itemPart.endNode = itemStartNode;
                part.endNode.parentNode.insertBefore(itemStartNode, part.endNode);
            }
            itemPart = new NodePart(part.options);
            itemPart.insertAfterNode(itemStartNode);
            itemPart.setValue(v);
            itemPart.commit();
            i++;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (value_1_1 && !value_1_1.done && (_a = value_1.return)) await _a.call(value_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
var __asyncValues$1 = (undefined && undefined.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
/**
 * A directive that renders the items of an async iterable[1], replacing
 * previous values with new values, so that only one value is ever rendered
 * at a time.
 *
 * Async iterables are objects with a [Symbol.asyncIterator] method, which
 * returns an iterator who's `next()` method returns a Promise. When a new
 * value is available, the Promise resolves and the value is rendered to the
 * Part controlled by the directive. If another value other than this
 * directive has been set on the Part, the iterable will no longer be listened
 * to and new values won't be written to the Part.
 *
 * [1]: https://github.com/tc39/proposal-async-iteration
 *
 * @param value An async iterable
 * @param mapper An optional function that maps from (value, index) to another
 *     value. Useful for generating templates for each item in the iterable.
 */
const asyncReplace = directive((value, mapper) => async (part) => {
    var e_1, _a;
    if (!(part instanceof NodePart)) {
        throw new Error('asyncReplace can only be used in text bindings');
    }
    // If we've already set up this particular iterable, we don't need
    // to do anything.
    if (value === part.value) {
        return;
    }
    // We nest a new part to keep track of previous item values separately
    // of the iterable as a value itself.
    const itemPart = new NodePart(part.options);
    part.value = value;
    let i = 0;
    try {
        for (var value_1 = __asyncValues$1(value), value_1_1; value_1_1 = await value_1.next(), !value_1_1.done;) {
            let v = value_1_1.value;
            // Check to make sure that value is the still the current value of
            // the part, and if not bail because a new value owns this part
            if (part.value !== value) {
                break;
            }
            // When we get the first value, clear the part. This let's the
            // previous value display until we can replace it.
            if (i === 0) {
                part.clear();
                itemPart.appendIntoPart(part);
            }
            // As a convenience, because functional-programming-style
            // transforms of iterables and async iterables requires a library,
            // we accept a mapper function. This is especially convenient for
            // rendering a template for each item.
            if (mapper !== undefined) {
                // This is safe because T must otherwise be treated as unknown by
                // the rest of the system.
                v = mapper(v, i);
            }
            itemPart.setValue(v);
            itemPart.commit();
            i++;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (value_1_1 && !value_1_1.done && (_a = value_1.return)) await _a.call(value_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});

/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// For each part, remember the value that was last rendered to the part by the
// templateContent directive, and the DocumentFragment that was last set as a
// value. The DocumentFragment is used as a unique key to check if the last
// value rendered to the part was with templateContent. If not, we'll always
// re-render the value passed to templateContent.
const previousValues$2 = new WeakMap();
/**
 * Renders the content of a template element as HTML.
 *
 * Note, the template should be developer controlled and not user controlled.
 * Rendering a user-controlled template with this directive
 * could lead to cross-site-scripting vulnerabilities.
 */
const templateContent = directive((template) => (part) => {
    if (!(part instanceof NodePart)) {
        throw new Error('templateContent can only be used in text bindings');
    }
    const previousValue = previousValues$2.get(part);
    if (previousValue !== undefined && template === previousValue.template &&
        part.value === previousValue.fragment) {
        return;
    }
    const fragment = document.importNode(template.content, true);
    part.setValue(fragment);
    previousValues$2.set(part, { template, fragment });
});

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// For each part, remember the value that was last rendered to the part by the
// unsafeHTML directive, and the DocumentFragment that was last set as a value.
// The DocumentFragment is used as a unique key to check if the last value
// rendered to the part was with unsafeHTML. If not, we'll always re-render the
// value passed to unsafeHTML.
const previousValues$3 = new WeakMap();
/**
 * Renders the result as HTML, rather than text.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
const unsafeHTML = directive((value) => (part) => {
    if (!(part instanceof NodePart)) {
        throw new Error('unsafeHTML can only be used in text bindings');
    }
    const previousValue = previousValues$3.get(part);
    if (previousValue !== undefined && isPrimitive(value) &&
        value === previousValue.value && part.value === previousValue.fragment) {
        return;
    }
    const template = document.createElement('template');
    template.innerHTML = value; // innerHTML casts to string internally
    const fragment = document.importNode(template.content, true);
    part.setValue(fragment);
    previousValues$3.set(part, { value, fragment });
});

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// For each part, remember the value that was last rendered to the part by the
// unsafeSVG directive, and the DocumentFragment that was last set as a value.
// The DocumentFragment is used as a unique key to check if the last value
// rendered to the part was with unsafeSVG. If not, we'll always re-render the
// value passed to unsafeSVG.
const previousValues$4 = new WeakMap();
const isIe = window.navigator.userAgent.indexOf('Trident/') > 0;
/**
 * Renders the result as SVG, rather than text.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
const unsafeSVG = directive((value) => (part) => {
    if (!(part instanceof NodePart)) {
        throw new Error('unsafeSVG can only be used in text bindings');
    }
    const previousValue = previousValues$4.get(part);
    if (previousValue !== undefined && isPrimitive(value) &&
        value === previousValue.value && part.value === previousValue.fragment) {
        return;
    }
    const template = document.createElement('template');
    const content = template.content;
    let svgElement;
    if (isIe) {
        // IE can't set innerHTML of an svg element. However, it also doesn't
        // support Trusted Types, so it's ok for us to use a string when setting
        // innerHTML.
        template.innerHTML = `<svg>${value}</svg>`;
        svgElement = content.firstChild;
    }
    else {
        svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        content.appendChild(svgElement);
        svgElement.innerHTML = value;
    }
    content.removeChild(svgElement);
    reparentNodes(content, svgElement.firstChild);
    const fragment = document.importNode(content, true);
    part.setValue(fragment);
    previousValues$4.set(part, { value, fragment });
});

const each = (items, template, keyFn = (item) => item) => repeat(items, keyFn, template);

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
    part.setValue({ handleEvent, capture: true });
});

const once = directive((handleEvent) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"once" directive can only be used in event listeners');
    }
    part.setValue({ handleEvent, once: true });
});

const passive = directive((handleEvent) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"passive" directive can only be used in event listeners');
    }
    part.setValue({ handleEvent, passive: true });
});

const prevent = directive((handleEvent) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"prevent" directive can only be used in event listeners');
    }
    part.setValue(function (event) {
        event.preventDefault();
        handleEvent.call(this, event);
    });
});

const stop = directive((handleEvent, immediate = false) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"stop" directive can only be used in event listeners');
    }
    part.setValue(function (event) {
        immediate ? event.stopImmediatePropagation() : event.stopPropagation();
        handleEvent.call(this, event);
    });
});

const self = directive((handleEvent) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"self" directive can only be used in event listeners');
    }
    part.setValue(function (event) {
        (event.target === this) && handleEvent.call(this, event);
    });
});

const { observe: observe$1, computed: computed$1, dispose: dispose$1 } = hr;
const noop = () => { };
const tick = (fn = noop) => new Promise((resolve) => setTimeout(resolve)).then(fn);
const $ = (_a, ...context) => {
    var { render: template = () => nothing, state: data = {}, target = document.body } = _a, options = __rest(_a, ["render", "state", "target"]);
    const model = (typeof data === 'function') ? data(...context) : data;
    Object.entries(target.dataset).forEach(([key, value]) => {
        if (key in model)
            model[key] = attrToVal(value);
    });
    const state = observe$1(model, Object.assign({ batch: true, deep: true, bind: true }, options));
    const emit = (name, detail, { bubbles = false, cancelable = true } = {}) => {
        target.dispatchEvent(new CustomEvent(name, { detail, bubbles, cancelable }));
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
    const renderer = computed$1(({ computeAsync }) => {
        if (mounted && !document.contains(target))
            return destroy();
        return Promise.resolve().then(() => computeAsync(rerender));
    });
    const events = new Set();
    const on = (...args) => {
        target.addEventListener(...args);
        const off = () => {
            target.removeEventListener(...args);
            return events.delete(off);
        };
        events.add(off);
        return off;
    };
    const effects = new Set();
    const effect = (...args) => {
        const handle = computed$1(...args);
        const cancel = () => {
            dispose$1(handle);
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
        dispose$1(renderer);
        effects.forEach((cancel) => cancel());
        effects.clear();
        events.forEach((off) => off());
        events.clear();
        target.innerHTML = '';
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
        render: rerender
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
    return Object.assign(Object.assign({}, widgets), { effect: (fn, opts) => widgets.map((widget) => widget.effect(fn(widget.state), opts)), on: (...args) => widgets.map((widget) => widget.on(...args)), destroy: () => widgets.forEach((widget) => widget.destroy()), render: () => widgets.forEach((widget) => widget.render()), state: (fn) => {
            widgets.forEach((widget) => fn(widget.state));
        }, ctx: (fn) => fn(...context), forEach: Array.prototype.forEach.bind(widgets), target });
};

export { $, $$, AttributeCommitter, AttributePart, BooleanAttributePart, DefaultTemplateProcessor, EventPart, NodePart, PropertyCommitter, PropertyPart, SVGTemplateResult, Template, TemplateInstance, TemplateResult, asyncAppend, asyncReplace, bind, cache, call, capture, classMap, computed$1 as computed, createMarker, decorator, defaultTemplateProcessor, directive, dispose$1 as dispose, each, guard, html, ifDefined, isDirective, isIterable, isPrimitive, isTemplatePartActive, live, noChange, noop, nothing, observe$1 as observe, once, parts, passive, prevent, ref, removeNodes, render, reparentNodes, repeat, self, stop, styleMap, svg, templateCaches, templateContent, templateFactory, tick, unsafeHTML, unsafeSVG, until };
