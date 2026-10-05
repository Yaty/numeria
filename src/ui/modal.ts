import { h } from './dom';

/**
 * Ouvre une fenêtre avec un bouton ✕ (et Échap). `onDismiss` est appelé quand
 * l'enfant ferme la fenêtre lui-même ; la fonction renvoyée ferme sans l'appeler.
 */
export function openModal(content: HTMLElement, className = '', onDismiss?: () => void): () => void {
  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const dismiss = () => {
    close();
    onDismiss?.();
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss();
  const overlay = h(
    'div',
    { class: 'overlay' },
    h(
      'div',
      { class: `modal ${className}`, role: 'dialog', 'aria-modal': 'true' },
      h('button', { class: 'modal-close', type: 'button', 'aria-label': 'fermer', onclick: dismiss }, '✕'),
      content,
    ),
  );
  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  return close;
}
