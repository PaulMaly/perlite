import { html, bind, attrToVal } from 'perlite';

export function state() {
    const tomorrow = new Date(Date.now() + 86400000);

    const start = [
        tomorrow.getFullYear(),
        pad(tomorrow.getMonth() + 1, 2),
        pad(tomorrow.getDate(), 2)
    ].join('-');

    return {
        start,
        end: start,
        isReturn: false,
    };
}

export function render(state) {
    const startDate = convertToDate(state.start);
    const endDate = convertToDate(state.end);
    const disabled = state.isReturn && (startDate >= endDate);

    function bookFlight() {
        const type = state.isReturn ? 'return' : 'one-way';

        let message = `You have booked a ${type} flight, leaving ${startDate.toDateString()}`;
        if (type === 'return') {
            message += ` and returning ${endDate.toDateString()}`;
        }

        alert(message);
    }

    return html`
        <select @change=${bind(v=> state.isReturn = attrToVal(v))}>
            <option .value=${false}>one-way flight</option>
            <option .value=${true}>return flight</option>
        </select>
        <input type="date" value=${state.start} @input=${e => state.start = e.target.value}>
        <input type="date" value=${state.end} @input=${e => state.end = e.target.value}
        ?disabled=${!state.isReturn}
        >
        <button @click=${bookFlight} ?disabled=${disabled}>
            book
        </button>
    `;
}

function pad(x, len) {
    x = String(x);
    while (x.length < len) x = `0${x}`;
    return x;
}

function convertToDate(str) {
    const split = str.split('-');
    return new Date(+split[0], +split[1] - 1, +split[2]);
}