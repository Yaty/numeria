/**
 * Espace orthophoniste : réglages par patient, statistiques, export/import.
 * Protégé par un code à 4 chiffres (pour que l'enfant ne change pas son niveau).
 */
import { className } from '../../core/numbers';
import type { ExchangeMode, UniverseLevel } from '../../core/economy';
import type { Orthographe } from '../../core/french';
import { KIND_LABELS, PROBLEM_LEVELS, type Code, type ProblemKind, type ProblemLevel } from '../../core/problems';
import { applySettings, exportProfile, importProfile, newGameFor, statsByKind, type Profile, type Settings } from '../../core/profile';
import { save, store } from '../app';
import { h } from '../dom';
import { keypad } from '../keypad';
import { chosenVoice, NEURAL_VOICES, onVoiceStatus, setChosenVoice, speak, voiceStatus, type VoiceStatus } from '../speech';

const MODE_LABELS: Record<string, string> = {
  clavier: 'chiffres (clavier)',
  'choix-verbal': 'choix en lettres',
  'choix-analogique': 'choix en blocs',
};
const CODE_LABELS: Record<Code, string> = { arabe: 'Chiffres (arabe)', verbal: 'Lettres (verbal)', analogique: 'Blocs (analogique)' };

/** `only` : dans le portail, un seul profil, sans code (l'accès adulte est vérifié par le serveur). */
export function showTherapist(root: HTMLElement, onExit: () => void, only?: Profile): void {
  const askPin = (title: string, onPin: (pin: string) => void, error = '') => {
    const pad = keypad((v) => {
      if (v >= 10000) return askPin(title, onPin, 'Le code fait 4 chiffres.');
      const pin = String(v).padStart(4, '0');
      onPin(pin);
    }, false);
    root.replaceChildren(
      h(
        'div',
        { class: 'screen center' },
        h('h1', {}, '🔒 Espace orthophoniste'),
        h('p', { class: 'lead' }, title),
        error ? h('p', { class: 'error' }, error) : null,
        pad.el,
        h('button', { class: 'btn ghost', type: 'button', onclick: onExit }, '← Retour'),
      ),
    );
  };

  if (only) {
    panel(only.id);
  } else if (store.pin === null) {
    askPin('Choisissez un code à 4 chiffres pour protéger cet espace.', (pin) => {
      store.pin = pin;
      save();
      panel(store.profiles[0]?.id);
    });
  } else {
    const check = (error = '') =>
      askPin('Entrez votre code.', (pin) => (pin === store.pin ? panel(store.profiles[0]?.id) : check('Code incorrect.')), error);
    check();
  }

  function panel(selectedId?: string) {
    const profiles = only ? [only] : store.profiles;
    const selected = profiles.find((p) => p.id === selectedId);
    const importInput = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
    importInput.addEventListener('change', async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        const p = importProfile(await file.text(), []);
        const idx = store.profiles.findIndex((x) => x.id === p.id);
        if (idx >= 0) {
          if (!confirm(`Remplacer la progression de ${store.profiles[idx].name} par celle du fichier ?`)) return;
          store.profiles[idx] = p;
        } else store.profiles.push(p);
        save();
        panel(p.id);
      } catch (e) {
        alert((e as Error).message);
      }
    });

    root.replaceChildren(
      h(
        'div',
        { class: 'screen therapist' },
        h(
          'div',
          { class: 'therapist-head' },
          h('button', { class: 'btn ghost', type: 'button', onclick: onExit }, '← Retour au jeu'),
          h('h1', {}, only ? `Réglages de Numéria — ${only.name}` : 'Espace orthophoniste'),
          only ? null : h('button', { class: 'btn ghost', type: 'button', onclick: () => importInput.click() }, '📥 Importer un profil'),
          importInput,
        ),
        only ? null : h(
          'nav',
          { class: 'patient-tabs' },
          store.profiles.length === 0 ? h('p', { class: 'muted' }, 'Aucun patient pour l’instant. Créez un joueur depuis l’accueil.') : null,
          store.profiles.map((p) =>
            h('button', { class: `tab${p.id === selectedId ? ' selected' : ''}`, type: 'button', onclick: () => panel(p.id) }, `${p.avatar} ${p.name}`),
          ),
        ),
        selected ? patientPanel(selected) : null,
        only ? null : voiceSection(), // dans le portail : menu « Voix » du compte
        only ? null : h(
          'details',
          { class: 'card' },
          h('summary', {}, 'Changer le code d’accès'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => askPin('Nouveau code à 4 chiffres :', (pin) => { store.pin = pin; save(); panel(selectedId); }) }, 'Changer le code'),
        ),
      ),
    );
  }

  function patientPanel(p: Profile): HTMLElement {
    const set = (changes: Parameters<typeof applySettings>[1]) => {
      applySettings(p, changes);
      save();
      panel(p.id);
    };
    const select = <T extends string | number>(label: string, value: T, options: [T, string][], onChange: (v: T) => void) =>
      h(
        'label',
        { class: 'field' },
        h('span', {}, label),
        (() => {
          const el = h('select', { class: 'input' }, options.map(([v, text]) => h('option', { value: String(v), selected: v === value }, text)));
          el.addEventListener('change', () => onChange(options.find(([v]) => String(v) === el.value)![0]));
          return el;
        })(),
      );

    const s = p.settings;
    const codes = h(
      'fieldset',
      { class: 'field codes' },
      h('legend', {}, 'Codes utilisés dans les enquêtes'),
      (Object.keys(CODE_LABELS) as Code[]).map((code) => {
        const box = h('input', { type: 'checkbox', checked: s.codes.includes(code) });
        box.addEventListener('change', () => {
          const next = box.checked ? [...s.codes, code] : s.codes.filter((c) => c !== code);
          if (next.length === 0) {
            box.checked = true;
            return;
          }
          set({ codes: next });
        });
        return h('label', { class: 'check' }, box, CODE_LABELS[code]);
      }),
    );
    const voice = h('input', { type: 'checkbox', checked: s.voice });
    voice.addEventListener('change', () => set({ voice: voice.checked }));

    const settings = h(
      'section',
      { class: 'card' },
      h('h2', {}, 'Réglages'),
      h(
        'div',
        { class: 'fields' },
        select<UniverseLevel>('Univers', s.universe, [
          [1, '1 — découverte, classe par classe'],
          [2, '2 — grands nombres ouverts'],
          [3, '3 — tout ouvert, avec décimaux'],
        ], (v) => {
          if (confirm('Changer d’univers recommence la partie de ce patient. Continuer ?')) set({ universe: v });
          else panel(p.id);
        }),
        select<ProblemLevel>('Niveau des enquêtes', s.level, PROBLEM_LEVELS.map((l) => [l, `${l} — ${levelText(l)}`]), (v) => set({ level: v })),
        select<ExchangeMode>('Échanges', s.exchangeMode, [
          ['progressive', 'manuels, puis machine après 10 échanges'],
          ['manual', 'toujours manuels'],
          ['auto', 'automatiques'],
        ], (v) => set({ exchangeMode: v })),
        select<number>('Pannes (enquêtes)', s.breakdownInterval, [
          [0, 'jamais (seulement à la demande)'],
          [30, 'fréquentes (30 s)'],
          [45, 'normales (45 s)'],
          [90, 'rares (90 s)'],
        ], (v) => set({ breakdownInterval: v })),
        select<Settings['factorySpeed']>('Vitesse des usines', s.factorySpeed, [
          ['lente', 'lente (1 élément toutes les 5 s)'],
          ['normale', 'normale (1 élément toutes les 3 s)'],
          ['rapide', 'rapide (1 élément par seconde)'],
        ], (v) => set({ factorySpeed: v })),
        select<Orthographe>('Orthographe des nombres', s.orthographe, [
          ['rectifiee', 'rectifiée 1990 (vingt-et-un, deux-cents)'],
          ['traditionnelle', 'traditionnelle (vingt et un, deux cents)'],
        ], (v) => set({ orthographe: v })),
        h('label', { class: 'check' }, voice, 'Lecture à voix haute'),
        codes,
      ),
    );

    const g = p.game;
    const progress = h(
      'section',
      { class: 'card' },
      h('h2', {}, 'Progression'),
      g
        ? h(
            'ul',
            { class: 'facts' },
            h('li', {}, `Classe la plus grande ouverte : ${className(g.maxClass)}`),
            h('li', {}, `Usines construites : ${g.factories.length}`),
            h('li', {}, `Temps de jeu : ${Math.round(g.time / 60)} min`),
            h('li', {}, `Échanges manuels : ${Object.values(g.manualExchanges).reduce((a, b) => a + b, 0)}`),
          )
        : h('p', { class: 'muted' }, 'Le questionnaire n’a pas encore été passé.'),
      h(
        'div',
        { class: 'row wrap' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { p.placementDone = false; save(); panel(p.id); } }, '🔁 Refaire le questionnaire'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => {
          if (!confirm(`Recommencer la partie de ${p.name} ? Les statistiques sont conservées.`)) return;
          p.game = newGameFor(p.settings);
          save();
          panel(p.id);
        } }, '♻️ Recommencer la partie'),
        only ? null : h('button', { class: 'btn ghost', type: 'button', onclick: () => download(p) }, '📤 Exporter (cabinet ↔ maison)'),
        only ? null : h('button', { class: 'btn danger', type: 'button', onclick: () => {
          if (!confirm(`Supprimer définitivement le profil de ${p.name} ?`)) return;
          store.profiles = store.profiles.filter((x) => x.id !== p.id);
          save();
          panel(store.profiles[0]?.id);
        } }, '🗑️ Supprimer'),
      ),
    );

    return h('div', { class: 'patient' }, settings, progress, statsSection(p));
  }
}

/** Choix de la voix de lecture : propre à l'appareil. */
function voiceSection(): HTMLElement {
  const sample = 'Bonjour ! Deux mille vingt-quatre. Dix centaines, c’est une unité de mille.';
  const statusLine = h('p', { class: 'muted' });
  const showStatus = (st: VoiceStatus) => {
    statusLine.textContent = {
      idle: '',
      downloading: `Téléchargement de la voix : ${st.state === 'downloading' ? st.percent : 0} % (une seule fois, ~60 Mo)`,
      ready: '✓ Voix prête, elle fonctionne hors ligne.',
      error: `La voix n’a pas pu être téléchargée (${st.state === 'error' ? st.message : ''}). Vérifiez la connexion internet.`,
    }[st.state];
  };
  showStatus(voiceStatus());
  const unsubscribe = onVoiceStatus((st) => {
    if (!statusLine.isConnected) return unsubscribe();
    showStatus(st);
  });

  const chosen = chosenVoice();
  const select = h(
    'select',
    { class: 'input' },
    NEURAL_VOICES.map((v) => h('option', { value: v.id, selected: chosen === v.id }, v.label)),
  );
  select.addEventListener('change', () => {
    setChosenVoice(select.value);
    speak(sample, true);
  });
  return h(
    'section',
    { class: 'card' },
    h('h2', {}, '🔊 Voix (cet appareil)'),
    h('div', { class: 'row wrap' }, select, h('button', { class: 'btn ghost', type: 'button', onclick: () => speak(sample, true) }, '▶ Écouter')),
    statusLine,
  );
}

function levelText(l: ProblemLevel): string {
  return { A: '+ et −', B: '× et ÷, aire', C: 'mélange, proportionnalité', D: 'fonctions', E: 'puissances' }[l];
}

function pct(ok: number, total: number): string {
  return total === 0 ? '—' : `${Math.round((ok / total) * 100)} %`;
}

function statsSection(p: Profile): HTMLElement {
  const byKind = statsByKind(p);
  const byMode: Record<string, { attempts: number; firstTry: number }> = {};
  for (const a of p.history) {
    const m = (byMode[a.mode] ??= { attempts: 0, firstTry: 0 });
    m.attempts++;
    if (a.firstTry) m.firstTry++;
  }
  const table = (title: string, rows: [string, { attempts: number; firstTry: number }][]) =>
    h(
      'table',
      { class: 'stats' },
      h('tr', {}, h('th', {}, title), h('th', {}, 'Enquêtes'), h('th', {}, 'Réussies du 1er coup')),
      rows.map(([label, st]) => h('tr', {}, h('td', {}, label), h('td', {}, st.attempts), h('td', {}, pct(st.firstTry, st.attempts)))),
    );
  const recent = p.history.slice(-15).reverse();
  return h(
    'section',
    { class: 'card' },
    h('h2', {}, 'Statistiques'),
    p.history.length === 0
      ? h('p', { class: 'muted' }, 'Pas encore d’enquête résolue.')
      : h(
          'div',
          { class: 'stats-grid' },
          table('Type', (Object.entries(byKind) as [ProblemKind, { attempts: number; firstTry: number }][]).map(([k, v]) => [KIND_LABELS[k], v])),
          table('Réponse en', Object.entries(byMode).map(([k, v]) => [MODE_LABELS[k], v])),
          h(
            'table',
            { class: 'stats' },
            h('tr', {}, h('th', {}, 'Dernières enquêtes'), h('th', {}, 'Réponse'), h('th', {}, 'Résultat')),
            recent.map((a) =>
              h(
                'tr',
                {},
                h('td', {}, `${new Date(a.t).toLocaleDateString('fr-FR')} · ${KIND_LABELS[a.kind]} (${a.level})`),
                h('td', {}, MODE_LABELS[a.mode]),
                h('td', {}, a.firstTry ? '✓ 1er coup' : `après aide${a.hints ? ' 💡' : ''}`),
              ),
            ),
          ),
        ),
  );
}

function download(p: Profile): void {
  const blob = new Blob([exportProfile(p)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `numeria-${p.name}.json` });
  a.click();
  URL.revokeObjectURL(a.href);
}
