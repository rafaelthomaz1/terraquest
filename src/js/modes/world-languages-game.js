import { game } from '../state.js';
import { COUNTRIES, COUNTRY_INFO, ISO_ALPHA2 } from '../data/countries.js';
import { LANGUAGES_MAP } from '../data/aliases.js';
import { shuffleArray } from '../utils/shuffle.js';
import { renderOptionBoxes } from '../ui/option-boxes.js';
import { createEl, clearChildren } from '../utils/dom.js';
import { navigateTo } from '../ui/navigation.js';
import { showGameLostPopup, showCountryInfoPopup } from '../ui/mode-popup.js';

let streak = 0;
let bestStreak = 0;
let queue = [];
let current = null;
let missedOnce = false;
let boxesCtrl = null;

const allLanguages = Object.keys(LANGUAGES_MAP);

export function showWorldLanguagesGameMode() {
  const panel = document.getElementById("game-mode-panel");
  panel.classList.add("active");
  document.getElementById("streak-container-game").style.display = "flex";

  queue = Object.keys(COUNTRIES).filter(id => COUNTRY_INFO[id]);
  shuffleArray(queue);
  current = null;
  streak = 0;
  bestStreak = 0;
  missedOnce = false;

  updateStreakDisplay();
  nextLanguage();
}

function nextLanguage() {
  if (queue.length === 0) {
    endLanguagesGame();
    return;
  }
  current = queue.shift();
  missedOnce = false;
  renderCountryDisplay(current);
  renderChoices(current);
}

function renderCountryDisplay(id) {
  const display = document.getElementById("game-mode-display");
  clearChildren(display);

  const alpha2 = ISO_ALPHA2[id];
  if (alpha2) {
    const img = createEl("img", "game-mode-flag");
    img.src = `https://flagcdn.com/w320/${alpha2}.png`;
    img.alt = COUNTRIES[id];
    display.appendChild(img);
  }

  const name = createEl("div", "game-mode-country", COUNTRIES[id]);
  display.appendChild(name);

  const question = createEl("div", "game-mode-question", "Qual o idioma oficial?");
  display.appendChild(question);

  const learnBtn = createEl("button", "learn-country-btn", "Aprender sobre o Pa\u00eds");
  learnBtn.addEventListener("click", () => showCountryInfoPopup(id, ["language"]));
  display.appendChild(learnBtn);
}

function renderChoices(correctId) {
  const container = document.getElementById("game-mode-options");

  const correctLangs = COUNTRY_INFO[correctId][2].split(" / ").map(l => l.trim());
  const mainLang = correctLangs[0];

  const wrongLangs = allLanguages.filter(lang => {
    const ids = LANGUAGES_MAP[lang];
    return !ids.includes(correctId);
  });
  shuffleArray(wrongLangs);
  const picked = wrongLangs.slice(0, 5);

  const options = picked.map(lang => ({ id: lang, label: lang }));
  const correctIdx = Math.floor(Math.random() * 6);
  options.splice(correctIdx, 0, { id: mainLang, label: mainLang });

  boxesCtrl = renderOptionBoxes(container, options, (idx) => {
    const chosenLang = options[idx].label;
    const isCorrect = correctLangs.includes(chosenLang);

    if (isCorrect) {
      boxesCtrl.highlightCorrect(idx);
      boxesCtrl.disable();
      streak++;
      if (streak > bestStreak) bestStreak = streak;
      updateStreakDisplay();
      bumpStreak();
      setTimeout(() => nextLanguage(), 800);
    } else {
      if (game.difficulty !== "hard" && !missedOnce) {
        missedOnce = true;
        boxesCtrl.disableOne(idx);
        boxesCtrl.highlightWrong(idx);
      } else if (game.difficulty === "learning") {
        boxesCtrl.highlightWrong(idx);
        boxesCtrl.highlightCorrect(correctIdx);
        boxesCtrl.disable();
        streak = 0;
        updateStreakDisplay();
        setTimeout(() => nextLanguage(), 1200);
      } else {
        boxesCtrl.highlightWrong(idx);
        boxesCtrl.highlightCorrect(correctIdx);
        boxesCtrl.disable();
        streak = 0;
        updateStreakDisplay();
        setTimeout(() => {
          showGameLostPopup(bestStreak, () => showWorldLanguagesGameMode(), () => navigateTo("select"));
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

function endLanguagesGame() {
  const display = document.getElementById("game-mode-display");
  const container = document.getElementById("game-mode-options");
  clearChildren(display);
  clearChildren(container);

  const msg = createEl("div", "game-mode-country");
  msg.textContent = `Fim! Melhor sequ\u00eancia: ${bestStreak}`;
  display.appendChild(msg);

  const btn = createEl("button", "restart-btn", "Jogar Novamente");
  btn.addEventListener("click", () => showWorldLanguagesGameMode());
  container.appendChild(btn);

  const menuBtn = createEl("button", "mode-switch-btn", "Trocar M\u00f3dulo");
  menuBtn.style.marginTop = "12px";
  menuBtn.addEventListener("click", () => navigateTo("select"));
  container.appendChild(menuBtn);
}
