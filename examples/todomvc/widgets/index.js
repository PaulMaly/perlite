import { $ } from 'perlite';

import * as TodoList from './TodoList/index.js';

export const $todoList = $({
    target: document.querySelector('.todoapp'),
    ...TodoList,
});

