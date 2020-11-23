import { html, bind } from 'perlite';

export function state() {
    return { count: 0 };
}

export function render(state) {
    return html`
        <input .value=${state.count} @input=${bind(count=> state.count = count)} type="number">
        <button @click=${() => state.count += 1}>count</button>
    `;
}