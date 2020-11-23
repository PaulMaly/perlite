import { $ } from 'perlite';

import * as Counter from './Counter.js';
import * as TempConverter from './TempConverter.js';
import * as FlightBooker from './FlightBooker.js';
import * as Timer from './Timer.js';

export const $counter = $({
    target: document.getElementById('counter'),
    ...Counter
});

export const $temperature = $({
    target: document.getElementById('temperature'),
    ...TempConverter
});

export const $booker = $({
    target: document.getElementById('booker'),
    ...FlightBooker
});

export const $timer = $({
    target: document.getElementById('timer'),
    ...Timer
});

let lastTime = window.performance.now();
let frame;

(function update() {
    frame = requestAnimationFrame(update);

    const time = window.performance.now();
    const { duration, elapsed } = $timer.state;

    $timer.state.elapsed += Math.min(
        time - lastTime,
        duration - elapsed
    );

    lastTime = time;
}());

$timer.on('destroy', () => cancelAnimationFrame(frame));