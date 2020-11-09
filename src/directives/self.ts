import { directive, EventPart } from 'lit-html';

export const self = directive((handleEvent) => (part) => {

    if (!(part instanceof EventPart)) {
        throw new Error('"self" directive can only be used in event listeners');
    }

    part.setValue(function (event) {
        (event.target === this) && handleEvent.call(this, event);
    });
});