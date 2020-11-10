[![perlite logo](/docs/logo.svg)]()

[![npm](https://img.shields.io/npm/v/perlite?style=flat-square)](https://www.npmjs.com/package/perlite)
![npm type definitions](https://img.shields.io/npm/types/perlite?style=flat-square)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/perlite?style=flat-square)](https://bundlephobia.com/result?p=perlite)
![GitHub](https://img.shields.io/github/license/PaulMaly/perlite?style=flat-square)

> *hy*__per__*activ* 🌋 + __lit__*-html* ☄️ + __e__*xtensions* 🌊 = __perlite__ 💎.

Perlite is a **simple** and **declarative** way to create rich client-side widgets designed with server-side apps in mind. Completely based on native/vanilla Javascript standards and doesn't require additional build steps or compilation.

## 🚩 Table of Contents

## 🎨 Features

## 📦 Installation

### NPM

```sh
npm i --save perlite
```

or

```sh
yarn add perlite
```

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

## 🔨 Basic Usage

### Widget declaration

Widget basically is just a JS file containing `state` (object or function) and `render` function. Use ES6 [Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) to describe your templates and [tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates) them by scecial `html` function.

```javascript
import { html } from 'perlite';

export const state = {
    name: 'world'
};

export function render(state, emit) {
    return html`<h1>Hello ${state.name}</h1>`
}
```

### Widget creation

To create a new widget and append into the page, import and call `$` constructor function and pass a `target` DOM element, where the widget will be rendered, and widget declaration using ES6 [Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) for example:

```javascript
import { $ } from 'perlite';

import * as HelloWorld from './widgets/HelloWorld.js';

export const $helloWorld = $({
    target: document.getElementById('helloWorld-widget'),
    ...HelloWorld
});
```

The constructor function will return an object which allows you to manage a widget. To distinguish widgets from regular JS objects, it's recommended to follow the naming convention by prefixing widget names with the `$`. 

Actually, the widget object is just a namespace without any overall context. So, you can use ES6 [Destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) and use things separately:

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

## Widget multiple instantiations

Most often widget is a singleton, but in many cases, you need to use multiple widgets with the same declaration, but an isolated state. First of all, in its declaration instead of an object, you should use `state` function which should return a new state object. Otherwise, `state` will be shared between all widgets with the same declaration.

```javascript
export function state() {
    return {
        name: 'world'
    };
}
```

After that, you can use `$` function multiple times with the different `targets`:

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

When you deal with multiple widget instantiation, sometimes you want to work with them in the same manner. To do that, you can use the handy `$$` container function to work with a bunch of widgets at once:

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
$widgets.on('eventName', () => { ... }); // add event listener for each widget in container

$widget.effect(() => { ... }); // add effect for the widget
$widgets.effect(() => { ... }); // add effect for each widget in container

$widget.render(); // re-render the widget
$widgets.render(); // re-render all widgets in container

$widget.destroy(); // destroy widget
$$widgets.destroy(); // destroy ALL widgets in container
```

The other APIs looks the same, but should be used differently:

```javascript
$widget.state.foo = 1; // directly change the state of the widget

$$widgets.state((state$) => { // use it as a function with callback
    state$.foo = 1;
});
```

Also, you can iterate through the container using `forEach`:

```javascript
$$widgets.forEach(widget => {
    // do your custom logic with each widget
});
```

## 📜 License

This software is licensed under the MIT © PaulMaly.