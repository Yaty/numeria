import { describe, expect, it } from 'vitest';
import {
  applySettings,
  createProfile,
  exportProfile,
  importProfile,
  loadStore,
  recordAttempt,
  saveStore,
  statsByKind,
} from '../src/core/profile';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe('profils', () => {
  it('un nouveau profil attend le questionnaire', () => {
    const p = createProfile('Lou', '🦊');
    expect(p.placementDone).toBe(false);
    expect(p.game).toBeNull();
    expect(p.settings.codes).toEqual(['arabe', 'verbal', 'analogique']);
  });

  it('sauvegarde et recharge le magasin', () => {
    const storage = memoryStorage();
    const p = createProfile('Lou', '🦊');
    saveStore(storage, { profiles: [p], pin: '1234' });
    const store = loadStore(storage);
    expect(store.profiles[0].name).toBe('Lou');
    expect(store.pin).toBe('1234');
  });

  it('un magasin vide ou corrompu donne un magasin neuf', () => {
    const storage = memoryStorage();
    expect(loadStore(storage)).toEqual({ profiles: [], pin: null });
    storage.setItem('numeria', '{oups');
    expect(loadStore(storage)).toEqual({ profiles: [], pin: null });
  });

  it('export/import conserve la progression et donne un nouvel identifiant si besoin', () => {
    const p = createProfile('Lou', '🦊');
    p.placementDone = true;
    applySettings(p, { universe: 2 });
    const copy = importProfile(exportProfile(p), [p.id]);
    expect(copy.name).toBe('Lou');
    expect(copy.game?.maxClass).toBe(3);
    expect(copy.id).not.toBe(p.id);
  });

  it('refuse un fichier qui n’est pas un profil', () => {
    expect(() => importProfile('{"hello":1}', [])).toThrow();
  });

  it('changer le niveau d’univers recommence la partie ; les autres réglages la conservent', () => {
    const p = createProfile('Lou', '🦊');
    applySettings(p, { universe: 1 });
    p.game!.counts[0] = 7;
    applySettings(p, { exchangeMode: 'auto', breakdownInterval: 0 });
    expect(p.game!.counts[0]).toBe(7);
    expect(p.game!.options.exchangeMode).toBe('auto');
    applySettings(p, { universe: 3 });
    expect(p.game!.counts[0]).toBe(0);
    expect(p.game!.decimals).toBe(true);
  });

  it('statistiques par type de problème (réussite au premier essai)', () => {
    const p = createProfile('Lou', '🦊');
    recordAttempt(p, { kind: 'addition', level: 'A', mode: 'clavier', firstTry: true, hints: 0 });
    recordAttempt(p, { kind: 'addition', level: 'A', mode: 'clavier', firstTry: false, hints: 1 });
    recordAttempt(p, { kind: 'aire', level: 'B', mode: 'choix-verbal', firstTry: true, hints: 0 });
    const stats = statsByKind(p);
    expect(stats.addition).toEqual({ attempts: 2, firstTry: 1 });
    expect(stats.aire).toEqual({ attempts: 1, firstTry: 1 });
  });
});
