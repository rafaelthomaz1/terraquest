import { game, worldMap, walkState, refs } from '../state.js';
import { COUNTRIES, CONTINENTS, CONTINENT_COLORS, ISO_ALPHA2 } from '../data/countries.js';
import { ALIASES } from '../data/aliases.js';
import { buildAdjacencyGraph } from '../data/borders.js';
import { normalize } from '../utils/normalize.js';
import { showFeedbackMsg } from '../utils/dom.js';
import { revealCountry, showBridgeLines } from '../map/world-map.js';
import { resetGame } from '../ui/navigation.js';

function bfs(adjacency, start, end) {
  if (start === end) return [start];
  const visited = new Set([start]);
  const queue = [[start]];
  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];
    const neighbors = adjacency[node] || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      const newPath = [...path, neighbor];
      if (neighbor === end) return newPath;
      visited.add(neighbor);
      queue.push(newPath);
    }
  }
  return null;
}

function pickCountryPair(adjacency) {
  const ids = Object.keys(COUNTRIES).filter(id => id !== "10" && worldMap.pathMap[id]);
  for (let attempt = 0; attempt < 200; attempt++) {
    const a = ids[Math.floor(Math.random() * ids.length)];
    const b = ids[Math.floor(Math.random() * ids.length)];
    if (a === b) continue;
    const path = bfs(adjacency, a, b);
    if (path && path.length >= 5 && path.length <= 13) {
      return { start: a, end: b, shortestPath: path };
    }
  }
  for (let attempt = 0; attempt < 100; attempt++) {
    const a = ids[Math.floor(Math.random() * ids.length)];
    const b = ids[Math.floor(Math.random() * ids.length)];
    if (a === b) continue;
    const path = bfs(adjacency, a, b);
    if (path && path.length >= 3 && path.length <= 20) {
      return { start: a, end: b, shortestPath: path };
    }
  }
  return null;
}

function updateFrontier() {
  walkState.frontierIds.clear();
  for (const id of walkState.pathIds) {
    const neighbors = walkState.adjacency[id] || [];
    for (const n of neighbors) {
      if (!walkState.pathIds.has(n)) {
        walkState.frontierIds.add(n);
      }
    }
  }
}

function checkWinCondition() {
  const { startId, endId, pathIds, adjacency } = walkState;
  const visited = new Set([startId]);
  const queue = [startId];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === endId) return true;
    const neighbors = adjacency[node] || [];
    for (const n of neighbors) {
      if (pathIds.has(n) && !visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
  }
  return false;
}

function updateWalkBanner() {
  document.getElementById("walk-steps").textContent = `${walkState.steps} passo${walkState.steps !== 1 ? "s" : ""}`;
}

function highlightEndpoints() {
  const startEl = worldMap.pathMap[walkState.startId];
  const endEl = worldMap.pathMap[walkState.endId];
  if (startEl) {
    startEl.classed("walk-country-start", true);
  }
  if (endEl) {
    endEl.classed("walk-country-end", true);
  }
}

export function showWorldWalkMode() {
  resetGame();

  walkState.startId = null;
  walkState.endId = null;
  walkState.pathIds = new Set();
  walkState.frontierIds = new Set();
  walkState.steps = 0;
  walkState.gameOver = false;
  walkState.connected = false;
  walkState.shortestPath = [];
  walkState.adjacency = buildAdjacencyGraph();

  const pair = pickCountryPair(walkState.adjacency);
  if (!pair) {
    showFeedbackMsg(refs.feedback, "Erro ao gerar par de países.", "red");
    return;
  }

  walkState.startId = pair.start;
  walkState.endId = pair.end;
  walkState.shortestPath = pair.shortestPath;
  walkState.pathIds.add(pair.start);
  walkState.pathIds.add(pair.end);

  document.getElementById("world-panel").style.display = "block";
  document.getElementById("top-bar").style.display = "none";
  document.getElementById("progress-container").style.display = "none";
  document.getElementById("continent-legend").style.display = "none";
  document.getElementById("input-container").style.display = "flex";

  refs.input.placeholder = "Digite um país vizinho...";
  refs.scoreTotal.textContent = `${pair.shortestPath.length - 2}`;
  refs.scoreNum.textContent = "0";

  const startAlpha = ISO_ALPHA2[pair.start];
  const endAlpha = ISO_ALPHA2[pair.end];
  const startFlag = document.getElementById("walk-start-flag");
  const endFlag = document.getElementById("walk-end-flag");
  if (startAlpha) startFlag.src = `/flags/${startAlpha}.png`;
  if (endAlpha) endFlag.src = `/flags/${endAlpha}.png`;
  document.getElementById("walk-start-name").textContent = COUNTRIES[pair.start];
  document.getElementById("walk-end-name").textContent = COUNTRIES[pair.end];

  document.getElementById("walk-banner").classList.add("active");
  updateWalkBanner();

  highlightEndpoints();
  showBridgeLines();

  const startContinent = CONTINENTS[pair.start];
  const endContinent = CONTINENTS[pair.end];
  revealCountry(pair.start, CONTINENT_COLORS[startContinent], false);
  revealCountry(pair.end, CONTINENT_COLORS[endContinent], false);
  game.found.add(pair.start);
  game.found.add(pair.end);

  updateFrontier();
  refs.input.focus();
}

export function handleWalkGuess() {
  if (walkState.gameOver) return;
  const val = refs.input.value.trim();
  if (!val) return;
  const norm = normalize(val);
  const id = ALIASES[norm];

  if (!id || !COUNTRIES[id]) {
    showFeedbackMsg(refs.feedback, "País não encontrado!", "red");
    refs.inputContainer.classList.add("shake");
    setTimeout(() => refs.inputContainer.classList.remove("shake"), 500);
    refs.input.value = "";
    return;
  }

  if (id === walkState.startId || id === walkState.endId) {
    showFeedbackMsg(refs.feedback, `${COUNTRIES[id]} já é um dos destinos!`, "yellow");
    refs.input.value = "";
    return;
  }

  if (walkState.pathIds.has(id)) {
    showFeedbackMsg(refs.feedback, `${COUNTRIES[id]} já está no caminho!`, "yellow");
    refs.input.value = "";
    return;
  }

  if (!walkState.frontierIds.has(id)) {
    showFeedbackMsg(refs.feedback, `${COUNTRIES[id]} não faz fronteira com o caminho!`, "red");
    refs.inputContainer.classList.add("shake");
    setTimeout(() => refs.inputContainer.classList.remove("shake"), 500);
    refs.input.value = "";
    return;
  }

  walkState.pathIds.add(id);
  walkState.steps++;

  const continent = CONTINENTS[id];
  const color = CONTINENT_COLORS[continent];
  revealCountry(id, color, true);

  game.found.add(id);
  refs.scoreNum.textContent = walkState.steps;

  showFeedbackMsg(refs.feedback, `${COUNTRIES[id]} ✓`, "green");
  refs.input.value = "";

  updateFrontier();

  if (checkWinCondition()) {
    walkState.connected = true;
    walkState.gameOver = true;
    refs.input.disabled = true;
    refs.giveUpBtn.disabled = true;

    const minSteps = walkState.shortestPath.length - 2;
    const diff = walkState.steps - minSteps;

    setTimeout(() => {
      document.getElementById("walk-banner").classList.remove("active");
      document.getElementById("input-container").style.display = "none";

      const goContent = document.getElementById("gameover-content");
      goContent.querySelector("h1").textContent = "Rota Concluída!";
      document.getElementById("go-score").textContent = walkState.steps;
      const label = diff === 0
        ? `passos (rota perfeita!)`
        : `passos (mínimo possível: ${minSteps})`;
      goContent.querySelector(".go-label").textContent = label;

      const bd = document.getElementById("gameover-breakdown");
      while (bd.firstChild) bd.removeChild(bd.firstChild);

      refs.gameoverOverlay.style.display = "flex";
      requestAnimationFrame(() => refs.gameoverOverlay.classList.add("show"));
    }, 800);
  }
}

export function walkGiveUp() {
  if (walkState.gameOver) return;
  walkState.gameOver = true;
  refs.input.disabled = true;
  refs.giveUpBtn.disabled = true;

  const path = walkState.shortestPath;
  path.forEach((id, i) => {
    if (id === walkState.startId || id === walkState.endId) return;
    setTimeout(() => {
      const cont = CONTINENTS[id];
      revealCountry(id, CONTINENT_COLORS[cont], true);
      const el = worldMap.pathMap[id];
      if (el) el.classed("walk-country-path", true);
    }, i * 300);
  });

  const totalTime = path.length * 300 + 600;
  setTimeout(() => {
    document.getElementById("walk-banner").classList.remove("active");
    document.getElementById("input-container").style.display = "none";

    const goContent = document.getElementById("gameover-content");
    goContent.querySelector("h1").textContent = "Rota Revelada";
    document.getElementById("go-score").textContent = walkState.shortestPath.length - 2;
    goContent.querySelector(".go-label").textContent = `passos na rota mais curta (você completou ${walkState.steps})`;

    const bd = document.getElementById("gameover-breakdown");
    while (bd.firstChild) bd.removeChild(bd.firstChild);

    refs.gameoverOverlay.style.display = "flex";
    requestAnimationFrame(() => refs.gameoverOverlay.classList.add("show"));
  }, totalTime);
}
