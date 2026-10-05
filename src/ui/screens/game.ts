/**
 * Écran de jeu : le monde (code analogique) avec ses classes de droite à gauche
 * et l'effet de dézoom, le bandeau du nombre (codes arabe et verbal) et le
 * tableau de numération où l'on fait les échanges.
 */
import * as E from '../../core/economy';
import { MAX_CLASS, className, formatNumber, rankLetter, rankName, ranksOfClass } from '../../core/numbers';
import { generateProblem } from '../../core/problems';
import { recordAttempt, type Profile } from '../../core/profile';
import { hooks, save } from '../app';
import { blockStack, CLASS_COLORS, words } from '../codes';
import { h } from '../dom';
import { openModal } from '../modal';
import { openProblem, tripleCode } from '../problemView';
import { onVoiceStatus, setVoiceEnabled, speak, voiceStatus, type VoiceStatus } from '../speech';

/** Taille d'une zone (classe) en unités de dessin, et rapport de taille entre deux classes. */
const ZW = 1000;
const ZH = 620;
const F = 2.4;

const zoneScale = (cls: number) => F ** cls;
function zoneLeft(cls: number): number {
  if (cls < 0) return 0;
  let x = 0;
  for (let j = 0; j <= cls; j++) x -= ZW * F ** j;
  return x;
}

const factoryName = (rank: number) => `usine à ${rankName(rank)}`;

interface BinRef {
  rank: number;
  stack: HTMLElement;
  count: HTMLElement;
  bin: HTMLElement;
  shown: number;
}

/** Rend une fonction qui arrête la partie (boucle, minuteries) sans quitter l'écran. */
export function showGame(root: HTMLElement, profile: Profile, onExit: () => void): () => void {
  const g = profile.game!;
  const s = profile.settings;
  setVoiceEnabled(s.voice);
  let camClass = g.currentClass;
  let lastTotal = -1;

  // ---------- Bandeau : codes arabe et verbal ----------
  const voiceBadge = h('span', { class: 'voice-badge' });
  const showVoice = (st: VoiceStatus) => {
    voiceBadge.hidden = !s.voice || st.state !== 'downloading';
    voiceBadge.textContent = st.state === 'downloading' ? `${st.percent} %` : '';
  };
  showVoice(voiceStatus());
  const stopVoiceWatch = onVoiceStatus(showVoice);
  const bannerArabe = h('div', { class: 'banner-arabe' });
  const bannerWords = h('div', { class: 'banner-words' });
  const detectiveBtn = h('button', { class: 'btn detective', type: 'button', onclick: () => investigate() }, '🕵️ Enquête');
  const topbar = h(
    'header',
    { class: 'topbar' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => exit(), 'aria-label': 'accueil' }, '🏠'),
    h('span', { class: 'avatar' }, profile.avatar),
    h('div', { class: 'banner' }, bannerArabe, bannerWords),
    h(
      'button',
      { class: 'btn icon voice-btn', type: 'button', 'aria-label': 'écouter le nombre', onclick: () => speak(words(E.totalValue(g), 'traditionnelle')) },
      '🔊',
      voiceBadge,
    ),
    detectiveBtn,
  );

  // ---------- Monde : code analogique ----------
  const world = h('div', { class: 'world' });
  const viewport = h('div', { class: 'viewport' }, world);
  let bins: BinRef[] = [];
  const factoryRows = new Map<number, { el: HTMLElement; key: string }>();
  let worldKey = '';

  function buildZone(cls: number): HTMLElement {
    const sc = zoneScale(cls);
    const zoneBins = ranksOfClass(cls).map((rank) => {
      const stack = h('div', { class: 'bin-blocks' });
      const count = h('div', { class: 'bin-count' });
      const bin = h(
        'div',
        { class: 'bin', onclick: () => E.canExchange(g, rank) && doExchange(rank) },
        h('div', { class: 'bin-label' }, rankName(rank)),
        stack,
        count,
        h('div', { class: 'bin-exchange' }, '⬅ échanger 10'),
      );
      bins.push({ rank, stack, count, bin, shown: -1 });
      return bin;
    });
    const factories = h('div', { class: 'factories' });
    factoryRows.set(cls, { el: factories, key: '' });
    return h(
      'div',
      {
        class: 'zone',
        style: `--c:${CLASS_COLORS[cls]};width:${ZW}px;height:${ZH}px;transform:translate(${zoneLeft(cls)}px,${-ZH * sc}px) scale(${sc})`,
      },
      h('div', { class: 'zone-sign' }, `Classe des ${className(cls)}`),
      h('div', { class: 'bins' }, zoneBins),
      factories,
      h('div', { class: 'ground' }),
    );
  }

  function buildWorld() {
    bins = [];
    factoryRows.clear();
    const zones: HTMLElement[] = [];
    if (g.decimals) zones.push(buildZone(-1));
    for (let cls = 0; cls <= g.maxClass; cls++) zones.push(buildZone(cls));
    if (g.maxClass < MAX_CLASS) {
      const next = g.maxClass + 1;
      const sc = zoneScale(next);
      zones.push(
        h(
          'div',
          {
            class: 'zone fog',
            style: `width:${ZW}px;height:${ZH}px;transform:translate(${zoneLeft(next)}px,${-ZH * sc}px) scale(${sc})`,
          },
          h('div', { class: 'fog-text' }, '?'),
        ),
      );
    }
    world.replaceChildren(...zones);
    worldKey = `${g.maxClass}/${g.decimals}`;
  }

  function applyCamera(animate: boolean) {
    const sc = zoneScale(camClass);
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const zoom = Math.min(vw / (ZW * sc * 1.06), vh / (ZH * sc * 1.06));
    const cx = zoneLeft(camClass) + (ZW * sc) / 2;
    const cy = (-ZH * sc) / 2;
    world.classList.toggle('animate', animate);
    world.style.transform = `translate(${vw / 2}px,${vh / 2}px) scale(${zoom}) translate(${-cx}px,${-cy}px)`;
  }

  function updateFactories() {
    for (const [cls, row] of factoryRows) {
      const groups = ranksOfClass(cls)
        .map((rank) => {
          const fs = g.factories.filter((f) => f.rank === rank);
          const golden = fs.filter((f) => f.golden).length;
          return { rank, n: fs.length - golden, golden, broken: fs.some((f) => f.broken) };
        })
        .filter((x) => x.n + x.golden > 0);
      const key = JSON.stringify(groups);
      if (key === row.key) continue;
      row.key = key;
      row.el.replaceChildren(
        ...groups.map((x) =>
          h(
            'button',
            {
              class: `factory${x.broken ? ' broken' : ''}${x.golden ? ' golden' : ''}`,
              type: 'button',
              title: factoryName(x.rank),
              onclick: () => x.broken && investigate(),
            },
            h('span', { class: 'factory-icon' }, x.broken ? '🔍' : '🏭'),
            h('span', { class: 'factory-label' }, `${rankLetter(x.rank)} ×${x.n}`),
            x.golden ? h('span', { class: 'factory-golden' }, `⭐×${x.golden}`) : null,
          ),
        ),
      );
    }
  }

  // ---------- Tableau de numération : code arabe et échanges ----------
  const hud = h('div', { class: 'hud' });
  let hudKey = '';
  let hudCols: { rank: number; count: HTMLElement; exch: HTMLButtonElement; machine: HTMLButtonElement }[] = [];

  function buildHud() {
    hudCols = [];
    const ranks = E.openRanks(g);
    const classes = [...new Set(ranks.map((r) => Math.floor(r / 3)))];
    hud.replaceChildren(
      ...classes.map((cls) =>
        h(
          'div',
          { class: 'hud-class', style: `--c:${CLASS_COLORS[cls]}` },
          h('div', { class: 'hud-class-name' }, className(cls)),
          h(
            'div',
            { class: 'hud-cols' },
            ranksOfClass(cls).map((rank) => {
              const count = h('div', { class: 'hud-count' });
              const exch = h(
                'button',
                { class: 'btn exch', type: 'button', title: `échanger 10 ${rankName(rank)}`, onclick: () => doExchange(rank) },
                '⬅ 10 → 1',
              );
              const machine = h(
                'button',
                { class: 'btn machine', type: 'button', onclick: () => { E.buyExchangeMachine(g, rank); update(true); } },
              );
              hudCols.push({ rank, count, exch, machine });
              return h(
                'div',
                { class: 'hud-col', title: rankName(rank) },
                h('div', { class: 'hud-letter' }, rankLetter(rank)),
                count,
                exch,
                machine,
              );
            }),
          ),
        ),
      ),
    );
    hudKey = ranks.join(',');
  }

  function doExchange(rank: number) {
    const events = E.exchange(g, rank);
    handleEvents(events);
    update(true);
  }

  // ---------- Actions : produire, construire, avancer ----------
  const tapBtn = h(
    'button',
    {
      class: 'btn tap',
      type: 'button',
      onclick: () => {
        E.tap(g);
        tapBtn.classList.remove('pop');
        void tapBtn.offsetWidth;
        tapBtn.classList.add('pop');
        update(true);
      },
    },
    h('span', { class: 'tap-icon' }, '✋'),
    h('span', {}, 'Fabriquer 1 unité'),
  );
  const shop = h('div', { class: 'shop' });
  let shopKey = '';
  let shopItems: { rank: number; btn: HTMLButtonElement; cost: HTMLElement; owned: HTMLElement }[] = [];
  function buildShop() {
    shopItems = [];
    // les usines abordables (petits rangs) en premier
    const ranks = [...E.availableFactoryRanks(g)].reverse();
    shop.replaceChildren(
      h('h3', {}, '🏭 Construire'),
      ...ranks.map((rank) => {
        const cost = h('span', { class: 'shop-cost' });
        const owned = h('span', { class: 'shop-owned' });
        const btn = h(
          'button',
          {
            class: 'shop-item',
            type: 'button',
            style: `--c:${CLASS_COLORS[Math.floor(rank / 3)]}`,
            onclick: () => {
              if (E.buildFactory(g, rank)) update(true);
            },
          },
          h('span', { class: 'shop-name' }, factoryName(rank)),
          owned,
          cost,
        );
        shopItems.push({ rank, btn, cost, owned });
        return btn;
      }),
    );
    shopKey = ranks.join(',');
  }
  const navBtn = h(
    'button',
    {
      class: 'btn nav',
      type: 'button',
      onclick: () => {
        if (E.moveLeft(g)) {
          camClass = g.currentClass;
          applyCamera(true);
          update(true);
        }
      },
    },
  );
  const side = h('aside', { class: 'side' }, tapBtn, navBtn, shop);

  const screen = h('div', { class: 'game' }, topbar, h('main', { class: 'play' }, viewport, side), hud);
  root.replaceChildren(screen);

  // ---------- Mise à jour de l'affichage ----------
  function update(force = false) {
    const total = E.totalValue(g);
    if (force || total !== lastTotal) {
      lastTotal = total;
      bannerArabe.textContent = formatNumber(total);
      bannerWords.textContent = words(total, s.orthographe);
    }
    if (worldKey !== `${g.maxClass}/${g.decimals}`) buildWorld();
    for (const b of bins) {
      const c = g.counts[b.rank];
      b.bin.classList.toggle('can-exchange', E.canExchange(g, b.rank) && !E.isAutoExchanging(g, b.rank));
      if (c === b.shown) continue;
      b.shown = c;
      b.stack.replaceChildren(blockStack(b.rank, c));
      b.count.textContent = String(c);
      b.bin.classList.toggle('full', c >= 10);
      b.bin.classList.toggle('max', c >= E.CAPACITY);
    }
    updateFactories();

    if (hudKey !== E.openRanks(g).join(',')) buildHud();
    for (const col of hudCols) {
      const c = g.counts[col.rank];
      col.count.textContent = String(c);
      col.count.classList.toggle('over', c >= 10);
      col.exch.hidden = !E.canExchange(g, col.rank) || E.isAutoExchanging(g, col.rank);
      const auto = E.isAutoExchanging(g, col.rank);
      const buyable = E.canBuyExchangeMachine(g, col.rank);
      col.machine.hidden = !auto && !buyable;
      col.machine.disabled = auto || total < E.exchangeMachineCost(col.rank);
      col.machine.textContent = auto ? '🤖 auto' : `🤖 ${formatNumber(E.exchangeMachineCost(col.rank))}`;
      col.machine.title = auto ? 'échange automatique' : 'acheter une machine à échanger';
    }

    if (shopKey !== [...E.availableFactoryRanks(g)].reverse().join(',')) buildShop();
    for (const item of shopItems) {
      const cost = E.factoryCost(g, item.rank);
      item.cost.textContent = formatNumber(cost);
      item.owned.textContent = `×${g.factories.filter((f) => f.rank === item.rank).length}`;
      item.btn.disabled = total < cost;
    }

    navBtn.hidden = g.currentClass >= g.maxClass;
    navBtn.textContent = `⬅ Vers les ${className(g.currentClass + 1) ?? ''}`;
    detectiveBtn.classList.toggle('alert', g.factories.some((f) => f.broken));
  }

  // ---------- Événements du jeu ----------
  let modalOpen = false;
  function handleEvents(events: E.GameEvent[]) {
    for (const ev of events) {
      if (ev.type === 'breakdown') {
        speak('Oh non, une usine est en panne ! Mène l’enquête.');
      } else if (ev.type === 'classOpened') {
        celebrate(ev.cls);
      }
    }
  }

  function celebrate(cls: number) {
    modalOpen = true;
    buildWorld();
    update(true);
    const value = 10 ** (3 * cls);
    const one = rankName(3 * cls).replace(/^unités/, 'unité');
    speak(`Bravo ! Tu as ouvert la classe des ${className(cls)}. Dix ${rankName(3 * cls - 1)}, c’est une ${one}.`);
    const close = openModal(
      h(
        'div',
        { class: 'celebrate' },
        h('h2', {}, `🎉 Nouvelle classe : les ${className(cls)} !`),
        h('p', {}, `10 ${rankName(3 * cls - 1)} = 1 ${one}`),
        tripleCode(value, s.orthographe),
        h(
          'button',
          {
            class: 'btn primary',
            type: 'button',
            onclick: () => {
              close();
              explore();
            },
          },
          'Explorer →',
        ),
      ),
      'celebrate-modal',
      () => explore(),
    );
    function explore() {
      modalOpen = false;
      camClass = g.currentClass;
      applyCamera(true);
      save();
    }
  }

  function investigate() {
    if (modalOpen) return;
    const broken = g.factories.find((f) => f.broken);
    const problem = generateProblem({ level: s.level, maxClass: g.maxClass, codes: s.codes });
    modalOpen = true;
    openProblem(problem, {
      orthographe: s.orthographe,
      title: broken ? `🕵️ L’${factoryName(broken.rank)} est en panne !` : '🕵️ Défi du détective',
      onClose: () => {
        modalOpen = false;
      },
      onDone: ({ solved, firstTry, hints }) => {
        modalOpen = false;
        recordAttempt(profile, { kind: problem.kind, level: s.level, mode: problem.answerMode, firstTry, hints });
        hooks.attempt(profile.history[profile.history.length - 1]);
        if (broken) E.repairFactory(g, broken.id);
        if (solved) {
          const rank = broken?.rank ?? E.rewardRank(g);
          E.rewardFactory(g, rank, firstTry);
          const prize = firstTry ? `une usine dorée à ${rankName(rank)}, trois fois plus rapide` : `une usine à ${rankName(rank)}`;
          toast(`${firstTry ? '⭐' : '🏭'} Tu gagnes ${prize} !`);
          speak(`${broken ? 'L’usine est réparée ! ' : ''}Tu gagnes ${prize} !`);
        } else if (broken) {
          toast('🔧 L’usine est réparée.');
        }
        save();
        update(true);
      },
    });
  }

  function toast(text: string) {
    const el = h('div', { class: 'toast' }, text);
    screen.append(el);
    setTimeout(() => el.remove(), 4000);
  }

  // ---------- Boucle ----------
  let last = performance.now();
  let acc = 0;
  let raf = 0;
  function frame(now: number) {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    handleEvents(E.tick(g, dt));
    acc += dt;
    if (acc >= 0.1) {
      acc = 0;
      update();
    }
    raf = requestAnimationFrame(frame);
  }
  const saveTimer = window.setInterval(save, 5000);
  const onResize = () => applyCamera(false);
  const onHide = () => document.visibilityState === 'hidden' && save();
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onHide);

  let stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true;
    stopVoiceWatch();
    cancelAnimationFrame(raf);
    clearInterval(saveTimer);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onHide);
    save();
  }

  function exit() {
    stop();
    onExit();
  }

  buildWorld();
  update(true);
  requestAnimationFrame(() => {
    if (stopped) return;
    applyCamera(false);
    raf = requestAnimationFrame(frame);
  });
  return stop;
}
