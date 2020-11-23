import { html, bind } from 'perlite';

export function state() {
    return {
        c: 0,
        f: 32,
        setBothFromC(value) {
            this.c = +value;
            this.f = +(32 + (9 / 5 * this.c)).toFixed(1);
        },
        setBothFromF(value) {
            this.f = +value;
            this.c = +(5 / 9 * (this.f - 32)).toFixed(1);
        }
    };
}

export function render(state) {
    return html`
        <input .value=${state.c} @input=${bind(v => state.setBothFromC(v))} type=number> °c =
        <input .value=${state.f} @input=${bind(v => state.setBothFromF(v))} type=number> °f
    `;
}