import { createEl, clearChildren } from '../utils/dom.js';
import { COUNTRIES, COUNTRY_INFO, ISO_ALPHA2, CONTINENTS, CONTINENT_NAMES } from '../data/countries.js';
import { authState, game } from '../state.js';
import { getElapsedSeconds } from './stopwatch.js';

let overlayEl = null;

export function showModePopup(title, subtitle, options, onSelect) {
  closeModePopup();

  overlayEl = createEl("div", "mode-popup-overlay");

  const card = createEl("div", "mode-popup-card");
  card.appendChild(createEl("div", "mode-popup-title", title));
  if (subtitle) card.appendChild(createEl("div", "mode-popup-subtitle", subtitle));

  const btnsWrap = createEl("div", "mode-popup-btns");
  options.forEach(opt => {
    const btn = createEl("button", "mode-popup-btn");

    if (opt.icon) {
      btn.appendChild(createEl("span", "mode-popup-btn-icon", opt.icon));
    }

    const content = createEl("div", "mode-popup-btn-content");
    content.appendChild(createEl("div", "mode-popup-btn-label", opt.label));
    if (opt.desc) {
      content.appendChild(createEl("div", "mode-popup-btn-desc", opt.desc));
    }

    const records = authState.recordsCache;
    if (authState.currentUser && !authState.isGuest && opt.value && !opt.noRecord) {
      if (records && records[opt.value]) {
        const rec = records[opt.value];
        const mins = Math.floor(rec.time_seconds / 60);
        const secs = rec.time_seconds % 60;
        const timeStr = mins > 0 ? `${mins}min ${secs}s` : `${secs}s`;
        const pct = rec.total > 0 ? Math.round((rec.score / rec.total) * 100) : 0;

        const badge = createEl("div", "record-badge");
        const row1 = createEl("div", "record-badge-row");
        row1.appendChild(createEl("span", "record-badge-icon", "\uD83C\uDFC6"));
        row1.appendChild(createEl("span", "record-badge-score", `Recorde: ${rec.score}/${rec.total}`));
        const timeWrap = createEl("span", "record-badge-time-wrap");
        timeWrap.appendChild(createEl("span", "record-badge-time-icon", "\u23F1"));
        timeWrap.appendChild(createEl("span", "record-badge-time", timeStr));
        row1.appendChild(timeWrap);
        badge.appendChild(row1);

        const row2 = createEl("div", "record-badge-row2");
        const track = createEl("div", "record-badge-track");
        const bar = createEl("div", "record-badge-bar");
        bar.style.width = `${pct}%`;
        track.appendChild(bar);
        row2.appendChild(track);
        row2.appendChild(createEl("span", "record-badge-pct", `${pct}%`));
        badge.appendChild(row2);

        content.appendChild(badge);
      } else {
        const badge = createEl("div", "record-badge record-badge--empty");
        badge.appendChild(createEl("span", "record-badge-empty-text", "Sem registro ainda"));
        content.appendChild(badge);
      }
    }

    btn.appendChild(content);

    if (opt.tooltip) {
      const tip = createEl("div", "mode-popup-tooltip", opt.tooltip);
      btn.appendChild(tip);
    }

    btn.addEventListener("click", () => {
      closeModePopup();
      onSelect(opt.value);
    });
    btnsWrap.appendChild(btn);
  });
  card.appendChild(btnsWrap);

  const cancelBtn = createEl("button", "mode-popup-cancel", "Cancelar");
  cancelBtn.addEventListener("click", closeModePopup);
  card.appendChild(cancelBtn);

  overlayEl.appendChild(card);
  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) closeModePopup();
  });

  document.body.appendChild(overlayEl);
  requestAnimationFrame(() => overlayEl.classList.add("show"));
}

export function showGameLostPopup(bestStreak, onRestart, onMenu) {
  closeModePopup();

  let xpPromise = null;
  if (typeof window.__saveGameRecord === 'function' && game.currentGameMode) {
    xpPromise = window.__saveGameRecord(game.currentGameMode, bestStreak, bestStreak, getElapsedSeconds());
    game._recordSaved = true;
  }

  overlayEl = createEl("div", "mode-popup-overlay");

  const card = createEl("div", "game-lost-card");
  card.appendChild(createEl("div", "game-lost-title", "Voc\u00ea perdeu!"));
  card.appendChild(createEl("div", "game-lost-subtitle", "Sua sequ\u00eancia foi interrompida"));
  card.appendChild(createEl("div", "game-lost-streak", String(bestStreak)));
  card.appendChild(createEl("div", "game-lost-streak-label", "melhor sequ\u00eancia"));

  const xpContainer = createEl("div", "xp-popup");
  card.appendChild(xpContainer);

  const btnsWrap = createEl("div", "game-lost-btns");

  const restartBtn = createEl("button", "game-lost-btn game-lost-btn--restart", "Recome\u00e7ar");
  restartBtn.addEventListener("click", () => {
    closeModePopup();
    onRestart();
  });
  btnsWrap.appendChild(restartBtn);

  const menuBtn = createEl("button", "game-lost-btn game-lost-btn--menu", "Menu");
  menuBtn.addEventListener("click", () => {
    closeModePopup();
    onMenu();
  });
  btnsWrap.appendChild(menuBtn);

  card.appendChild(btnsWrap);
  overlayEl.appendChild(card);

  document.body.appendChild(overlayEl);
  requestAnimationFrame(() => overlayEl.classList.add("show"));

  if (xpPromise) showXPAnimation(xpPromise, xpContainer);
}

export function showCountryInfoPopup(id, hideFields) {
  closeModePopup();

  overlayEl = createEl("div", "mode-popup-overlay");

  const card = createEl("div", "country-info-card");

  const alpha2 = ISO_ALPHA2[id];
  if (alpha2) {
    const flag = createEl("img", "country-info-flag");
    flag.src = `/flags/${alpha2}.png`;
    flag.alt = COUNTRIES[id];
    card.appendChild(flag);
  }

  card.appendChild(createEl("div", "country-info-name", COUNTRIES[id]));

  const info = COUNTRY_INFO[id];
  const continent = CONTINENTS[id];
  const hidden = hideFields || [];

  const rows = [];
  if (info) {
    if (!hidden.includes("capital")) rows.push(["\uD83C\uDFDB\uFE0F Capital", info[0]]);
    if (!hidden.includes("population")) rows.push(["\uD83D\uDC65 Popula\u00e7\u00e3o", info[1]]);
    if (!hidden.includes("language")) rows.push(["\uD83D\uDDE3\uFE0F Idiomas", info[2]]);
    rows.push(["\uD83D\uDCB0 Moeda", info[3]]);
  }
  if (continent && CONTINENT_NAMES[continent]) {
    rows.push(["\uD83C\uDF0D Continente", CONTINENT_NAMES[continent]]);
  }

  rows.forEach(([label, value]) => {
    const row = createEl("div", "country-info-row");
    row.appendChild(createEl("span", "country-info-label", label));
    row.appendChild(createEl("span", "country-info-value", value));
    card.appendChild(row);
  });

  const closeBtn = createEl("button", "guidelines-close-btn", "Fechar");
  closeBtn.addEventListener("click", closeModePopup);
  card.appendChild(closeBtn);

  overlayEl.appendChild(card);
  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) closeModePopup();
  });

  document.body.appendChild(overlayEl);
  requestAnimationFrame(() => overlayEl.classList.add("show"));
}

export function showGuidelinesPopup() {
  closeModePopup();

  overlayEl = createEl("div", "mode-popup-overlay");

  const card = createEl("div", "guidelines-card");

  card.appendChild(createEl("div", "guidelines-title", "Terra Quest"));
  card.appendChild(createEl("div", "guidelines-subtitle", "Como Jogar"));

  const sections = [
    { icon: "\uD83C\uDF0D", title: "O que \u00e9?", text: "Uma plataforma interativa de estudos de geografia com 195 pa\u00edses, 27 estados brasileiros, 51 estados americanos e 9 modos de jogo." },
    { icon: "\uD83C\uDFAE", title: "Como jogar?", text: "Escolha um m\u00f3dulo e pratique! Voc\u00ea pode digitar nomes, clicar no mapa, reconhecer bandeiras, capitais, l\u00ednguas, silhuetas e muito mais." },
    { icon: "\uD83D\uDCC8", title: "Progresso", text: "Acompanhe seu desempenho em cada modo. Nos modos game, tente manter a maior sequ\u00eancia poss\u00edvel! Use o Modo F\u00e1cil para come\u00e7ar com dicas." },
    { icon: "\uD83C\uDF93", title: "Para quem \u00e9?", text: "Para qualquer pessoa que queira aprender ou revisar geografia de forma divertida e desafiadora." }
  ];

  sections.forEach(s => {
    const section = createEl("div", "guidelines-section");
    const header = createEl("div", "guidelines-section-header");
    header.appendChild(createEl("span", "guidelines-section-icon", s.icon));
    header.appendChild(createEl("span", "guidelines-section-title", s.title));
    section.appendChild(header);
    section.appendChild(createEl("div", "guidelines-section-text", s.text));
    card.appendChild(section);
  });

  const closeBtn = createEl("button", "guidelines-close-btn", "Entendido!");
  closeBtn.addEventListener("click", closeModePopup);
  card.appendChild(closeBtn);

  overlayEl.appendChild(card);
  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) closeModePopup();
  });

  document.body.appendChild(overlayEl);
  requestAnimationFrame(() => overlayEl.classList.add("show"));
}

export function showEndGamePopup(title, subtitle, onRestart, onMenu) {
  closeModePopup();

  let xpPromise = null;
  if (typeof window.__saveGameRecord === 'function' && game.currentGameMode) {
    const streakMatch = title.match(/(\d+)/);
    const subtitleMatch = subtitle && subtitle.match(/(\d+)\/(\d+)/);
    if (subtitleMatch) {
      xpPromise = window.__saveGameRecord(game.currentGameMode, parseInt(subtitleMatch[1]), parseInt(subtitleMatch[2]), getElapsedSeconds());
    } else if (streakMatch) {
      const streak = parseInt(streakMatch[1]);
      xpPromise = window.__saveGameRecord(game.currentGameMode, streak, streak, getElapsedSeconds());
    }
    game._recordSaved = true;
  }

  overlayEl = createEl("div", "mode-popup-overlay");

  const card = createEl("div", "game-lost-card");
  card.appendChild(createEl("div", "game-lost-title", title));
  if (subtitle) card.appendChild(createEl("div", "game-lost-subtitle", subtitle));

  const xpContainer = createEl("div", "xp-popup");
  card.appendChild(xpContainer);

  const btnsWrap = createEl("div", "game-lost-btns");

  const restartBtn = createEl("button", "game-lost-btn game-lost-btn--restart", "Jogar Novamente");
  restartBtn.addEventListener("click", () => {
    closeModePopup();
    onRestart();
  });
  btnsWrap.appendChild(restartBtn);

  const menuBtn = createEl("button", "game-lost-btn game-lost-btn--menu", "Trocar M\u00f3dulo");
  menuBtn.addEventListener("click", () => {
    closeModePopup();
    onMenu();
  });
  btnsWrap.appendChild(menuBtn);

  card.appendChild(btnsWrap);
  overlayEl.appendChild(card);

  document.body.appendChild(overlayEl);
  requestAnimationFrame(() => overlayEl.classList.add("show"));

  if (xpPromise) showXPAnimation(xpPromise, xpContainer);
}

export function showLandmarkInfoPopup(landmark, onClose) {
  closeModePopup();

  overlayEl = createEl("div", "mode-popup-overlay");

  const card = createEl("div", "landmark-info-card");

  const img = createEl("img", "landmark-info-img");
  img.src = landmark.image;
  img.alt = landmark.name;
  img.onerror = () => { img.style.display = "none"; };
  card.appendChild(img);

  card.appendChild(createEl("div", "landmark-info-name", landmark.name));

  if (landmark.desc) {
    card.appendChild(createEl("div", "landmark-info-desc", landmark.desc));
  }

  const closeBtn = createEl("button", "guidelines-close-btn", "Fechar");
  closeBtn.addEventListener("click", () => {
    closeModePopup();
    if (onClose) onClose();
  });
  card.appendChild(closeBtn);

  overlayEl.appendChild(card);
  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) {
      closeModePopup();
      if (onClose) onClose();
    }
  });

  document.body.appendChild(overlayEl);
  requestAnimationFrame(() => overlayEl.classList.add("show"));
}

async function showXPAnimation(xpPromise, container) {
  const xp = await xpPromise;
  if (!xp || !container.isConnected) return;

  container.style.position = "relative";
  const valueEl = createEl("div", "xp-popup-value", `+${xp} XP`);
  container.appendChild(valueEl);
  container.appendChild(createEl("div", "xp-popup-label", "Experi\u00eancia ganha"));

  // Particles
  for (let i = 0; i < 7; i++) {
    const p = createEl("div", "xp-particle");
    p.style.left = `${40 + Math.random() * 20}%`;
    p.style.top = "50%";
    p.style.animationDelay = `${i * 0.08}s`;
    container.appendChild(p);
  }
}

export function showEndMatchPopup({ modeName, modeIcon, score, total, timeSeconds, extraStats, xpPromise, onRestart, onMenu }) {
  closeModePopup();

  overlayEl = createEl("div", "mode-popup-overlay");

  const card = createEl("div", "end-match-card");

  if (modeIcon) card.appendChild(createEl("div", "end-match-icon", modeIcon));
  if (modeName) card.appendChild(createEl("div", "end-match-mode", modeName));

  const isPerfect = total > 0 && score >= total;
  card.appendChild(createEl("div", "end-match-title", isPerfect ? "Parab\u00e9ns!" : "Partida Finalizada"));

  // Stats grid
  const statsGrid = createEl("div", "end-match-stats");

  const scoreStat = createEl("div", "end-match-stat");
  scoreStat.appendChild(createEl("div", "end-match-stat-value", `${score}/${total}`));
  scoreStat.appendChild(createEl("div", "end-match-stat-label", "Score"));
  statsGrid.appendChild(scoreStat);

  const timeStat = createEl("div", "end-match-stat");
  timeStat.appendChild(createEl("div", "end-match-stat-value", formatMatchTime(timeSeconds)));
  timeStat.appendChild(createEl("div", "end-match-stat-label", "Tempo"));
  statsGrid.appendChild(timeStat);

  if (extraStats) {
    for (const [label, value] of extraStats) {
      const stat = createEl("div", "end-match-stat");
      stat.appendChild(createEl("div", "end-match-stat-value", String(value)));
      stat.appendChild(createEl("div", "end-match-stat-label", label));
      statsGrid.appendChild(stat);
    }
  }

  card.appendChild(statsGrid);

  // XP section
  const xpSection = createEl("div", "end-match-xp-section");
  const xpValueEl = createEl("div", "end-match-xp-value", "+0 XP");
  xpSection.appendChild(xpValueEl);
  xpSection.appendChild(createEl("div", "end-match-xp-label", "Experi\u00eancia ganha"));

  const levelWrap = createEl("div", "end-match-level-wrap");
  const levelTitle = createEl("div", "end-match-level-title", "");
  const levelTrack = createEl("div", "end-match-level-track");
  const levelFill = createEl("div", "end-match-level-fill");
  levelFill.style.width = "0%";
  levelTrack.appendChild(levelFill);
  const levelPct = createEl("div", "end-match-level-pct", "");
  levelWrap.appendChild(levelTitle);
  levelWrap.appendChild(levelTrack);
  levelWrap.appendChild(levelPct);
  xpSection.appendChild(levelWrap);

  card.appendChild(xpSection);

  // Buttons
  const btnsWrap = createEl("div", "end-match-btns");

  const restartBtn = createEl("button", "end-match-btn end-match-btn--restart", "Jogar Novamente");
  restartBtn.addEventListener("click", () => {
    closeModePopup();
    if (onRestart) onRestart();
  });
  btnsWrap.appendChild(restartBtn);

  const menuBtn = createEl("button", "end-match-btn end-match-btn--menu", "Trocar M\u00f3dulo");
  menuBtn.addEventListener("click", () => {
    closeModePopup();
    if (onMenu) onMenu();
  });
  btnsWrap.appendChild(menuBtn);

  card.appendChild(btnsWrap);
  overlayEl.appendChild(card);

  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) closeModePopup();
  });

  document.body.appendChild(overlayEl);
  requestAnimationFrame(() => overlayEl.classList.add("show"));

  // Animate XP
  if (xpPromise) {
    xpPromise.then(xp => {
      if (!xp || !xpValueEl.isConnected) return;
      animateXPCounter(xpValueEl, xp, 1200);
      setTimeout(() => spawnEndMatchParticles(xpSection, xpValueEl), 250);

      // Update level info
      try {
        const { getLevelProgress, getLevelTitle } = window.__achFns || {};
        if (getLevelProgress && getLevelTitle) {
          const fetchCurrentXP = async () => {
            try {
              const res = await fetch('/api/records/stats', { credentials: 'include' });
              if (!res.ok) return;
              const data = await res.json();
              const prog = getLevelProgress(data.totalXP);
              levelTitle.textContent = `Nv.${prog.lvl} ${getLevelTitle(prog.lvl)}`;
              levelPct.textContent = `${Math.round(prog.pct)}%`;
              setTimeout(() => { levelFill.style.width = `${prog.pct}%`; }, 200);
            } catch {}
          };
          fetchCurrentXP();
        }
      } catch {}
    });
  }
}

function spawnEndMatchParticles(container, sourceEl) {
  container.style.position = 'relative';
  container.style.overflow = 'visible';
  const rect = sourceEl.getBoundingClientRect();
  const parentRect = container.getBoundingClientRect();
  const cx = rect.left + rect.width / 2 - parentRect.left;
  const cy = rect.top + rect.height / 2 - parentRect.top;
  const count = 14;
  for (let i = 0; i < count; i++) {
    const p = createEl('div', 'end-match-particle');
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const dist = 35 + Math.random() * 50;
    p.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--py', `${Math.sin(angle) * dist}px`);
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.background = Math.random() > 0.4 ? '#f59e0b' : '#e8772e';
    const size = 3 + Math.random() * 3;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.animationDelay = `${i * 0.06}s`;
    container.appendChild(p);
  }
}

function animateXPCounter(element, target, duration) {
  const start = performance.now();
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.round(easeOutCubic(progress) * target);
    element.textContent = `+${value} XP`;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function formatMatchTime(seconds) {
  if (!seconds) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

export function closeModePopup() {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}
