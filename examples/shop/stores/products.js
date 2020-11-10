import { observe } from 'https://unpkg.com/perlite@latest/dist/perlite.min.mjs';

export default observe(window?.__DATA__?.products ?? []);