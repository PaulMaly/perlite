import { repeat } from 'lit-html/directives/repeat';

export const each = (items, template, keyFn = (item) => item) =>
    repeat(items, keyFn, template);
