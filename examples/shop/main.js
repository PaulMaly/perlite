import { $$addToCart, $cartPopup, $search } from './widgets/index.js';

$$addToCart.on('add:cart', ({ detail }) => {
    $cartPopup.state.addProductEntry(detail);
});

$search.on('search', ({ detail }) => {
    console.log(
        'Perform search request for query: ',
        detail
    );
});

$cartPopup.effect(() => {
    console.log(
        'Perform add to cart server request',
        { ...$cartPopup.state.entries }
    );
});