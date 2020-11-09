import { directive, EventPart } from 'lit-html';

export const passive = directive((handleEvent) => (part) => {

    if (!(part instanceof EventPart)) {
        throw new Error('"passive" directive can only be used in event listeners');
    }

    part.setValue({ handleEvent, passive: true });
});