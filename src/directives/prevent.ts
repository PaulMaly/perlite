import { directive, EventPart } from 'lit-html';

export const prevent = directive((handleEvent) => (part) => {

    if (!(part instanceof EventPart)) {
        throw new Error('"prevent" directive can only be used in event listeners');
    }

    part.setValue(function (event) {
        event.preventDefault();
        handleEvent.call(this, event);
    });
});