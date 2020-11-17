import { $ } from 'https://unpkg.com/perlite@latest/dist/perlite.min.mjs';

import * as TodoList from './TodoList/index.js';

export const $todoList = $({
    target: document.querySelector('.todoapp'),
    ...TodoList,
});

