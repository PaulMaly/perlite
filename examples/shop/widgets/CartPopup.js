import products from '../stores/products.js';

const { html, each } = perlite;

export function state() {
    return {
        entries: {}, // { [productId]: [{ productId, count, selectedOption }] }
        show: false,
        addProductEntry(entry) {
            const { productId, count, selectedOption } = entry;
            if (!this.entries[productId]) {
                this.entries = {
                    ...this.entries,
                    [productId]: [entry]
                };
            } else {
                const entryWithOption = this.entries[productId]
                                            .find(e => e.selectedOption === selectedOption);
                if (entryWithOption) {
                    entryWithOption.count += count;
                } else {
                    this.entries[productId].push(entry);
                }
            }
        }
    };
}

export function render(state) {

    const productIds = Object.keys(state.entries).map(id => +id);
    const productsInCart = products.filter(product => productIds.includes(product.id));

    return html`
        <button 
            @click=${() => state.show = !state.show}
            type="button"
            class="nav-link dropdown-toggle"
            aria-haspopup="true"
            aria-expanded="false"
        >
            <span class="badge badge-info badge-pill">${productIds.length}</span>
            <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-cart" fill="currentColor"
                xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd"
                    d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm7 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
            </svg>
        </button>
        <div class="dropdown-menu dropdown-menu-right ${state.show ? 'show' : ''}">
            ${each(
                productsInCart, 
                product => {
                    const count = state.entries[product.id].reduce((count, p) => count + p.count, 0);
                    return html`
                        <a class="dropdown-item" href="#">
                            ${product.title.substring(0, 20)}
                            <span class="badge badge-pill badge-secondary">
                                ${count}
                            </span>
                        </a>
                    `
                }, 
                p => p.id
            )}
        </div>
    `;
}