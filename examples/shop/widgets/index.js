import { $, $$ } from 'https://unpkg.com/perlite@latest/dist/perlite.min.mjs';

import * as AddToCart from './AddToCart.js';
import * as CartPopup from './CartPopup.js';
import * as Search from './Search.js';

export const $$addToCart = $$({
    ...AddToCart,
    target: document.querySelectorAll('.products-list .card-footer'),
});

export const $cartPopup = $({
    ...CartPopup,
    target: document.getElementById('cartPopup'),
});

export const $search = $({
    ...Search,
    target: document.getElementById('search'),
});