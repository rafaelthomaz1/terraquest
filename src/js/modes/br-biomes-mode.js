import { game } from '../state.js';
import { BR_BIOMES, BR_VEGETATION, BR_CLIMATES, BR_BIOME_PATHS, BR_VEGETATION_PATHS, BR_CLIMATE_PATHS, BR_OUTLINE } from '../data/br-biomes.js';
import { shuffleArray } from '../utils/shuffle.js';
import { createEl, clearChildren } from '../utils/dom.js';
import { navigateTo } from '../ui/navigation.js';
import { stopStopwatch } from '../ui/stopwatch.js';
import { showEndGamePopup, showGameLostPopup } from '../ui/mode-popup.js';

let queue = [];
let currentTarget = null;
let correct = 0;
let wrong = 0;
let errors = 0;
let subMode = "biomes"; // "biomes" | "vegetation" | "climate"
let totalItems = 0;

function getData() {
  if (subMode === "biomes") return { items: BR_BIOMES, paths: BR_BIOME_PATHS };
  if (subMode === "vegetation") return { items: BR_VEGETATION, paths: BR_VEGETATION_PATHS };
  return { items: BR_CLIMATES, paths: BR_CLIMATE_PATHS };
}

export function showBrBiomesMode(mode) {
  subMode = mode || "biomes";
  correct = 0;
  wrong = 0;
  errors = 0;

  const panel = document.getElementById("biomes-panel");
  panel.classList.add("active");

  const { items } = getData();
  const ids = items.map(i => i.id);
  shuffleArray(ids);
  queue = ids.slice();
  totalItems = ids.length;
  currentTarget = null;
  game._biomesCorrect = 0;
  game._biomesTotal = totalItems;

  renderMap();
  nextTarget();
}

function renderMap() {
  const container = document.getElementById("biomes-map");
  clearChildren(container);

  const { items, paths } = getData();

  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgEl.setAttribute("viewBox", "0 0 600 650");
  svgEl.setAttribute("class", "biomes-svg");

  // Background outline
  const outline = document.createElementNS("http://www.w3.org/2000/svg", "path");
  outline.setAttribute("d", BR_OUTLINE);
  outline.setAttribute("fill", "var(--country-fill)");
  outline.setAttribute("stroke", "var(--country-stroke)");
  outline.setAttribute("stroke-width", "2");
  svgEl.appendChild(outline);

  // Region paths — sem cor, padrão do app
  items.forEach(item => {
    const d = paths[item.id];
    if (!d) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "var(--country-fill)");
    path.setAttribute("fill-opacity", "1");
    path.setAttribute("stroke", "var(--country-stroke)");
    path.setAttribute("stroke-width", "1");
    path.setAttribute("data-id", item.id);
    path.setAttribute("data-color", item.color);
    path.setAttribute("class", "biome-region");
    path.style.cursor = "pointer";
    path.style.transition = "fill 0.3s, stroke 0.3s, stroke-width 0.3s";
    path.addEventListener("click", () => handleRegionClick(item.id));
    path.addEventListener("mouseenter", () => {
      if (!path.classList.contains("biome-correct")) {
        path.setAttribute("stroke", "var(--accent)");
        path.setAttribute("stroke-width", "2.5");
      }
    });
    path.addEventListener("mouseleave", () => {
      if (!path.classList.contains("biome-correct")) {
        path.setAttribute("stroke", "var(--country-stroke)");
        path.setAttribute("stroke-width", "1");
      }
    });
    svgEl.appendChild(path);
  });

  container.appendChild(svgEl);
}

function nextTarget() {
  if (queue.length === 0) {
    endGame();
    return;
  }
  currentTarget = queue.shift();
  updateBanner();
}

function handleRegionClick(id) {
  if (!currentTarget) return;
  const svg = document.querySelector(".biomes-svg");
  if (!svg) return;

  const region = svg.querySelector(`[data-id="${id}"]`);
  if (!region || region.classList.contains("biome-correct")) return;

  if (id === currentTarget) {
    correct++;
    game._biomesCorrect = correct;
    region.classList.add("biome-correct");
    region.setAttribute("fill", region.getAttribute("data-color"));
    region.setAttribute("fill-opacity", "0.7");
    region.setAttribute("stroke", "#22c55e");
    region.setAttribute("stroke-width", "3");
    region.style.cursor = "default";
    nextTarget();
  } else {
    wrong++;
    errors++;
    region.setAttribute("stroke", "#ef4444");
    region.setAttribute("stroke-width", "3");
    setTimeout(() => {
      if (!region.classList.contains("biome-correct")) {
        region.setAttribute("stroke", "var(--country-stroke)");
        region.setAttribute("stroke-width", "1");
      }
    }, 400);
    updateBanner();

    const maxErrors = game.difficulty === "hard" ? 1 : game.difficulty === "easy" ? 2 : Infinity;
    if (errors >= maxErrors) {
      currentTarget = null;
      setTimeout(() => {
        showGameLostPopup(correct, () => showBrBiomesMode(subMode), () => navigateTo("select"));
      }, 500);
      return;
    }
  }
}

function updateBanner() {
  const progress = document.getElementById("biomes-progress");
  const target = document.getElementById("biomes-target");
  if (progress) progress.textContent = `${correct} / ${totalItems}`;
  if (target && currentTarget) {
    const { items } = getData();
    const item = items.find(i => i.id === currentTarget);
    if (item) target.textContent = item.name;
  }
}

function endGame() {
  currentTarget = null;
  stopStopwatch();

  const subtitle = wrong > 0 ? `${correct}/${totalItems} acertos, ${wrong} erros` : `${correct}/${totalItems} acertos`;
  showEndGamePopup(
    "Fim!",
    subtitle,
    () => {
      const banner = document.getElementById("biomes-banner");
      if (banner) banner.style.display = "flex";
      showBrBiomesMode(subMode);
    },
    () => navigateTo("select")
  );
}
