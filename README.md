[![perlite logo](/docs/logo.svg)]()

[![npm](https://img.shields.io/npm/v/perlite?style=flat-square)](https://www.npmjs.com/package/perlite)
![npm type definitions](https://img.shields.io/npm/types/perlite?style=flat-square)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/perlite?style=flat-square)](https://bundlephobia.com/result?p=perlite)
![GitHub](https://img.shields.io/github/license/PaulMaly/perlite?style=flat-square)

> hy**per**activ 🌋 + **lit**-html* ☄️ + **e**xtensions* 🌊 = **perlite** 💎.

*Perlite* is a **simple** and **declarative** way to create rich client-side widgets designed with server-side apps in mind. Completely based on native/vanilla Javascript standards and doesn't require additional build steps or compilation.

## 🚩 Table of contents

- [Description & Features](https://github.com/PaulMaly/perlite#-features).
- [Installation](https://github.com/PaulMaly/perlite#-installation)
    - [NPM](https://github.com/PaulMaly/perlite#npm)
    - [CDN](https://github.com/PaulMaly/perlite#cdn)
    - [Distribution](https://github.com/PaulMaly/perlite#distribution)
- [Basic usage](https://github.com/PaulMaly/perlite#-basic-usage)
    - [Widget declaration](https://github.com/PaulMaly/perlite#widget-declaration)
    - [Widget creation](https://github.com/PaulMaly/perlite#widget-creation)
    - [Widget multiple instantiation](https://github.com/PaulMaly/perlite#widget-multiple-instantiation)
    - [Widget container](https://github.com/PaulMaly/perlite#widget-container)
    - [Widget state](https://github.com/PaulMaly/perlite#widget-state)
        - [Reactivity system]()
    - [Widget template](https://github.com/PaulMaly/perlite#widget-template)
        - [Template syntax]()
        - [Using expressions]()
        - [Text bindings]()
        - [Attribute bindings]()
        - [Event listeners]()
        - [Template fragments]()
        - [Control flow]()
            - [Conditions]()
            - [Looping]()        
        - [Rendering]()
    - [Widget lifecycle events](https://github.com/PaulMaly/perlite#widget-lifecycle-events)
    - [Widget API](https://github.com/PaulMaly/perlite#widget-api)
        - [$widget.target: HTMLElement | Node;]()
        - [$widget.state: ProxyConstructor;]()
        - [$widget.model: object;]()
        - [$widget.effect(fn: () => void, opts?: object): () => void;]()
        - [$widget.on(type: string, fn: (e: CustomEvent) => void, opts?: object | boolean): () => void;]()
        - [$widget.render(): void;]()
        - [$widget.destroy(): void;]()
        - [$widget.ctx(fn: (...ctx: any[]) => any): any;]()
    - [Widget container API](https://github.com/PaulMaly/perlite#widget-container-api)
        - [$$widgets[index: number]: Widget;]()
        - [$$widgets.target: NodeList | Node[];]()
        - [$$widgets.state(fn: (state: ProxyConstructor) => void): void;]()
        - [$$widgets.effect(fn: (state: ProxyConstructor) => () => void, opts?: object): (() => void)[];]()
        - [$$widgets.on(type: string, fn: (e: CustomEvent) => void, opts?: object | boolean): (() => void)[];]()
        - [$$widgets.render(): void;]()
        - [$$widgets.destroy(): void;]()
        - [$$widgets.ctx(fn: (...ctx: any[]) => any): any;]()
        - [$$widgets.forEach(fn: (widget: Widget, index: number, widgets: Widget[]) => void): any;]()
- [Advanced usage](https://github.com/PaulMaly/perlite#-advanced-usage)
    - [Directives](https://github.com/PaulMaly/perlite#directives)
        - [Lit-html directives]()
        - [Lists & keys]()
        - [Event listener modifiers]()
        - [Refs & decorators]()
    - [Custom directive](https://github.com/PaulMaly/perlite#custom-directives)
    - [Widget context](https://github.com/PaulMaly/perlite#widget-context)
    - [Widget nesting](https://github.com/PaulMaly/perlite#widget-nesting)
    - [Global state](https://github.com/PaulMaly/perlite#global-state)
    - [Styling](https://github.com/PaulMaly/perlite#styling)
    - [Transitions](https://github.com/PaulMaly/perlite#transitions)
    - [Utilities](https://github.com/PaulMaly/perlite#utilities)
- [Typescript support](https://github.com/PaulMaly/perlite#-typescript-support)
- [Browsers support](https://github.com/PaulMaly/perlite#-browsers-support)
- [License](https://github.com/PaulMaly/perlite#-license)

## 📋 Description & Features

Unlike the other frontend frameworks, eg. *React*, *Vue*, *Angular* or *Svelte*, which are mostly created for building SPA/RIA applications, **Perlite**'s main goal is to make the life of developers of classical server-side applications a little bit easier and the modern front-end development techniques more accessible. Without extra knowledge of building tools and other dark sides of the frontend ecosystem . 👾

**Perlite** gives you a combination of the best ideas from the most popular SPA frameworks, like **UI is a function of a state** (React), **reactive state driven development** (Vue), **observables** (Angular) and **lack of Virtual DOM** (Svelte).

**Perlite** focuses on building **standalone** UI widgets placed across different parts of the server-generated page and provides handy tools to manage these widgets and interact between them.

## 📦 Installation

### NPM

```sh
npm i --save perlite
```

or

```sh
yarn add perlite
```

and use it

```javascript
import { html } from 'perlite';
```

### CDN

If you are **not** using NPM, in modern browsers, you can import bundled ES module from CDN:

```javascript
import { html } from 'https://unpkg.com/perlite@latest/dist/perlite.min.mjs';
```

or

just add a regular `script`-tag to your html for legacy browsers:

```html
<script src="https://unpkg.com/perlite@latest/dist/perlite.min.js"></script>
```

and use it via global namespace:

```javascript
const { html } = window.perlite;
```

CDNs: [UNPKG](https://unpkg.com/perlite/) | [jsDelivr](https://cdn.jsdelivr.net/npm/perlite/).

### Distribution

+ `dist/index.js` - UMD output
+ `dist/index.mjs` - ESM output
+ `dist/index.min.js` - UMD output (minified)
+ `dist/index.min.mjs` - ESM output (minified)
+ `dist/perlite.js` - IIFE bundle
+ `dist/perlite.mjs` - ESM bundle
+ `dist/perlite.min.js` - IIFE bundle (minified)
+ `dist/perlite.min.mjs` - ESM bundle (minified)

## 🔨 Basic usage

### Widget declaration

Basically, the widget consists of two main parts:  `state` (object or function) and  `render` function. Use ES6 [Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) to describe your templates and [tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates) them by special `html` function imported from `perlite`.

```javascript
import { html } from 'perlite';

export const state = {
    name: 'world'
};

export function render(state, emit) {
    return html`
        <h1>Hello ${state.name}</h1>
    `
}
```

### Widget creation

To create a new widget and append it to the page, import and call `$` constructor function and pass the config object with several properties:

* `target` - DOM element where the widget will be rendered;
* `state` - object or function representing the state of the widget;
* `render` - a function representing a declarative template of the widget;
* any [hyperactiv options](https://github.com/elbywan/hyperactiv#observe) for reactivity system (you __don't__ need to change the defaults in most cases)

As an example, you can use ES6 [Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to pass widget declaration exports to the constructor.

```javascript
import { $ } from 'perlite';

import * as HelloWorld from './widgets/HelloWorld.js';

export const $helloWorld = $({
    target: document.getElementById('helloWorld-widget'),
    ...HelloWorld
});
```

The constructor function will return an object which allows you to manage a widget. To distinguish widgets from regular JS objects, it's recommended to follow the naming convention by prefixing widget names with the `$`. 

Actually, a widget object is just a namespace without any overall context. So, you can use ES6 [Destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) and use things separately:

```javascript
const { 
    destroy,
    render,
    target,
    state, 
    effect,
    ctx,
    on, 
} = $helloWorld;
```

### Widget multiple instantiation

Most often widget is a singleton, but in many cases, you need to use multiple widgets with the same declaration, but an isolated state. First of all, you need to use `state` function, instead of an object, in widget declaration. This function should return a new state object, otherwise, `state` will be shared between all widgets with the same declaration.

```javascript
export function state() {
    return {
        name: 'world'
    };
}
```

After that, you can call `$` function multiple times with the different `targets`:

```javascript
import { $ } from 'perlite';

import * as HelloWorld from './widgets/HelloWorld.js';

export const $helloWorld1 = $({
    target: document.getElementById('helloWorld-widget-1'),
    ...HelloWorld
});

export const $helloWorld2 = $({
    target: document.getElementById('helloWorld-widget-2'),
    ...HelloWorld
});
```

### Widget container

When you deal with multiple widget instantiations, sometimes you want to work with them in the same manner. To do that, you can use the handy `$$` container function to work with a bunch of widgets at once:

```javascript
import { $$ } from 'perlite';

import * as HelloWorld from './widgets/HelloWorld.js';

export const $$helloWorlds = $$({
    target: document.querySelectorAll('.helloWorld-widget'),
    ...HelloWorld
});
```

Please, use `$$` (double `$`) prefix to visually distinguish widget containers from single widgets and regular JS objects.

Widgets and widget containers have mostly the same APIs, but having specifics at some points. For example, these functions will work the same for the end-user:

```javascript
$widget.on('eventName', () => { ... }); // add event listener for the widget
$$widgets.on('eventName', () => { ... }); // add event listener for every widget in container

$widget.render(); // re-render the widget
$$widgets.render(); // re-render all widgets in container

$widget.destroy(); // destroy widget
$$widgets.destroy(); // destroy all widgets in container
```

The other APIs looks the same, but should be used differently:

```javascript
$widget.state.foo = 1; // directly change the state of the widget

$$widgets.state(state$ => { // use it as a function with callback
    state$.foo = 1;
});

$widget.effect(() => { ... }); // add effect for the widget
$$widgets.effect(state$ => () => { ... }); // add effect for every widget in container
```

Also, you can iterate through the container using `forEach`:

```javascript
$$widgets.forEach(widget => {
    // do your custom logic with each widget
});
```

### Widget state

WIP

#### Reactivity system

### Widget template

WIP

#### Template syntax

#### Text bindings

```javascript
html`
    <h1>Title: ${title}</h1>
`;
```

#### Using expressions

```javascript
html`
    <h1>${title}</h1>
    <h2>${a + b}</h2>
    <h3>${user.name}</h3>
    <h4>${description.substring(50)}</h4>
    <h5>${formatDate(user.birthDay)}</h5>
`;
```

#### Attribute bindings

```javascript
html`
    <input value=${title}>
    <div class="default-class ${class}"></div>
`;
```

##### Boolean attributes

```javascript
html`
    <button ?disabled=${isDisabled}>Click me</button>
`;
```

##### Bind to properties

```javascript
html`
    <input .value=${title}>
`;
```

#### Event listeners

```javascript
html`
    <input @input=${handleInput}>
    <button @click=${e => alert('Clicked!')}>Click me</button>
`;
```

#### Template fragments

```javascript
function render(state, emit) {

    const welcomeMessage = html`<h1>Welcome ${state.user.name}</h1>`;

    return html`
        ${welcomeMessage}
        <a href="/logout">Logout</a>
    `;
}
```

```javascript
function userInfo(user) {
    return html`
        <dl>
            <dt>User name:</dt>
            <dd>${user.name}</dd>
            <dt>Email address:</dt>
            <dd>${user.email}</dd>
            <dt>Birthday:</dt>
            <dd>${formatDate(user.birthDay)}</dd>
        </dl>
    `;
}

function render(state, emit) {
    return html`
        <h1>${state.title}</h1>
        ${userInfo(state.user)}
    `;
}
```

#### Control flow

##### Conditions

in template

```javascript
html`
  ${state.user ? html`
        <h1>Welcome ${state.user.name}</h1>
        <a href="/logout">Logout</a>
    ` : html`
        <a href="/login">Login</a>
    `
  }
`;
```

or in code

```javascript

function userMessage(user) {
    if (user) {
        return html`
            <h1>Welcome ${user.name}</h1>
            <a href="/logout">Logout</a>
        `;
    } else {
        return html`
            <a href="/login">Login</a>
        `;
    }
}

function render(state, emit) {
    return html`
        ${userMessage(state.user)}
    `;
}
```

##### Looping

in template

```javascript
html`
  <ul>
    ${state.items.map((item) => html`
        <li>${item.title}</li>
    `)}
  </ul>
`;
```

or in code

```javascript
function itemsList(items) {
    return items.map((item) => html`
        <li>${item.title}</li>
    `);
}

function render(state, emit) {
    return html`
        <ul>
            ${itemsList(state.items)}
        </ul>
    `;
}
```

#### Rendering

WIP

### Widget lifecycle events

These events are pre-defined and emitted on `target` node as the other widget custom events. In most cases, you should use the built-in [`on()`]() function, but you also can do-it-yourself and use the regular `target.addEventListener()` function, but don't forget to remove when you don't need it.

+ `mount` - fires once when the component has been first time rendered to the DOM;
+ `state` - fires on every state change, before DOM update;
+ `update` - fires on every DOM updated, after `state` event;
+ `destroy` - fires once when the component is removed from the DOM;

Each life-cycle event receives a [`model`]() of the widget in `event.detail`. This state is not reactive and its changes won't trigger widget re-rendering. If you *really* need to start new rendering cycle from a life-cycle event handler (basically, you shouldn't do that), you can use reactive [`state`]() or manual call [`render()`]() function via widget object.

### Widget API

#### $widget.target: HTMLElement | Node;

Just a reference to target node of a widget.

#### $widget.state: ProxyConstructor;

Reactive state of a widget based on initial state object (called model). Changing this state will perform a re-render and DOM updates.

```javascript
$widget.state.foo = 1; // widget scheduled for update
$widget.state.bar = true;
$widget.state.baz = 'horse'; // updates will be bunched
```

#### $widget.model: object;

It's just a reference to plain state object, which is a model for reactive state (proxy target). You can changing this model, but because it's not reactive, re-rendering won't be performed. To apply these changes to the DOM you can use [`render()`]() function.

#### $widget.effect(fn: () => void, opts?: object): () => void;

The effect is a function which executed each time its dependencies changed. Dependencies are tracked automatically and don't need to be explicitly specified.

```javascript
const cancal = $widget.effect(() => {
    console.log('Foo is changed:', $widget.state.foo);
});
...
// somewhere latter
cancel();
```

`effect()` function is just a wrapper ontop of [hyperactiv's `computed()`](https://github.com/elbywan/hyperactiv#2-define-computed-functions) with automatic dispose on widget destroy. So, you can use all things described in [hyperactiv docs](https://github.com/elbywan/hyperactiv). This function return `cancel()` function, so you can dispose of an effect when you actually don't need it:

#### $widget.on(type: string, fn: (e: CustomEvent) => void, opts?: object | boolean): () => void;

This function lets you add an event listener to the widget to catch custom events dispatched by `emit()` function and automatically removes the handler on widget destroy. Also, you can remove the handler manually using `off()` function:

```javascript
const off = $widget.on('my-custom-event', (event) => {
    console.log('Event payload', event.detail);
});
...
// somewhere latter
off();
```

#### $widget.render(): void;

Call this function to manually re-render a widget. Usually, it's not necessary, because you need just use a state-based approach and change the reactive state to automatically perform a re-render. But sometimes you may want to force the DOM update. This function is idempotent and safe to re-call. If actual state wasn't changed, no changes in DOM will performed. 

#### $widget.destroy(): void;

Completelly destroy a widget, removes all event listeners and effects, and clean up the markup. It also fires a [`destroy`](https://github.com/PaulMaly/perlite#widget-lifecycle-events) life-cycle event.

Calling this function is the most proper way to destroy the widget, but if, for some reason, the `target` node will be removed from the DOM by external code, it will be tracked on the next render cycle, and destroy operations will be performed automatically.

#### $widget.ctx(fn: (...ctx: any[]) => any): any;

This function receives callback function to get context values passed to the widget during creation.

```javascript
$widget.ctx((foo, bar, baz) => {
    console.log('widget context values', foo, bar, baz);
});
```

`ctx()` function is fully synchronous and just return the result of callback. So you can return nececeries values directly and chain it with the other methods.

```javascript
const bar = $widget.ctx((foo, bar, baz) => bar);

$widget.ctx((...ctx) => ctx).forEach((val) => ...);
```

More details about [context](https://github.com/PaulMaly/perlite#widget-context).

### Widget container API

WIP

#### $$widgets[index: number]: Widget;

#### $$widgets.target: NodeList | Node[];

#### $$widgets.state(fn: (state: ProxyConstructor) => void): void;

#### $$widgets.effect(fn: (state: ProxyConstructor) => () => void, opts?: object): (() => void)[];

#### $$widgets.on(type: string, fn: (e: CustomEvent) => void, opts?: object | boolean): (() => void)[];

#### $$widgets.render(): void;

#### $$widgets.destroy(): void;

#### $$widgets.ctx(fn: (...ctx: any[]) => any): any;

#### $$widgets.forEach(fn: (widget: Widget, index: number, widgets: Widget[]) => void): void;

## 🛠 Advanced usage

WIP

### Directives

#### Lit-html directives

#### Lists & keys

#### Event listener modifiers

#### Refs & decorators

### Custom directive

### Widget context

### Widget nesting

### Global state (store)

```javascript
import { observe } from 'perlite';

export const store$ = observe({
    products: [],
    config: {},
    user: {},
});
```

As it's often in *Angular*, use observables named with a trailing “$” sign to distinguish it from the other objects.

```javascript
import { computed, dispose } from 'perlite';
import { store$ } from './store.js';

const userSubscription = computed(() => {
    console.log('User data has changed', store$.user);
});
...
dispose(userSubscription);
```

To subscribe to store changes use `computed` function to perform any side-effect you need. Don't forget to dispose a subscription when you don't need it anymore.

Read more about these things in [hyperactiv docs](https://github.com/elbywan/hyperactiv#usage).

You able to use stores inside of widget just imported them:

```javascript
import store$ from './store.js'
...
function userInfo(user) { ... }
...
function render(state, emit) {
    return html`
        <h1>${state.title}</h1>
        ${userInfo(store$.user)}
    `;
}
```

But to re-render the widget when observable store has changed, you should manually subscribe and call `render()` function somewhere outside of widget declaration:

```javascript
computed(() => store$ && $widget.render());
...
store$.user = user; // will re-render the widget now
```

### Styling

### Transitions

### Utilities

#### tick(fn?: () => any): Promise<any>;

#### memo(fn: (...args: any[]) => any, invalidate?: (...args: any[]) => any): (...args: any[]) => any;

#### attrToVal(str: string): any;

#### camelCase(str: string): string;

#### dashCase(str: string): string;

## ⌨️ Typescript support

## 🌐 Browsers support

## 📜 License

This software is licensed under the MIT © PaulMaly.