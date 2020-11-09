import { directive, EventPart } from 'lit-html';

export const once = directive((handleEvent) => (part) => {

    if (!(part instanceof EventPart)) {
        throw new Error('"once" directive can only be used in event listeners');
    }

    part.setValue({ handleEvent, once: true });
});
