import { directive, EventPart } from 'lit-html';

export const stop = directive((handleEvent, immediate = false) => (part) => {

    if (!(part instanceof EventPart)) {
        throw new Error('"stop" directive can only be used in event listeners');
    }

    part.setValue(function (event) {
        immediate ? event.stopImmediatePropagation() : event.stopPropagation();
        handleEvent.call(this, event);
    });
});