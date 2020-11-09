import { directive, EventPart } from 'lit-html';

// check this later: https://codesandbox.io/s/hyperactiv-tests-works-u47wt?file=/src/bind.js

type HTMLConrolElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement;

export const bind = directive((handleEvent) => (part) => {
    if (!(part instanceof EventPart)) {
        throw new Error('"bind" directive can only be used in event listeners');
    }

    const el: any = part.element as HTMLConrolElement;
    const isInput = el instanceof HTMLInputElement;
    const isSelect = el instanceof HTMLSelectElement;
    const isTextarea = el instanceof HTMLTextAreaElement;
    const isButton = el instanceof HTMLButtonElement;

    if (!isInput && !isSelect && !isTextarea && !isButton) {
        throw new Error(
            '"bind" directive can only be applied to input/select/textarea/button elements.'
        );
    }

    part.setValue(function (...args) {
        let value: string | boolean | any = el.defaultValue;
        if (isSelect && el.options.length > 0) {
            const i = el.selectedIndex >= 0 ? el.selectedIndex : 0;
            value = el.options[i].value;
        } else if (isInput) {
            switch (el.type) {
                case 'number':
                case 'range':
                    value = el.valueAsNumber;
                    break;
                case 'checkbox':
                case 'radio':
                    value = !!el.checked;
                    break;
                case 'time':
                case 'date':
                case 'datetime':
                case 'datetime-local':
                    value = el.valueAsDate;
                    break;
                default:
                    value = el.value;
            }
        } else {
            value = el.value;
        }

        handleEvent.call(this, value, ...args);
    });
});
