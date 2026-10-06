/**
 * Page « Voix » du compte : écouter chaque voix et enregistrer son choix.
 * Améliore le formulaire Rails (qui reste utilisable sans JavaScript).
 */
import { h } from '../ui/dom';
import { onVoiceStatus, prepareVoice, setChosenVoice, speak, voiceStatus, type VoiceStatus } from '../ui/speech';

interface PickerConfig {
  voices: { id: string; label: string }[];
  current: string;
  saveUrl: string;
}

const SAMPLE = 'Bonjour ! Écoute bien : bateau, gâteau, château. Quel mot rime avec chapeau ?';

export function mountVoicePicker(el: HTMLElement): void {
  const cfg = JSON.parse(el.dataset.config ?? '{}') as PickerConfig;
  let current = cfg.current;
  const status = h('p', { class: 'voice-status muted', 'aria-live': 'polite' });
  const show = (s: VoiceStatus) => {
    status.textContent = {
      idle: '',
      downloading: `Téléchargement de la voix : ${s.state === 'downloading' ? s.percent : 0} % (une seule fois par appareil)`,
      ready: '✓ Voix prête sur cet appareil.',
      error: 'La voix n’a pas pu être téléchargée. Vérifiez la connexion internet puis rechargez la page.',
    }[s.state];
  };
  onVoiceStatus(show);

  const listen = async (id: string) => {
    setChosenVoice(id);
    show(voiceStatus());
    await prepareVoice();
    speak(SAMPLE, true);
  };

  const save = async (id: string) => {
    current = id;
    const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    const res = await fetch(cfg.saveUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ voice: id }),
    });
    saved.textContent = res.ok ? '✓ Enregistré' : 'Enregistrement impossible';
    render();
  };

  const saved = h('span', { class: 'voice-saved' });
  const list = h('div', { class: 'voice-list' });
  const render = () =>
    list.replaceChildren(
      ...cfg.voices.map((v) =>
        h(
          'div',
          { class: `voice-row ${v.id === current ? 'selected' : ''}` },
          h('button', { type: 'button', class: 'btn small ghost', onclick: () => listen(v.id) }, '▶ Écouter'),
          h('span', { class: 'voice-label' }, v.label),
          v.id === current
            ? h('span', { class: 'pill ok' }, 'choisie')
            : h('button', { type: 'button', class: 'btn small primary', onclick: () => save(v.id) }, 'Choisir'),
        ),
      ),
    );
  render();
  el.replaceChildren(list, saved, status);
  setChosenVoice(current);
  show(voiceStatus());
}
