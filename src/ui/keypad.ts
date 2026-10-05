import { formatNumber } from '../core/numbers';
import { h } from './dom';

/** Pavé numérique (code arabe). Accepte la virgule décimale si `decimals`. */
export function keypad(onSubmit: (value: number) => void, decimals = true) {
  let text = '';
  const display = h('div', { class: 'keypad-display', 'aria-live': 'polite' });
  const refresh = () => {
    const [i, d] = text.split(',');
    display.textContent = text === '' ? '…' : formatNumber(Number(i || '0')) + (d !== undefined ? `,${d}` : '');
  };
  const press = (key: string) => {
    if (key === '⌫') text = text.slice(0, -1);
    else if (key === ',') {
      if (!text.includes(',')) text = (text || '0') + ',';
    } else if (text.replace(',', '').length < 13) text = text === '0' ? key : text + key;
    refresh();
  };
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', decimals ? ',' : '', '0', '⌫'];
  const grid = h(
    'div',
    { class: 'keypad-grid' },
    keys.map((k) =>
      k === ''
        ? h('span')
        : h('button', { class: 'key', type: 'button', onclick: () => press(k), 'aria-label': k === '⌫' ? 'effacer' : k }, k),
    ),
  );
  const submit = h(
    'button',
    {
      class: 'btn primary',
      type: 'button',
      onclick: () => {
        if (text === '' || text.endsWith(',')) return;
        onSubmit(Number(text.replace(',', '.')));
      },
    },
    'Valider ✓',
  );
  const onKey = (e: KeyboardEvent) => {
    if (!el.isConnected) return document.removeEventListener('keydown', onKey);
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === ',' || e.key === '.') press(',');
    else if (e.key === 'Backspace') press('⌫');
    else if (e.key === 'Enter') submit.click();
  };
  document.addEventListener('keydown', onKey);
  refresh();
  const el = h('div', { class: 'keypad' }, display, grid, submit);
  return {
    el,
    reset() {
      text = '';
      refresh();
    },
  };
}
