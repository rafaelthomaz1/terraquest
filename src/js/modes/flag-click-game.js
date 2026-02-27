import { game } from '../state.js';
import { COUNTRIES, ISO_ALPHA2 } from '../data/countries.js';
import { shuffleArray } from '../utils/shuffle.js';
import { createEl, clearChildren } from '../utils/dom.js';
import { navigateTo } from '../ui/navigation.js';
import { stopStopwatch } from '../ui/stopwatch.js';
import { showEndGamePopup, showGameLostPopup } from '../ui/mode-popup.js';

let queue = [];
let allFlags = [];
let currentTarget = null;
let correct = 0;
let wrong = 0;
let errors = 0;
let totalRounds = 30;

export function showFlagClickGameMode(rounds) {
  totalRounds = rounds || 30;
  const panel = document.getElementById("flag-click-panel");
  panel.classList.add("active");

  const ids = Object.keys(COUNTRIES).filter(id => ISO_ALPHA2[id]);
  shuffleArray(ids);
  allFlags = ids.slice(0, totalRounds);
  queue = allFlags.slice();
  shuffleArray(queue);
  currentTarget = null;
  correct = 0;
  wrong = 0;
  errors = 0;
  game._flagClickCorrect = 0;
  game._flagClickTotal = totalRounds;

  renderGrid();
  nextTarget();
}

function renderGrid() {
  const grid = document.getElementById("flag-click-grid");
  clearChildren(grid);

  allFlags.forEach(id => {
    const alpha2 = ISO_ALPHA2[id];
    const wrap = createEl("div", "flag-click-item");
    wrap.dataset.id = id;

    const img = createEl("img", "flag-click-img");
    img.src = `/flags/${alpha2}.png`;
    img.alt = COUNTRIES[id];
    img.draggable = false;
    wrap.appendChild(img);

    wrap.addEventListener("click", () => handleClick(id));
    grid.appendChild(wrap);
  });
}

function nextTarget() {
  if (queue.length === 0) {
    endGame();
    return;
  }
  currentTarget = queue.shift();
  updateHeader();
}

function handleClick(id) {
  if (!currentTarget) return;
  const grid = document.getElementById("flag-click-grid");
  const item = grid.querySelector(`[data-id="${id}"]`);
  if (!item || item.classList.contains("flag-correct")) return;

  if (id === currentTarget) {
    correct++;
    game._flagClickCorrect = correct;
    item.classList.add("flag-correct");
    item.style.pointerEvents = "none";
    nextTarget();
  } else {
    wrong++;
    errors++;
    item.classList.add("flag-wrong-flash");
    setTimeout(() => item.classList.remove("flag-wrong-flash"), 400);
    updateHeader();

    const maxErrors = game.difficulty === "hard" ? 1 : game.difficulty === "easy" ? 2 : Infinity;
    if (errors >= maxErrors) {
      currentTarget = null;
      setTimeout(() => {
        showGameLostPopup(correct, () => showFlagClickGameMode(totalRounds), () => navigateTo("select"));
      }, 500);
      return;
    }
  }
}

function updateHeader() {
  const progress = document.getElementById("flag-click-progress");
  const target = document.getElementById("flag-click-target");
  const done = correct;
  const pct = totalRounds > 0 ? Math.round((done / totalRounds) * 100) : 0;
  if (progress) progress.textContent = `${done} / ${totalRounds}  ${pct}%`;
  if (target && currentTarget) target.textContent = COUNTRIES[currentTarget];
}

function endGame() {
  currentTarget = null;
  stopStopwatch();

  const subtitle = wrong > 0 ? `${correct}/${totalRounds} acertos, ${wrong} erros` : `${correct}/${totalRounds} acertos`;
  showEndGamePopup(
    "Fim!",
    subtitle,
    () => showFlagClickGameMode(totalRounds),
    () => navigateTo("select")
  );
}

export function skipFlagClick() {
  if (!currentTarget) return;
  const grid = document.getElementById("flag-click-grid");
  const item = grid.querySelector(`[data-id="${currentTarget}"]`);
  if (item) {
    item.classList.add("flag-correct");
    item.style.pointerEvents = "none";
  }
  nextTarget();
}
