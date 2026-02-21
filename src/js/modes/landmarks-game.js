import { game } from '../state.js';
import { LANDMARKS } from '../data/landmarks.js';
import { shuffleArray } from '../utils/shuffle.js';
import { createEl, clearChildren } from '../utils/dom.js';
import { navigateTo } from '../ui/navigation.js';
import { showGameLostPopup, showEndGamePopup, showLandmarkInfoPopup } from '../ui/mode-popup.js';

let queue = [];
let current = null;
let streak = 0;
let bestStreak = 0;
let missedOnce = false;

export function showLandmarksGameMode() {
  const panel = document.getElementById("game-mode-panel");
  panel.classList.add("active");
  document.getElementById("streak-container-game").style.display = "flex";

  queue = LANDMARKS.slice();
  shuffleArray(queue);
  current = null;
  streak = 0;
  bestStreak = 0;
  missedOnce = false;

  updateStreakDisplay();
  nextLandmark();
}

function nextLandmark() {
  if (queue.length === 0) {
    endGame();
    return;
  }
  current = queue.shift();
  missedOnce = false;
  renderLandmark(current);
  renderChoices(current);
}

function renderLandmark(landmark) {
  const display = document.getElementById("game-mode-display");
  clearChildren(display);

  const img = createEl("img", "game-mode-flag");
  img.src = landmark.image;
  img.alt = landmark.name;
  img.style.height = "200px";
  img.style.maxWidth = "400px";
  img.style.objectFit = "cover";
  img.style.borderRadius = "8px";
  img.onerror = () => { img.style.display = "none"; };
  display.appendChild(img);

  display.appendChild(createEl("div", "game-mode-country", landmark.name));
}

function renderChoices(landmark) {
  const container = document.getElementById("game-mode-options");
  clearChildren(container);
  container.classList.add("option-boxes-container");

  const correctLabel = `${landmark.city} - ${landmark.country}`;
  const others = LANDMARKS.filter(l => l !== landmark);
  shuffleArray(others);
  const picked = others.slice(0, 5).map(l => `${l.city} - ${l.country}`);

  const correctIdx = Math.floor(Math.random() * 6);
  picked.splice(correctIdx, 0, correctLabel);

  let disabled = false;

  const boxes = picked.map((label, i) => {
    const box = createEl("button", "option-box", label);
    box.addEventListener("click", () => {
      if (disabled) return;
      handleChoice(i, correctIdx, boxes);
    });
    container.appendChild(box);
    return box;
  });
}

function showLearnMore(landmark, onDone) {
  const container = document.getElementById("game-mode-options");
  const btn = createEl("button", "learn-country-btn", "Saber Mais");
  btn.style.display = "block";
  btn.style.margin = "12px auto 0";
  btn.addEventListener("click", () => {
    btn.remove();
    showLandmarkInfoPopup(landmark, onDone);
  });
  container.appendChild(btn);

  setTimeout(() => {
    if (btn.parentNode) {
      btn.remove();
      onDone();
    }
  }, 3000);
}

function handleChoice(idx, correctIdx, boxes) {
  if (idx === correctIdx) {
    boxes[correctIdx].classList.add("option-box--correct");
    disableAll(boxes);
    streak++;
    if (streak > bestStreak) bestStreak = streak;
    game._bestStreak = bestStreak;
    updateStreakDisplay();
    bumpStreak();
    if (current.desc) {
      setTimeout(() => showLearnMore(current, () => nextLandmark()), 500);
    } else {
      setTimeout(() => nextLandmark(), 800);
    }
  } else {
    if (game.difficulty !== "hard" && !missedOnce) {
      missedOnce = true;
      boxes[idx].classList.add("option-box--wrong");
      boxes[idx].classList.add("option-box--disabled");
      boxes[idx].disabled = true;
    } else if (game.difficulty === "learning") {
      boxes[idx].classList.add("option-box--wrong");
      boxes[correctIdx].classList.add("option-box--correct");
      disableAll(boxes);
      streak = 0;
      updateStreakDisplay();
      if (current.desc) {
        setTimeout(() => showLearnMore(current, () => nextLandmark()), 800);
      } else {
        setTimeout(() => nextLandmark(), 1200);
      }
    } else {
      boxes[idx].classList.add("option-box--wrong");
      boxes[correctIdx].classList.add("option-box--correct");
      disableAll(boxes);
      streak = 0;
      updateStreakDisplay();
      setTimeout(() => {
        showGameLostPopup(bestStreak, () => showLandmarksGameMode(), () => navigateTo("select"));
      }, 1200);
    }
  }
}

function disableAll(boxes) {
  boxes.forEach(b => {
    b.classList.add("option-box--disabled");
    b.disabled = true;
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

function endGame() {
  showEndGamePopup(
    `Melhor sequ\u00eancia: ${bestStreak}`,
    "Pontos tur\u00edsticos conclu\u00eddo!",
    () => showLandmarksGameMode(),
    () => navigateTo("select")
  );
}
