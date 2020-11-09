import { directive } from 'lit-html';

const decorators = new WeakMap();

export const decorator = directive((handler, ...state) => {
    const self = (part) => {
        const el = part.element;

        if (decorators.has(part)) {
            const [decorator, prevHandler] = decorators.get(part);
            if (prevHandler !== handler) {
                decorator.destroy();
                decorators.delete(part);
                self(part);
            } else {
                decorator.update(...state);
            }
        } else {
            const decorator = handler(el, ...state);
            decorators.set(part, [decorator, handler]);
            // decorator.destroy() + decorators.delete(part) ???
            // https://github.com/Polymer/lit-html/issues/283
            // wait till lit-html 2 ?
        }
    };
    return self;
});
