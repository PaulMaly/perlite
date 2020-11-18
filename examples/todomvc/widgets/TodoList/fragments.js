import { html, nothing, cache } from 'perlite';

import { addTodo, removeTodo, clearCompleted } from '../../stores/todos.js';

const ENTER_KEY = 13;
const ESCAPE_KEY = 27;
const FILTERS = ['all', 'active', 'completed'];

export function newTodo() {
    function create(e) {
        if (e.which === ENTER_KEY) {
            addTodo(e.target.value);
            e.target.value = '';
        }
    }
    return html`
    <header class="header">
        <h1>todos</h1>
        <input @keydown=${create} class="new-todo" placeholder="What needs to be done?" autofocus />
    </header>
  `;
}

export function todoItem(state, { item }) {
    function cancel(e) {
        if (e.which === ENTER_KEY) e.target.blur();
        else if (e.which === ESCAPE_KEY) state.editing = null;
    }

    function save(e) {
        item.description = e.target.value;
        state.editing = null;
    }

    const isEditing = state.editing === item;
    const classList = `${item.completed ? 'completed' : ''} ${isEditing ? 'editing' : ''}`;

    return html`
    <li class=${classList}>
        <div class="view">
            <input ?checked=${item.completed} @change=${(e)=> (item.completed = !item.completed)}
            type="checkbox"
            class="toggle"
            />
            <label @dblclick=${()=> (state.editing = item)}>
                ${item.description}
            </label>
            <button @click=${()=> removeTodo(item.id)}
                class="destroy"
                ></button>
        </div>
        ${isEditing
            ? html`
        <input @keydown=${cancel} @blur=${save} value=${item.description} id="edit" class="edit" autofocus />
        `
            : nothing}
    </li>
  `;
}

export function filters(state, { numActive, numCompleted }) {
    return html`
    <footer class="footer">
        <span class="todo-count">
            <strong>${numActive}</strong> ${numActive === 1 ? 'item' : 'items'} left
        </span>
    
        <ul class="filters">
            ${cache(
          FILTERS.map(
            (filter) => html`
            <li>
                <a @click=${()=> (state.currentFilter = filter)}
                    class="${state.currentFilter === filter ? 'selected' : ''}"
                    href="#/"
                    >${filter}</a>
            </li>
            `
          )
        )}
        </ul>
    
        ${numCompleted
            ? html`
        <button @click=${clearCompleted} class="clear-completed">
            Clear completed
        </button>
        `
            : nothing}
    </footer>
  `;
}