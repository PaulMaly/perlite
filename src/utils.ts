export function attrToVal(str) {
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

export function camelCase(str) {
    return str.replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}

export function dashCase(str) {
    return str.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}