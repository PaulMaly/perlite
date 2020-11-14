export const noop = () => { };

export const tick = (fn: (() => any) = noop) => new Promise((resolve) => setTimeout(resolve)).then(fn);

export const memo = (fn: (...args: any[]) => any, invalidate?: (...args: any[]) => any) => {
    const cache = new Map();
    return (...args: any[]) => {
        let key;
        if (typeof invalidate === 'function') {
            const validOrKey = invalidate.apply(fn, args);
            if (validOrKey === false) { // invalidate the cache
                key = JSON.stringify(args);
                cache.delete(key);
            } else if (validOrKey !== true) { // set custom cache key
                key = validOrKey;
            }
        }

        if (key === undefined) {
            key = JSON.stringify(args);
        }

        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn.apply(fn, args);
        cache.set(key, result);
        return result;
    };
};

export function attrToVal(str: string): any {
    if (str === 'true' || str === 'false') {
        return str === 'true';
    } else if (str === 'null') {
        return null;
    } else if (str === 'undefined') {
        return undefined;
    } else if (str !== '' && !isNaN(Number(str))) {
        return Number(str);
    } else {
        try {
            return JSON.parse(str);
        } catch (e) { }
    }
    return str;
}

export function camelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}

export function dashCase(str: string): string {
    return str.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}