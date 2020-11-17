import { directive, EventPart } from 'lit-html';

export const prevent = directive((handler) => (part) => {

    if (!(part instanceof EventPart)) {
        throw new Error('"prevent" directive can only be used in event listeners');
    }

    const { handleEvent, ...options } = handler;

    part.setValue({
        handleEvent: function (event) {
            event.preventDefault();
            (handleEvent || handler).call(this, event);
        },
        ...options
    });
});