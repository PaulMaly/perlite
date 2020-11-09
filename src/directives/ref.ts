import { directive } from 'lit-html';

export const ref = directive((fn) => (part) => fn(part.element));