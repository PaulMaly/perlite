const { html, bind } = perlite;

export function state() {
    return {
        productId: 0,
        count: 1,
        options: [],
        selectedOption: null
    };
}

export function render(state, emit) {

    function addToCart() {
        emit('add:cart', {
            productId: state.productId,
            count: state.count,
            selectedOption: state.selectedOption
        });
    }

    const selectOption = bind(val => state.selectedOption = val);
    const setCount = bind(val => state.count = val);

    return html`
        <form class="form-inline">
            <div class="form-group mr-2">
                <select @change=${selectOption} value=${state.selectedOption} class="form-control">
                    ${state.options.map(value => html`
                    <option value=${value}>${value.toUpperCase()}</option>
                    `)}
                </select>
            </div>
            <div class="form-group mr-2">
                <input @change=${setCount} value=${state.count} class="form-control" type="number" min="1">
            </div>
            <button @click=${addToCart} type="button" class="btn btn-outline-primary">
                <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-cart-plus" fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd"
                        d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm7 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                    <path fill-rule="evenodd"
                        d="M8.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H9v1.5a.5.5 0 0 1-1 0V8H6.5a.5.5 0 0 1 0-1H8V5.5a.5.5 0 0 1 .5-.5z" />
                </svg>
            </button>
        </form>
    `;
}