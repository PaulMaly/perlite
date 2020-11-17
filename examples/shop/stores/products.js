import { observe } from 'https://unpkg.com/perlite@latest/dist/perlite.min.mjs';

const products$ = observe([]);
export default products$;

setTimeout(() => { // simulate async operation
    products$.push(...window?.__DATA__?.products);
}, 2000);