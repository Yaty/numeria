import { h } from './dom';

export function openModal(content: HTMLElement, className = ''): () => void {
  const overlay = h('div', { class: 'overlay' }, h('div', { class: `modal ${className}`, role: 'dialog', 'aria-modal': 'true' }, content));
  document.body.append(overlay);
  return () => overlay.remove();
}
