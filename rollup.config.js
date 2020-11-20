import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import minify from 'rollup-plugin-minify-html-literals';
import sourceMaps from "rollup-plugin-sourcemaps";

import pkg from './package.json';

const extensions = ['.js', '.ts', '.mjs',];

const name = pkg.name
    .replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
    .replace(/-\w/g, m => m[1].toUpperCase());

const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
];

const input = 'src/index.ts';

const appendMin = file => file.replace(/(\.[\w\d_-]+)$/i, '.min$1');

const files = {
    npm: {
        esm: { file: pkg.module, format: 'esm', },
        umd: { file: pkg.main, format: 'umd', name, },
        esmMin: {
            file: appendMin(pkg.module),
            format: 'esm',
            sourcemap: true,
        },
        umdMin: {
            file: appendMin(pkg.main),
            format: 'umd',
            sourcemap: true,
            name,
        },
    },
    cdn: {
        esm: { file: pkg.browser[pkg.module], format: 'esm', },
        iife: { file: pkg.browser[pkg.main], format: 'iife', name, },
        esmMin: {
            file: appendMin(pkg.browser[pkg.module]),
            format: 'esm',
            sourcemap: true,
        },
        iifeMin: {
            file: appendMin(pkg.browser[pkg.main]),
            format: 'iife',
            sourcemap: true,
            name,
        },
    }
};

const terserConfig = {
    format: {
        comments: false,
    },
};

export default [{ // esm && umd bundles for npm/yarn
    input,
    output: [
        files.npm.esm,
        files.npm.umd,
    ],
    external,
    plugins: [
        typescript(),
    ],
}, { // esm && umd bundles for npm/yarn (min)
    input,
    output: [
        files.npm.esmMin,
        files.npm.umdMin,
    ],
    external,
    plugins: [
        sourceMaps(),
        minify(),
        typescript({ sourceMap: true, }),
        terser(terserConfig),
    ],
}, { // esm bundle for cdn/unpkg
    input,
    output: files.cdn.esm,
    plugins: [
        resolve({ browser: true, extensions, }),
        commonjs({ include: 'node_modules/**', extensions, }),
        typescript(),
    ],
}, { // iife bundle for cdn/unpkg
    input,
    output: files.cdn.iife,
    plugins: [
        resolve({ browser: true, extensions, }),
        commonjs({ include: 'node_modules/**', extensions, }),
        typescript(),
        babel({ babelHelpers: 'bundled' }),
    ],
}, { // esm bundle from cdn/unpkg (min)
    input,
    output: files.cdn.esmMin,
    plugins: [
        sourceMaps(),
        minify(),
        resolve({ browser: true, extensions, }),
        commonjs({ sourceMap: true, include: 'node_modules/**', extensions, }),
        typescript({ sourceMap: true, }),
        terser(terserConfig),
    ],
}, { // iife bundle for cdn/unpkg (min)
    input,
    output: files.cdn.iifeMin,
    plugins: [
        sourceMaps(),
        minify(),
        resolve({ browser: true, extensions, }),
        commonjs({ sourceMap: true, include: 'node_modules/**', extensions, }),
        typescript({ sourceMap: true, }),
        babel({ babelHelpers: 'bundled' }),
        terser(terserConfig),
    ],
},];