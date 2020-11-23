import { html, bind } from 'perlite';

export function state() {
    return {
        elapsed: 0,
        duration: 5000,
    };
}

export function render(state) {
    const progress = state.elapsed / state.duration;
    const sec = (state.elapsed / 1000).toFixed(1);

    return html`
        <label>
            elapsed time:
            <progress .value=${progress}></progress>
        </label>
        
        <div>${sec}s</div>
        
        <label>
            duration:
            <input type="range" @input=${bind(v => state.duration = v)}
            .value=${state.duration}
            min="1" max="20000"
            >
        </label>
        
        <button @click=${() => state.elapsed = 0}>reset</button>
    `;
}