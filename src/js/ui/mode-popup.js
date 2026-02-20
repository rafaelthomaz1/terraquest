import { createEl, clearChildren } from '../utils/dom.js';
import { COUNTRIES, COUNTRY_INFO, ISO_ALPHA2, CONTINENTS, CONTINENT_NAMES } from '../data/countries.js';

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

  overlayEl = createEl("div", "mode-popup-overlay");

  const card = createEl("div", "game-lost-card");
  card.appendChild(createEl("div", "game-lost-title", "Você perdeu!"));
  card.appendChild(createEl("div", "game-lost-subtitle", "Sua sequência foi interrompida"));
  card.appendChild(createEl("div", "game-lost-streak", String(bestStreak)));
  card.appendChild(createEl("div", "game-lost-streak-label", "melhor sequência"));

  const btnsWrap = createEl("div", "game-lost-btns");

  const restartBtn = createEl("button", "game-lost-btn game-lost-btn--restart", "Recomeçar");
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
}

export function showCountryInfoPopup(id, hideFields) {
  closeModePopup();

  overlayEl = createEl("div", "mode-popup-overlay");

  const card = createEl("div", "country-info-card");

  const alpha2 = ISO_ALPHA2[id];
  if (alpha2) {
    const flag = createEl("img", "country-info-flag");
    flag.src = `https://flagcdn.com/w320/${alpha2}.png`;
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
  card.appendChild(createEl("div", "guidelines-subtitle", "Diretrizes do Jogo"));

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

export function closeModePopup() {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}
