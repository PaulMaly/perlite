import { observe, computed } from 'perlite';

const STORAGE_KEY = 'todos-todomvc';

const todos = sessionStorage.getItem(STORAGE_KEY);

const todos$ = observe(todos ? JSON.parse(todos) : []);

computed(() => {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(todos$));
    } catch (err) { }
});

export default todos$;

export function addTodo(description) {
    todos$.unshift({
        id: uuid(),
        description,
        completed: false
    });
}

export function removeTodo(id) {
    const i = todos$.findIndex(todo => todo.id === id);
    todos$.splice(i, 1);
}

export function toggleAll(completed) {
    todos$.forEach((todo) => todo.completed = completed);
}

export function clearCompleted() {
    for (let i = 0; i < todos$.length; i++) {
        if (todos$[i].completed) {
            todos$.splice(i, 1);
            i--;
        }
    }
}

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}