/**
 * Contexte de jeu branché sur Rails : état et essais envoyés en JSON.
 * Les essais partent par lots ; l'état est sauvegardé avec un léger délai.
 */
import { speak } from '../ui/speech';
import type { AttemptRecord, GameContext, PlayerProfile } from './types';

export interface PortalConfig {
  slug: string;
  profile: PlayerProfile;
  mode: 'seance' | 'maison';
  adult: boolean;
  state: unknown;
  settings: Record<string, unknown>;
  /** URL de base : POST {base}/state, {base}/settings, {base}/attempts */
  apiBase: string;
  exitUrl: string;
}

function csrf(): string {
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

async function post(url: string, body: unknown, keepalive = false): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf(), Accept: 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
    keepalive,
  });
  if (res.status === 401) window.location.href = '/session/new';
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export function portalContext(cfg: PortalConfig): GameContext & { flush(): void } {
  let pending: AttemptRecord[] = [];
  let stateToSave: unknown = undefined;
  let stateTimer = 0;
  let attemptTimer = 0;

  const flushAttempts = (keepalive = false) => {
    window.clearTimeout(attemptTimer);
    if (pending.length === 0) return;
    const batch = pending;
    pending = [];
    post(`${cfg.apiBase}/attempts`, { mode: cfg.mode, attempts: batch }, keepalive).catch(() => {
      pending = [...batch, ...pending];
    });
  };
  const flushState = (keepalive = false) => {
    window.clearTimeout(stateTimer);
    if (stateToSave === undefined) return;
    const s = stateToSave;
    stateToSave = undefined;
    post(`${cfg.apiBase}/state`, { state: s }, keepalive).catch(() => {
      stateToSave ??= s;
    });
  };

  return {
    slug: cfg.slug,
    profile: cfg.profile,
    mode: cfg.mode,
    adult: cfg.adult,
    state: cfg.state,
    settings: cfg.settings,
    saveState(state) {
      stateToSave = structuredClone(state);
      window.clearTimeout(stateTimer);
      stateTimer = window.setTimeout(() => flushState(), 1500);
    },
    saveSettings(settings) {
      this.settings = settings;
      post(`${cfg.apiBase}/settings`, { settings }).catch((e) => console.error(e));
    },
    record(a) {
      pending.push(a);
      window.clearTimeout(attemptTimer);
      attemptTimer = window.setTimeout(() => flushAttempts(), pending.length >= 5 ? 0 : 3000);
    },
    speak: (t) => speak(t),
    exit() {
      flushAttempts(true);
      flushState(true);
      window.location.href = cfg.exitUrl;
    },
    flush() {
      flushAttempts(true);
      flushState(true);
    },
  };
}
