[![perlite logo](/docs/logo.svg)]()

[![npm](https://img.shields.io/npm/v/perlite?style=flat-square)](https://www.npmjs.com/package/perlite)
![npm type definitions](https://img.shields.io/npm/types/perlite?style=flat-square)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/perlite?style=flat-square)](https://bundlephobia.com/result?p=perlite)
![GitHub](https://img.shields.io/github/license/PaulMaly/perlite?style=flat-square)

> hy**per**activ 🌋 + **lit**-html ☄️ + **e**xtensions 🌊 = **perlite** 💎.

**Perlite** is a **simple** and **declarative** way to create rich client-side widgets designed with server-side apps in mind. Completely based on native/vanilla Javascript standards and doesn't require additional build steps or compilation. Plays well with server-side rendered apps and [micro-frontends](https://micro-frontends.org/). For more details read the [description](https://github.com/PaulMaly/perlite#-description--features).

## 🚩 Table of contents

- [Description & Features](https://github.com/PaulMaly/perlite#-description--features).
- [Installation](https://github.com/PaulMaly/perlite#-installation)
  - [NPM](https://github.com/PaulMaly/perlite#npm)
  - [CDN](https://github.com/PaulMaly/perlite#cdn)
  - [Distribution](https://github.com/PaulMaly/perlite#distribution)
- [Examples](https://github.com/PaulMaly/perlite#-examples)
  - [TodoMVC](https://github.com/PaulMaly/perlite#todomvc)
  - [Simple Shop](https://github.com/PaulMaly/perlite#simple-shop)
- [Basic usage](https://github.com/PaulMaly/perlite#-basic-usage)
  - [Widget declaration](https://github.com/PaulMaly/perlite#widget-declaration)
  - [Widget creation](https://github.com/PaulMaly/perlite#widget-creation)
  - [Widget multiple instantiation](https://github.com/PaulMaly/perlite#widget-multiple-instantiation)
  - [Widget container](https://github.com/PaulMaly/perlite#widget-container)
  - [Widget state](https://github.com/PaulMaly/perlite#widget-state)
    - [Reactivity](https://github.com/PaulMaly/perlite#reactivity)
    - [Actions](https://github.com/PaulMaly/perlite#actions)
  - [Widget template](https://github.com/PaulMaly/perlite#widget-template)
    - [Template syntax](https://github.com/PaulMaly/perlite#template-syntax)
    - [Text bindings](https://github.com/PaulMaly/perlite#text-bindings)
    - [Using expressions](https://github.com/PaulMaly/perlite#using-expressions)
    - [Attribute bindings](https://github.com/PaulMaly/perlite#attribute-bindings)
    - [Event listeners](https://github.com/PaulMaly/perlite#event-listeners)
    - [Template fragments](https://github.com/PaulMaly/perlite#template-fragments)
    - [Control flow](https://github.com/PaulMaly/perlite#control-flow)
      - [Conditions](https://github.com/PaulMaly/perlite#conditions)
      - [Looping](https://github.com/PaulMaly/perlite#looping)
    - [Rendering](https://github.com/PaulMaly/perlite#rendering)
  - [Widget lifecycle events](https://github.com/PaulMaly/perlite#widget-lifecycle-events)
  - [Widget API](https://github.com/PaulMaly/perlite#widget-api)
    - [$widget.target: HTMLElement | Node;](https://github.com/PaulMaly/perlite#widgettarget-htmlelement--node)
    - [$widget.state: ProxyConstructor;](https://github.com/PaulMaly/perlite#widgetstate-proxyconstructor)
    - [$widget.model: object;](https://github.com/PaulMaly/perlite#widgetmodel-object)
    - [$widget.effect(fn: () => void, opts?: object): () => void;](https://github.com/PaulMaly/perlite#widgeteffectfn---void-opts-object---void)
    - [$widget.on(type: string, fn: (e: CustomEvent) => void, opts?: object | boolean): () => void;](https://github.com/PaulMaly/perlite#widgetontype-string-fn-e-customevent--void-opts-object--boolean---void)
    - [$widget.render(): void;](https://github.com/PaulMaly/perlite#widgetrender-void)
    - [$widget.destroy(): void;](https://github.com/PaulMaly/perlite#widgetdestroy-void)
    - [$widget.ctx(fn: (...ctx: any[]) => any): any;](https://github.com/PaulMaly/perlite#widgetctxfn-ctx-any--any-any)
  - [Widget container API](https://github.com/PaulMaly/perlite#widget-container-api)
    - [$$widgets[index: number]: Widget;](https://github.com/PaulMaly/perlite#widgetsindex-number-widget)
    - [$$widgets.target: NodeList | Node[];](https://github.com/PaulMaly/perlite#widgetstarget-nodelist--node)
    - [$$widgets.state(fn: (state: ProxyConstructor) => void): void;](https://github.com/PaulMaly/perlite#widgetsstatefn-state-proxyconstructor--void-void)
    - [$$widgets.effect(fn: (state: ProxyConstructor) => () => void, opts?: object): (() => void)[];](https://github.com/PaulMaly/perlite#widgetseffectfn-state-proxyconstructor----void-opts-object---void)
    - [$$widgets.on(type: string, fn: (e: CustomEvent) => void, opts?: object | boolean): (() => void)[];](https://github.com/PaulMaly/perlite#widgetsontype-string-fn-e-customevent--void-opts-object--boolean---void)
    - [$$widgets.render(): void;](https://github.com/PaulMaly/perlite#widgetsrender-void)
    - [$$widgets.destroy(): void;](https://github.com/PaulMaly/perlite#widgetsdestroy-void)
    - [$$widgets.ctx(fn: (...ctx: any[]) => any): any;](https://github.com/PaulMaly/perlite#widgetsctxfn-ctx-any--any-any)
    - [$$widgets.forEach(fn: (widget: Widget, index: number, widgets: Widget[]) => void): any;](https://github.com/PaulMaly/perlite#widgetsforeachfn-widget-widget-index-number-widgets-widget--void-void)
- [Advanced usage](https://github.com/PaulMaly/perlite#-advanced-usage)
  - [Setting the initial widget state during SSR](https://github.com/PaulMaly/perlite#setting-the-initial-widget-state-during-ssr)
  - [Directives](https://github.com/PaulMaly/perlite#directives)
    - [Lit-html directives](https://github.com/PaulMaly/perlite#lit-html-directives)
    - [Lists & keys](https://github.com/PaulMaly/perlite#lists--keys)
    - [Event listener modifiers](https://github.com/PaulMaly/perlite#event-listener-modifiers)
    - [Refs & decorators](https://github.com/PaulMaly/perlite#refs--decorators)
  - [Custom directive](https://github.com/PaulMaly/perlite#custom-directives)
  - [Widget context](https://github.com/PaulMaly/perlite#widget-context)
  - [Widget nesting](https://github.com/PaulMaly/perlite#widget-nesting)
  - [Shared state](https://github.com/PaulMaly/perlite#shared-state)
  - [Styling](https://github.com/PaulMaly/perlite#styling)
  - [Transitions](https://github.com/PaulMaly/perlite#transitions)
  - [Utilities](https://github.com/PaulMaly/perlite#utilities)
- [Structuring your project](https://github.com/PaulMaly/perlite#-structuring-your-project)
- [Tooling](https://github.com/PaulMaly/perlite#-tooling)
- [Typescript support](https://github.com/PaulMaly/perlite#-typescript-support)
- [Browsers support](https://github.com/PaulMaly/perlite#-browsers-support)
- [License](https://github.com/PaulMaly/perlite#-license)

## 💡 Description & Features

Unlike the other frontend frameworks, eg. *React*, *Vue*, *Angular* or *Svelte*, which are mostly created for building SPA/RIA applications, **Perlite**'s main goal is to make the life of developers of classical server-side applications a little bit easier and the modern front-end development techniques more accessible. Without extra knowledge of building tools and other dark sides of the frontend ecosystem . 👾

**Perlite** gives you a combination of the best ideas from the most popular SPA frameworks, like **UI is a function of a state** (React), **reactive state driven development** (Vue), **observables** (Angular) and **lack of Virtual DOM** (Svelte).

**Perlite** focuses on building **standalone** UI widgets placed across different parts of the server-generated page and provides handy tools to manage these widgets and interact between them.

Built on top [**lit-html**](https://lit-html.polymer-project.org/) - an efficient, expressive, extensible HTML templating library and [**hyperactiv**](https://github.com/elbywan/hyperactiv) - a super tiny reactive library. This means that your widgets will have a reactive state with direct object mutations, super-fast DOM updates, and low memory consumption.

The full bundle size of **Perlite** library is just **8.8Kb (min+gz)**. In addition, it's optimized for tree-shaking, so you can reduce the final size if not all features are used. At the same time, **Perlite** is full-featured enough to fulfill its purposes and no additional tools you needed in most of the cases.

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

## 🕹 Examples

### TodoMVC

[TodoMVC](https://github.com/PaulMaly/perlite/tree/main/examples/todomvc)

- single widget app;
- multiple fragments;
- store with actions for todos list with side-effect to the `sessionStorage`;
- based on [ES dev server](https://www.npmjs.com/package/es-dev-server) and NPM.

### Simple Shop

[Simple shop](https://github.com/PaulMaly/perlite/tree/main/examples/shop)

- server-generated page (actually a static file);
- multiple client-side widgets and basic interactions between them;
- based on static web server and CDN.

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

For example, you can use ES6 [Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to pass widget declaration exports to the constructor.

```javascript
import { $ } from 'perlite';

import * as HelloWorld from './widgets/HelloWorld.js';

export const $helloWorld = $({
    target: document.getElementById('helloWorld-widget'),
    ...HelloWorld
});
```

The constructor function will return an object which allows you to manage a widget. To distinguish widgets from regular JS objects, it's recommended to follow the naming convention by prefixing widget names with the “$” sign.

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

Please, use `$$` (double “$” sign) prefix to visually distinguish widget containers from single widgets and regular JS objects.

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

#### Reactivity

WIP

#### Actions

WIP

### Widget template

WIP

#### Template syntax

WIP

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
    <input value="${title}">
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
  ${state.user ?
    html`
        <h1>Welcome ${state.user.name}</h1>
        <a href="/logout">Logout</a>
    ` :
    html`
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
+ `error` - fires on exception occur during the rendering cycle;

Each life-cycle event, except `error`, receives a [`model`]() of the widget in `event.detail`. This state is not reactive and its changes won't trigger widget re-rendering. If you *really* need to start new DOM update cycle from a life-cycle event handler (basically, you shouldn't do that), you can use reactive [`state`]() or manual call [`render()`]() function via widget object.

In difference with the other life-cycle events, `error` event receives an exception in `event.detail`.

```javascript
$widget.on('update', e => {
    console.log('Widget DOM updated. The current model is: ', e.detail);
});

$widget.on('destroy', e => {
    console.log('Widget is destroyed.');
});

$widget.on('error', e => {
    console.error(e.detail.message);
});
```

### Widget API

#### $widget.target: HTMLElement | Node

Just a reference to target node of a widget.

#### $widget.state: ProxyConstructor

Reactive state of a widget based on initial state object (called model). Changing this state will perform a re-render and DOM updates.

```javascript
$widget.state.foo = 1; // widget scheduled for update
$widget.state.bar = true;
$widget.state.baz = 'horse'; // updates will be bunched
```

#### $widget.model: object

It's just a reference to plain state object, which is a model for reactive state (proxy target). You can changing this model, but because it's not reactive, re-rendering won't be performed. To apply these changes to the DOM you can use [`render()`]() function.

#### $widget.effect(fn: () => void, opts?: object): () => void

The effect is a function which executed each time its dependencies changed. Dependencies are tracked automatically and don't need to be explicitly specified.

```javascript
const cancel = $widget.effect(() => {
    console.log('Foo is changed:', $widget.state.foo);
});
...
// somewhere latter
cancel();
```

`effect()` function is just a wrapper ontop of [hyperactiv's `computed()`](https://github.com/elbywan/hyperactiv#2-define-computed-functions) with automatic dispose on widget destroy. So, you can use all things described in [hyperactiv guide](https://github.com/elbywan/hyperactiv). This function return `cancel()` function, so you can dispose of an effect when you actually don't need it.

#### $widget.on(type: string, fn: (e: CustomEvent) => void, opts?: object | boolean): () => void

This function lets you add an event listener to the widget to catch custom events dispatched by `emit()` function and automatically removes the handler on widget destroy. Also, you can remove the handler manually using `off()` function:

```javascript
const off = $widget.on('my-custom-event', (event) => {
    console.log('Event payload', event.detail);
});
...
// somewhere latter
off();
```

#### $widget.render(): void

Call this function to manually re-render a widget. Usually, it's not necessary, because you need just use a state-driven approach and change the reactive state to automatically perform a re-render. But sometimes you may want to force the DOM update. This function is idempotent and safe to re-call. If actual state wasn't changed, no changes in DOM will performed.

#### $widget.destroy(): void

Completelly destroy a widget, removes all event listeners and effects, and clean up the markup. It also fires a [`destroy`](https://github.com/PaulMaly/perlite#widget-lifecycle-events) life-cycle event.

Calling this function is the most proper way to destroy the widget, but if, for some reason, the `target` node will be removed from the DOM by external code, it will be tracked on the next render cycle, and destroy operations will be performed automatically.

#### $widget.ctx(fn: (...ctx: any[]) => any): any

This function receives callback function to get context values passed to the widget during creation.

```javascript
$widget.ctx((foo, bar, baz) => {
    console.log('widget context values', foo, bar, baz);
});
```

This function is fully synchronous and just returns the result of the callback. So you can return values you need directly or chain it with the other methods.

```javascript
const bar = $widget.ctx((foo, bar, baz) => bar);

$widget.ctx((...ctx) => ctx).forEach((val) => ...);
```

More details about [context](https://github.com/PaulMaly/perlite#widget-context).

### Widget container API

WIP

#### $$widgets[index: number]: Widget

Gets any widget by index in the order of `target` list provided on the creation of the container.

#### $$widgets.target: NodeList | Node[]

The original list of `targets` of the container widgets.

#### $$widgets.state(fn: (state: ProxyConstructor) => void): void

#### $$widgets.effect(fn: (state: ProxyConstructor) => () => void, opts?: object): (() => void)[]

#### $$widgets.on(type: string, fn: (e: CustomEvent) => void, opts?: object | boolean): (() => void)[]

Works almost the same as [`on()`]() function of a single widget but add events listener to every widget inside the container.

#### $$widgets.render(): void

Works almost the same as [`render()`]() function of a single widget but apply re-render to every widget inside the container.

#### $$widgets.destroy(): void

Works almost the same as [`render()`]() function of a single widget but destroy all widgets inside the container.

#### $$widgets.ctx(fn: (...ctx: any[]) => any): any

Equal to [`ctx()`]() function of a single widget. All widgets inside the container share the same context values.

#### $$widgets.forEach(fn: (widget: Widget, index: number, widgets: Widget[]) => void): void

Use it for looping through all the widgets inside the container:

```javascript
$$widgets.forEach($widget => {
    // do something with each widget
});
```

## 🛠 Advanced usage

### Setting the initial widget state during SSR

Most often, you will need some initial widget state to be set by the server during page rendering. Just use `data-attributes` on widget `target` element and render necessary values there. For example, using **PHP** templating:

```php
<div
    id="myWidget"
    data-string="<?=$strVal?>"
    data-number="<?=$numVal?>"
    data-boolean="<?=$boolVal?>"
    data-null="<?=$nullVal?>"
    data-json="<?=$jsonVal?>"
></div>
```

All `data-attributes` that matched declared widget state (in widget declaration) will be picked up and applied to the widget during creation. Note: to be properly matched, attributes names should be in *kebab-case*, and widget state properties names should be in *camelCase*. For more info, check how [`kebabCase()`](https://github.com/PaulMaly/perlite#kebabcasestr-string-string) and [`camelCase()`](https://github.com/PaulMaly/perlite#camelcasestr-string-pascal-boolean--false-string) functions works.

Regardless, that attribute values are always strings, some types will be automatically converted to the corresponding JS types (eg. boolean, number, null/undefined and even json. For more info, check how [`attrToVal()`](https://github.com/PaulMaly/perlite#attrtovalstr-string-any) function works.

Moreover, your external client-side code is also able to change `data-attributes` of widget target node directly like this:

```javascript
const myWidgetTarget = document.getElementByID('myWidget');
myWidgetTarget.setAttribute('data-string', 'hello world');
```

and these changes will also be applied to the widget state at any moment it occurs and DOM will be triggered to update as well. It's strongly not recommended, but can be useful in cases when some part of your code doesn't have direct access to the widget object and its reactive state.

### Directives

WIP

#### Lit-html directives

**Perlite** re-exports all **lit-html** built-in directives:

- repeat
- cache
- until
- live
- guard
- class-map
- style-map
- if-defined
- async-append
- async-replace
- template-content
- unsafe-html
- unsafe-svg

Follow the **lit-html** [guide](https://lit-html.polymer-project.org/guide/template-reference#built-in-directives) to lean how to use them.

#### Lists & keys

WIP

#### Event listener modifiers

```javascript
import {
    capture,
    passive,  
    once,
    self,
    stop, // stopPropagation()
    prevent, // preventDefault()
} from 'perlite';
...
html`
    <form @submit=${prevent(e => { ... })}>
        ...
        <button @click=${self(once(e => { ... }))}>
            Submit
        </button>
    </form>
`;
```

#### Refs & decorators

```javascript
import { ref } from 'perlite';
...
html`<div @=${ref(el => state.el = el)}></div>`;
```

```javascript
import { decorator } from 'perlite';
...
function myDecorator(node, foo, bar, baz) {
    // do something
    return {
        update(foo, bar, baz) { ... },
        destroy() { ... }
    };
}
...
html`<div @=${decorator(myDecorator, foo, bar, baz)}></div>`;
```

### Custom directive

Directives are fully provided by *lit-html* without any specifics or limitations. So, you can use [Creating directives](https://lit-html.polymer-project.org/guide/creating-directives) section in *lit-html* guide to learn more about custom directive creation.

### Widget context

Basically, `context` is just any additional arguments that can be passed to the widget's `state` and `render` functions on widget creation. These arguments can have any type and order you needed. The main thing you should know, `context` values are static. They are passed through when the widget is created, their count and order can't be changed on all widget life-cycle. Of course, if some `context` value is a reference to the object/array, its mutations could be applied in the next DOM update cycle. But, unlike the `state` mutations, context mutations will never trigger a new DOM update cycle by itself.

```javascript
const context = { ... };

const $widget = $({
        target,
        render,
        state,
    },
    context
);
```

```javascript
const context1 = { ... };
const context2 = true;

const $widget = $({
        target,
        render,
        state,
    },
    context1,
    context2,
    ...
);
```

```javascript
export function state(context1, context2) {
    // change initial state model depending on context values
    return {
        ...
    };
}

export function render(state, emit, context1, context2) {
    const something = Object.entries(context1).reduce(() => { ... });

    return html`
        <div>Context2: ${context2}</div>
    `;
}
```

### Widget nesting

Basically, **Perlite** widgets designed without a focus on their composition. But sometimes you still need to insert one widget into a DOM tree of another widget and communicate with a nested widget on the rendering cycle of its "parent".

To do that, at first, you can create a target element of the nested widget in memory and use the [context](https://github.com/PaulMaly/perlite#widget-context) to pass this widget to render function of the parent.

```javascript
import * as Nested from './widgets/Nested.js';
import * as Wrapper from './widgets/Wrapper.js';

const $nested = $({
        target: document.createElement('div'),
        ...Nested
    },
);

const $wrapper = $({
        target: document.getElementById('wrapper'),
        ...Wrapper
    },
    $nested
);
```

After that, you can just use `target` of the nested widget in template expression and it will be rendered as a fragment of the current widget's DOM tree. Very simple!

```javascript
export function render(state, emit, $nested) {
    return html`
        ${$nested.target}

        <button @click=${e => $nested.state.count += 1}>
            Increment nested value
        </button>
    `;
}
```

The number of nested widgets, as well as the way they are passed through the context, is not limited in any way. You can choose the most appropriate way you like.

```javascript
const $wrapper = $({
        target: document.getElementById('wrapper'),
        ...Wrapper
    }, {
        $nested1,
        $nested2
    }
);
```

```javascript
export function render(state, emit, { $nested1, $nested2 }) {
    return html`
        ${$nested1.target}
        <div>
            ${$nested2.target}
        </div>
    `;
}
```

### Shared state

Also known as `store(s)` - a very simple `observables`. Whenever a property of an observed object is changed, every function that depends on this property is called.

First of all, need to create a new `observable` store:

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

const user$$ = computed(() => {
    console.log('User data has changed', store$.user);
});
...
dispose(user$$);
```

To subscribe to the store properties, pass the callback function as a first argument of `computed` function and just perform any operations or side-effects with needful properties. It also returns `subscription` handler to dispose of a subscription if you no longer need it. It recommended to name `subscriptions` with a trailing "$$" sign (double "$") for short and distinguish it from the other objects.

Dependencies are automatically tracked so you don't need to explicitly declare anything - just use the properties you need. Read more about these things in [hyperactiv guide](https://github.com/elbywan/hyperactiv#usage).

Just import the store to use it in a widget:

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

The widget will be automatically updated when store values have changed.

### Styling

WIP

### Transitions

WIP

### Utilities

#### tick(fn?: () => any): Promise<undefined>

Defer the code to be executed after the next DOM update cycle. Use it immediately after you’ve changed some data to wait for the DOM update:

```javascript
import { tick } from 'perlite';

$widget.state.foo += 1;

await tick();

console.log('now DOM updated');
```

Or if it needed to perform some operation inside of render function/fragments that can trigger a rendering cycle again (which is most often not safe):

```javascript
import { tick, html } from 'perlite';

export function render(state, emit) {

    // WRONG WAY - will trigger a new DOM update cycle
    // before the current one is completed
    state.result = ...;

    // RIGHT WAY - defer state change to the next DOM update cycle
    tick(() => {
        state.result = ...;
    });

    return html`...`;
}
```

#### memo(fn: (...args: any[]) => any, invalidate?: (...args: any[]) => any): (...args: any[]) => any

Creates and returns a new memoized version of the passed function that will cache the result based on its arguments.

```javascript
import { memo } from 'perlite';

function heavyFunc(foo, bar, baz) { ... }

const funcMemoized = memo(heavyFunc);
...
funcMemoized(1, 2, 3); // executes a function, caches the result, and returns it
...
funcMemoized(1, 2, 3); // just a returns the result from cache
funcMemoized(4, 5, 6); // new arguments - new execution
funcMemoized(1, 2, 3); // still returns the result from cache
```

or use the second argument, function which provides custom cache invalidation logic:

```javascript
import { memo } from 'perlite';

function heavyFunc() { ... }

const funcMemoized = memo(heavyFunc, (foo, bar, baz) => {
    // decide whether to use the cached value or re-calculate the function
    return true;
});
```

Invalidation function should return `true` to keep the cached result or `false` to drop the cache, and re-execute the function. Also, it can return any unique value (string, number, even a reference) which will be used instead of arguments list to cache and retrieve the result.

```javascript
const funcMemoized = memo(heavyFunc, (foo, bar, baz) => {
    return `${foo}-${bar}-${baz.quux}`; // this will be used as a cache identifier
});
```

#### attrToVal(str: string): any

```javascript
import { attrToVal } from 'perlite';

attrToVal('false'); // false
attrToVal('undefined'); // undefined
attrToVal('null'); // null
attrToVal('2'); // 2
attrToVal('{"foo":1}'); // { foo: 1 }
```

#### camelCase(str: string, pascal: boolean = false): string

```javascript
import { camelCase } from 'perlite';

camelCase('kebab-to-camel-case'); // kebabToCamelCase
camelCase('kebab-to-pascal-case', true); // KebabToPascalCase
```

#### kebabCase(str: string): string

```javascript
import { kebabCase } from 'perlite';

kebabCase('camelToKebabCase'); // camel-to-kebab-case
```

## 📂 Structuring your project

Basically, **Perlite** is not really opinionated about how you should structure your projects. But to not leave you alone with this question, let's describe a possible project structure you may use.

So, the main project unit is a widget, and the main part of the widget is its [declaration](https://github.com/PaulMaly/perlite#widget-declaration). That's why we suppose to create a `widgets` folder to contain declarations of the project widgets. Any widget declaration can be a single file or subfolder for more complex widgets.

```sh
./widgets/
  ./Widget1.js
  ./Widget2/
    ./styles.css
    ./index.js
```

Any widget can have [fragments](https://github.com/PaulMaly/perlite#template-fragments) that are just re-usable pieces of the templates. You can keep fragments in the widget file if their number and size are not so big. Otherwise, you can take them out to a separate file or even a folder.

```sh
./widgets/
  ./Widget1/
    ./fragments.js
    ./index.js
  ./Widget2/
    ./fragments/
      ./fragment1.js
    ./index.js
```

Next thing that we have a [widget creation](https://github.com/PaulMaly/perlite#widget-creation) process. In most cases, you'll need to create widgets right after DOM is ready and be able to get a widget object in any place of your code.

We suppose to add an `index.js` file in the `widgets` folder and create the widgets there. To get access to created objects you can just export it from this file. ES modules approach based on *single instance pattern*, so you'll be able to import widget objects in other files.

```sh
./widgets/
  ./Widget1/
  ./Widget2/
  ./index.js
```

Your `index.js` can look like this:

```javascript
import { $, $$ } from 'perlite';

// importing widget declarations

import * as Widget1 from './Widget1.js';
import * as Widget2 from './Widget2.js';

// creating and exporting the widgets or widget containers

export const $widget1 = $({
    target: document.getElementById('widget1Container'),
    ...Widget1
});

export const $$widget2 = $$({
    target: document.querySelectorAll('.widget2Container'),
    ...Widget2
});
```

After that, you'll be able to import any widget in any file of your project.

```javascript
import { $widget1 } from './widgets/';

$widget1.effect(() => {
    // do something
});
```

Regarding the [stores](https://github.com/PaulMaly/perlite#shared-state), you may use almost the same approach - create a `stores` folder with subfolders if needed, and hold stores in different files, optionally, re-exports them from a single entry point (`index.js`).

```sh
./stores/
  ./store1/
    ./store1-1.js
    ./store1-2.js
    ./index.js
  ./store2.js
  ./index.js
```

```javascript
import { html, bind, computed } from 'perlite';
import { user$ } from './stores/';

export const userName$$ = computed(() => {
    console.log('user name is ', user$.name);
});

export function fragment() {
    return html`
        <input value=${user$.name} @change=${bind(name => user$.name = name)}>
    `;
}
```

## 🧰 Tooling

- [VS Code plugin](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin)
- [ESLint plugin](https://github.com/43081j/eslint-plugin-lit)

## ⌨️ Typescript support

## 🌐 Browsers support

## 📜 License

This software is licensed under the MIT © Pavel Malyshev.
