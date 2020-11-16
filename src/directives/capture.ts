import { directive, EventPart } from 'lit-html';

export const capture = directive((handleEvent) => (part) => {

    if (!(part instanceof EventPart)) {
        throw new Error('"capture" directive can only be used in event listeners');
    }

    part.setValue(typeof handleEvent === 'object' ?
        { ...handleEvent, capture: true } :
        { handleEvent, capture: true }
    );
});