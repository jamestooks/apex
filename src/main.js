import { initCanvas, toLogical } from './engine/canvas.js';
import { createInput } from './engine/input.js';
import { audioInit } from './engine/audio.js';
import { app, startLoop } from './app.js';
import { h, mount } from './ui/dom.js';

const canvas = document.getElementById('game');
initCanvas(canvas);
app.input = createInput({ el: canvas, keyTarget: window, toLogical });
addEventListener('pointerdown', audioInit, { capture: true });
addEventListener('keydown', audioInit, { capture: true });

app.register('placeholder', () => mount(h('div', { class: 'screen' }, h('h1', { class: 'title' }, 'APEX'))));
startLoop();
app.show('placeholder');
