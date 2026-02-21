import { game, silhouetteState } from '../state.js';
import { COUNTRIES } from '../data/countries.js';
import { shuffleArray } from '../utils/shuffle.js';
import { generateOptions, renderOptionBoxes } from '../ui/option-boxes.js';
import { createEl, clearChildren } from '../utils/dom.js';
import { navigateTo } from '../ui/navigation.js';
import { showGameLostPopup, showEndGamePopup } from '../ui/mode-popup.js';
import { deduplicateFeatures } from '../utils/geo.js';

let topoCache = null;
let boxesCtrl = null;

function loadTopo() {
  if (topoCache) return Promise.resolve(topoCache);
  return d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then(world => {
    topoCache = world;
    return world;
  });
}

export function showWorldSilhouettesMode() {
  const panel = document.getElementById("silhouette-panel");
  panel.classList.add("active");
  document.getElementById("streak-container-silhouettes").style.display = "flex";

  silhouetteState.queue = Object.keys(COUNTRIES).slice();
  shuffleArray(silhouetteState.queue);
  silhouetteState.current = null;
  silhouetteState.streak = 0;
  silhouetteState.bestStreak = 0;
  silhouetteState.missedOnce = false;
  silhouetteState.gameOver = false;

  updateStreakDisplay();
  loadTopo().then(() => nextSilhouette()).catch(() => {});
}

function nextSilhouette() {
  if (silhouetteState.queue.length === 0) {
    endSilhouettes();
    return;
  }
  silhouetteState.current = silhouetteState.queue.shift();
  silhouetteState.missedOnce = false;
  renderSilhouette(silhouetteState.current);
  renderChoices(silhouetteState.current);
}

function renderSilhouette(id) {
  const svgContainer = document.getElementById("silhouette-svg-container");
  clearChildren(svgContainer);

  const world = topoCache;
  const countries = topojson.feature(world, world.objects.countries);
  countries.features = deduplicateFeatures(countries.features);
  const feature = countries.features.find(f => String(Number(f.id)) === id);
  if (!feature) { nextSilhouette(); return; }

  const size = 260;
  const svg = d3.select(svgContainer).append("svg")
    .attr("class", "silhouette-svg")
    .attr("viewBox", `0 0 ${size} ${size}`);

  const projection = d3.geoMercator().fitExtent([[10, 10], [size - 10, size - 10]], feature);
  const path = d3.geoPath().projection(projection);

  svg.append("path")
    .datum(feature)
    .attr("d", path)
    .attr("class", "silhouette-path");
}

function renderChoices(correctId) {
  const container = document.getElementById("silhouette-options");
  const { options, correctIndex } = generateOptions(
    correctId,
    COUNTRIES,
    id => COUNTRIES[id],
    shuffleArray
  );

  boxesCtrl = renderOptionBoxes(container, options, (idx, opt) => {
    if (idx === correctIndex) {
      boxesCtrl.highlightCorrect(idx);
      boxesCtrl.disable();
      silhouetteState.streak++;
      if (silhouetteState.streak > silhouetteState.bestStreak) {
        silhouetteState.bestStreak = silhouetteState.streak;
      }
      updateStreakDisplay();
      bumpStreak();
      setTimeout(() => nextSilhouette(), 800);
    } else {
      if (game.difficulty !== "hard" && !silhouetteState.missedOnce) {
        silhouetteState.missedOnce = true;
        boxesCtrl.disableOne(idx);
        boxesCtrl.highlightWrong(idx);
      } else if (game.difficulty === "learning") {
        boxesCtrl.highlightWrong(idx);
        boxesCtrl.highlightCorrect(correctIndex);
        boxesCtrl.disable();
        silhouetteState.streak = 0;
        updateStreakDisplay();
        setTimeout(() => nextSilhouette(), 1200);
      } else {
        boxesCtrl.highlightWrong(idx);
        boxesCtrl.highlightCorrect(correctIndex);
        boxesCtrl.disable();
        silhouetteState.streak = 0;
        updateStreakDisplay();
        setTimeout(() => {
          showGameLostPopup(silhouetteState.bestStreak, () => showWorldSilhouettesMode(), () => navigateTo("select"));
        }, 1200);
      }
    }
  });
}

function updateStreakDisplay() {
  const el = document.getElementById("streak-value-silhouettes");
  const bestEl = document.getElementById("streak-best-silhouettes");
  if (el) el.textContent = silhouetteState.streak;
  if (bestEl) bestEl.textContent = "Melhor: " + silhouetteState.bestStreak;
}

function bumpStreak() {
  const el = document.getElementById("streak-value-silhouettes");
  if (!el) return;
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

function endSilhouettes() {
  silhouetteState.gameOver = true;
  showEndGamePopup(
    `Melhor sequ\u00eancia: ${silhouetteState.bestStreak}`,
    "Silhuetas conclu\u00eddo!",
    () => showWorldSilhouettesMode(),
    () => navigateTo("select")
  );
}
