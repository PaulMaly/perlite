import { directive, EventPart } from 'lit-html';

export const self = directive((handler) => (part) => {

    if (!(part instanceof EventPart)) {
        throw new Error('"self" directive can only be used in event listeners');
    }

    const { handleEvent, ...options } = handler;

    part.setValue({
        handleEvent: function (event) {
            (event.target === event.currentTarget)
                && (handleEvent || handler).call(this, event);
        },
        ...options
    });
});