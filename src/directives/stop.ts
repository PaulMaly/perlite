import { directive, EventPart } from 'lit-html';

export const stop = directive((handler, immediate = false) => (part) => {

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