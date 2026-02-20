import { game } from '../state.js';
import { COUNTRIES, COUNTRY_INFO, ISO_ALPHA2 } from '../data/countries.js';
import { shuffleArray } from '../utils/shuffle.js';
import { generateOptions, renderOptionBoxes } from '../ui/option-boxes.js';
import { createEl, clearChildren } from '../utils/dom.js';
import { navigateTo } from '../ui/navigation.js';
import { showGameLostPopup, showCountryInfoPopup } from '../ui/mode-popup.js';

let streak = 0;
let bestStreak = 0;
let queue = [];
let current = null;
let missedOnce = false;
let boxesCtrl = null;
let topoCache = null;

function loadTopo() {
  if (topoCache) return Promise.resolve(topoCache);
  return d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then(world => {
    topoCache = world;
    return world;
  });
}

const capitalPool = {};
Object.keys(COUNTRY_INFO).forEach(id => {
  if (COUNTRIES[id]) capitalPool[id] = COUNTRY_INFO[id][0];
});

export function showWorldCapitalsGameMode() {
  const panel = document.getElementById("game-mode-panel");
  panel.classList.add("active");
  document.getElementById("streak-container-game").style.display = "flex";

  queue = Object.keys(COUNTRIES).slice();
  shuffleArray(queue);
  current = null;
  streak = 0;
  bestStreak = 0;
  missedOnce = false;

  updateStreakDisplay();
  loadTopo().then(() => nextCapital()).catch(() => nextCapital());
}

function nextCapital() {
  if (queue.length === 0) {
    endCapitalsGame();
    return;
  }
  current = queue.shift();
  missedOnce = false;
  renderCountryInfo(current);
  renderChoices(current);
}

function renderCountryInfo(id) {
  const display = document.getElementById("game-mode-display");
  clearChildren(display);

  if (topoCache) {
    const countries = topojson.feature(topoCache, topoCache.objects.countries);
    const feature = countries.features.find(f => String(Number(f.id)) === id);
    if (feature) {
      const size = 160;
      const svgWrap = createEl("div", "capitals-silhouette-wrap");
      const svg = d3.select(svgWrap).append("svg")
        .attr("class", "capitals-silhouette-svg")
        .attr("viewBox", `0 0 ${size} ${size}`);
      const projection = d3.geoMercator().fitExtent([[8, 8], [size - 8, size - 8]], feature);
      const path = d3.geoPath().projection(projection);
      svg.append("path").datum(feature).attr("d", path).attr("class", "silhouette-path");
      display.appendChild(svgWrap);
    }
  }

  const info = createEl("div", "game-mode-info");
  const name = createEl("span", "game-mode-country", COUNTRIES[id]);
  info.appendChild(name);

  const alpha2 = ISO_ALPHA2[id];
  const flag = createEl("img", "game-mode-capital-flag");
  flag.src = `https://flagcdn.com/w80/${alpha2}.png`;
  flag.alt = COUNTRIES[id];
  info.appendChild(flag);

  display.appendChild(info);

  const learnBtn = createEl("button", "learn-country-btn", "Aprender sobre o Pa\u00eds");
  learnBtn.addEventListener("click", () => showCountryInfoPopup(id, ["capital"]));
  display.appendChild(learnBtn);
}

function renderChoices(correctId) {
  const container = document.getElementById("game-mode-options");
  const { options, correctIndex } = generateOptions(
    correctId,
    capitalPool,
    id => COUNTRY_INFO[id][0],
    shuffleArray
  );

  boxesCtrl = renderOptionBoxes(container, options, (idx) => {
    if (idx === correctIndex) {
      boxesCtrl.highlightCorrect(idx);
      boxesCtrl.disable();
      streak++;
      if (streak > bestStreak) bestStreak = streak;
      updateStreakDisplay();
      bumpStreak();
      setTimeout(() => nextCapital(), 800);
    } else {
      if (game.difficulty !== "hard" && !missedOnce) {
        missedOnce = true;
        boxesCtrl.disableOne(idx);
        boxesCtrl.highlightWrong(idx);
      } else if (game.difficulty === "learning") {
        boxesCtrl.highlightWrong(idx);
        boxesCtrl.highlightCorrect(correctIndex);
        boxesCtrl.disable();
        streak = 0;
        updateStreakDisplay();
        setTimeout(() => nextCapital(), 1200);
      } else {
        boxesCtrl.highlightWrong(idx);
        boxesCtrl.highlightCorrect(correctIndex);
        boxesCtrl.disable();
        streak = 0;
        updateStreakDisplay();
        setTimeout(() => {
          showGameLostPopup(bestStreak, () => showWorldCapitalsGameMode(), () => navigateTo("select"));
        }, 1200);
      }
    }
  });
}

function updateStreakDisplay() {
  const el = document.getElementById("streak-value-game");
  const bestEl = document.getElementById("streak-best-game");
  if (el) el.textContent = streak;
  if (bestEl) bestEl.textContent = "Melhor: " + bestStreak;
}

function bumpStreak() {
  const el = document.getElementById("streak-value-game");
  if (!el) return;
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

function endCapitalsGame() {
  const display = document.getElementById("game-mode-display");
  const container = document.getElementById("game-mode-options");
  clearChildren(display);
  clearChildren(container);

  const msg = createEl("div", "game-mode-country");
  msg.textContent = `Fim! Melhor sequência: ${bestStreak}`;
  display.appendChild(msg);

  const btn = createEl("button", "restart-btn", "Jogar Novamente");
  btn.addEventListener("click", () => showWorldCapitalsGameMode());
  container.appendChild(btn);

  const menuBtn = createEl("button", "mode-switch-btn", "Trocar Módulo");
  menuBtn.style.marginTop = "12px";
  menuBtn.addEventListener("click", () => navigateTo("select"));
  container.appendChild(menuBtn);
}
