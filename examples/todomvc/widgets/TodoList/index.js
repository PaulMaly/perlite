import { html, each, nothing } from 'https://unpkg.com/perlite@latest/dist/perlite.min.mjs';

import todos$, { toggleAll } from '../../stores/todos.js';
import { newTodo, todoItem, filters } from './fragments.js';

export const state = {
  currentFilter: 'all',
  editing: null,
};

export function render(state) {
  const numActive = todos$.filter(todo => !todo.completed).length;
  const numCompleted = todos$.filter(todo => todo.completed).length;
  const isAllCompleted = numCompleted === todos$.length;

  const todos =
    state.currentFilter === 'all'
      ? todos$
      : state.currentFilter === 'completed'
        ? todos$.filter(todo => todo.completed)
        : todos$.filter(todo => !todo.completed);

  return html`
    ${newTodo()}
    ${todos$.length > 0
    ? html`
    <section class="main">
      <input @change=${e => toggleAll(!!e.target.checked)}
      ?checked=${isAllCompleted}
      type="checkbox"
      id="toggle-all"
      class="toggle-all"
      />
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        ${each(todos, item => todoItem(state, { item }), todo => todo.id)}
      </ul>
      ${filters(state, { numActive, numCompleted })}
    </section>
    `
    : nothing}
  `;
}