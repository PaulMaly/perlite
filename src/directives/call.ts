export const call = (handleEvent, ...args) => function (...argv) {
    handleEvent.call(this, ...argv, ...args);
};