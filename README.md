[![perlite logo](/docs/logo.svg)]()

[![npm](https://img.shields.io/npm/v/perlite?style=flat-square)](https://www.npmjs.com/package/perlite)
![npm type definitions](https://img.shields.io/npm/types/perlite?style=flat-square)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/perlite?style=flat-square)](https://bundlephobia.com/result?p=perlite)
![GitHub](https://img.shields.io/github/license/PaulMaly/perlite?style=flat-square)

> *hy*__per__*activ* 🌋 + __lit__*-html* ☄️ + __e__*xtensions* 🌊 = __perlite__ 💎.

Perlite is a **simple** and **declarative** way to create rich client-side widgets designed with server-side apps in mind. Completely based on native/vanilla Javascript standards and doesn't require additional build steps or compilation.

## 🚩 Table of contents

- [Features](https://github.com/PaulMaly/perlite#-features).
- [Installation](https://github.com/PaulMaly/perlite#-installation)
- [Installation](https://github.com/PaulMaly/perlite#-installation)
    - [NPM](https://github.com/PaulMaly/perlite#npm)
    - [CDN](https://github.com/PaulMaly/perlite#cdn)
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
    - [Widget API](https://github.com/PaulMaly/perlite#widget-api)
        - [$widget.target]()
        - [$widget.state]()
        - [$widget.model]()
        - [$widget.effect(callback)]()
        - [$widget.on(type, listener [, options])]()
        - [$widget.render()]()
        - [$widget.destroy()]()
        - [$widget.ctx(callback)]()
    - [Widget container API](https://github.com/PaulMaly/perlite#widget-container-api)
- [Advanced usage](https://github.com/PaulMaly/perlite#-advanced-usage)
    - [Directives](https://github.com/PaulMaly/perlite#directives)
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

## 📋 Features

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

#### Using expressions

#### Text bindings

#### Attribute bindings

#### Event listeners

#### Template fragments

#### Control flow

##### Conditions

##### Looping

### Widget API

WIP

#### $widget.target

#### $widget.state

#### $widget.model

#### $widget.effect(callback)

+ `callback`: function

#### $widget.on(type, listener [, options])

+ `type`: string
+ `listener`: function
+ `options`: object

#### $widget.render()

#### $widget.destroy()

#### $widget.ctx(callback)

+ `callback`: function

### Widget container API

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

### Global state

### Styling

### Transitions

### Utilities

## ⌨️ Typescript support

## 🌐 Browsers support

## 📜 License

This software is licensed under the MIT © PaulMaly.