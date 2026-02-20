import { game } from '../state.js';
import { COUNTRIES, ISO_ALPHA2 } from '../data/countries.js';
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

export function showWorldFlagsGameMode() {
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
  nextFlag();
}

function nextFlag() {
  if (queue.length === 0) {
    endFlagsGame();
    return;
  }
  current = queue.shift();
  missedOnce = false;
  renderFlag(current);
  renderChoices(current);
}

function renderFlag(id) {
  const display = document.getElementById("game-mode-display");
  clearChildren(display);
  const alpha2 = ISO_ALPHA2[id];
  const img = createEl("img", "game-mode-flag");
  img.src = `/flags/${alpha2}.png`;
  img.alt = "Bandeira";
  display.appendChild(img);

  const learnBtn = createEl("button", "learn-country-btn", "Aprender sobre o Pa\u00eds");
  learnBtn.addEventListener("click", () => showCountryInfoPopup(id));
  display.appendChild(learnBtn);
}

function renderChoices(correctId) {
  const container = document.getElementById("game-mode-options");
  const { options, correctIndex } = generateOptions(
    correctId,
    COUNTRIES,
    id => COUNTRIES[id],
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
      setTimeout(() => nextFlag(), 800);
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
        setTimeout(() => nextFlag(), 1200);
      } else {
        boxesCtrl.highlightWrong(idx);
        boxesCtrl.highlightCorrect(correctIndex);
        boxesCtrl.disable();
        streak = 0;
        updateStreakDisplay();
        setTimeout(() => {
          showGameLostPopup(bestStreak, () => showWorldFlagsGameMode(), () => navigateTo("select"));
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

function endFlagsGame() {
  const display = document.getElementById("game-mode-display");
  const container = document.getElementById("game-mode-options");
  clearChildren(display);
  clearChildren(container);

  const msg = createEl("div", "game-mode-country");
  msg.textContent = `Fim! Melhor sequência: ${bestStreak}`;
  display.appendChild(msg);

  const btn = createEl("button", "restart-btn", "Jogar Novamente");
  btn.addEventListener("click", () => showWorldFlagsGameMode());
  container.appendChild(btn);

  const menuBtn = createEl("button", "mode-switch-btn", "Trocar Módulo");
  menuBtn.style.marginTop = "12px";
  menuBtn.addEventListener("click", () => navigateTo("select"));
  container.appendChild(menuBtn);
}
