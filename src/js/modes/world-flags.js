import { game, flagsState, worldMap, continentTracking, refs } from '../state.js';
import { COUNTRIES, CONTINENTS, CONTINENT_COLORS, ISO_ALPHA2 } from '../data/countries.js';
import { ALIASES } from '../data/aliases.js';
import { normalize } from '../utils/normalize.js';
import { showFeedbackMsg } from '../utils/dom.js';
import { shuffleArray } from '../utils/shuffle.js';
import { revealCountry } from '../map/world-map.js';
import { updateScore, updateContinentCount } from '../ui/score.js';
import { resetGame, navigateTo } from '../ui/navigation.js';
import { showGameLostPopup } from '../ui/mode-popup.js';

const TOTAL = 195;
let wrongCount = 0;

export function showWorldFlagsMode() {
  resetGame();
  document.getElementById("world-panel").style.display = "block";
  document.getElementById("top-bar").style.display = "";
  document.getElementById("progress-container").style.display = "";
  document.getElementById("continent-legend").style.display = "";
  document.getElementById("input-container").style.display = "flex";
  document.getElementById("hint-display").style.display = "none";
  document.getElementById("flags-banner").classList.add("active");
  document.getElementById("flags-skip-btn").style.display = "inline-block";
  refs.input.placeholder = "Que pa\u00eds \u00e9 esse?";

  flagsState.queue = Object.keys(COUNTRIES).slice();
  shuffleArray(flagsState.queue);
  flagsState.current = null;
  flagsState.found = new Set();
  flagsState.skipped = 0;
  flagsState.gameOver = false;
  wrongCount = 0;

  nextFlagsTarget();
  refs.input.focus();
}

export function nextFlagsTarget() {
  if (flagsState.queue.length === 0) {
    flagsState.gameOver = true;
    game.gameOver = true;
    document.getElementById("flags-banner").classList.remove("active");
    document.getElementById("flags-skip-btn").style.display = "none";
    if (game.found.size >= TOTAL) {
      setTimeout(() => refs.victoryOverlay.classList.add("show"), 600);
    }
    return;
  }
  flagsState.current = flagsState.queue.shift();
  const alpha2 = ISO_ALPHA2[flagsState.current];
  document.getElementById("flags-img").src = `https://flagcdn.com/w320/${alpha2}.png`;
  const done = flagsState.found.size + flagsState.skipped;
  document.getElementById("flags-progress").textContent = `${done + 1} / ${TOTAL}`;
}

export function handleFlagsGuess() {
  const val = refs.input.value.trim();
  if (!val) return;
  const norm = normalize(val);
  const id = ALIASES[norm];

  if (!id || !COUNTRIES[id]) {
    showFeedbackMsg(refs.feedback, "Pa\u00eds n\u00e3o existe!", "red");
    refs.inputContainer.classList.add("shake");
    setTimeout(() => refs.inputContainer.classList.remove("shake"), 500);
    refs.input.value = "";
    return;
  }

  if (id === flagsState.current) {
    flagsState.found.add(id);
    game.found.add(id);
    const continent = CONTINENTS[id];
    const color = CONTINENT_COLORS[continent];
    revealCountry(id, color, true);
    updateScore();
    continentTracking.found[continent]++;
    updateContinentCount(continent);
    showFeedbackMsg(refs.feedback, `${COUNTRIES[id]} \u2713`, "green");
    refs.input.value = "";
    wrongCount = 0;
    nextFlagsTarget();
  } else if (game.found.has(id) || flagsState.found.has(id)) {
    showFeedbackMsg(refs.feedback, `${COUNTRIES[id]} j\u00e1 foi encontrado!`, "yellow");
    refs.input.value = "";
  } else {
    wrongCount++;
    const maxWrong = game.difficulty === "hard" ? 1 : 2;
    showFeedbackMsg(refs.feedback, `N\u00e3o \u00e9 ${COUNTRIES[id]}!`, "red");
    refs.inputContainer.classList.add("shake");
    setTimeout(() => refs.inputContainer.classList.remove("shake"), 500);
    refs.input.value = "";
    if (wrongCount >= maxWrong) {
      flagsState.gameOver = true;
      game.gameOver = true;
      refs.input.disabled = true;
      document.getElementById("flags-banner").classList.remove("active");
      document.getElementById("flags-skip-btn").style.display = "none";
      setTimeout(() => {
        showGameLostPopup(flagsState.found.size, () => showWorldFlagsMode(), () => navigateTo("select"));
      }, 600);
    }
  }
}

export function flagsGiveUp() {
  if (flagsState.gameOver) return;
  flagsState.gameOver = true;
  game.gameOver = true;
  refs.input.disabled = true;
  refs.giveUpBtn.disabled = true;
  document.getElementById("flags-banner").classList.remove("active");
  document.getElementById("flags-skip-btn").style.display = "none";

  const remaining = [flagsState.current, ...flagsState.queue].filter(id => !game.found.has(id) && worldMap.pathMap[id]);
  remaining.sort((a, b) => {
    const ba = worldMap.pathMap[a].node().getBBox();
    const bb = worldMap.pathMap[b].node().getBBox();
    return (ba.x + ba.width / 2) - (bb.x + bb.width / 2);
  });

  remaining.forEach((id, i) => {
    setTimeout(() => {
      const cont = CONTINENTS[id];
      revealCountry(id, CONTINENT_COLORS[cont], false);
    }, i * 18);
  });

  const waveTime = remaining.length * 18 + 600;
  setTimeout(() => {
    flagsState.found.forEach(id => {
      if (worldMap.pathMap[id]) worldMap.pathMap[id].classed("country-acertou", true);
    });
    document.getElementById("input-container").style.display = "none";
    document.getElementById("review-btn").style.display = "block";
    document.getElementById("review-legend").style.display = "flex";
  }, waveTime);
}

export function flagsSkip() {
  if (flagsState.gameOver || !flagsState.current) return;
  const id = flagsState.current;
  flagsState.skipped++;
  game.found.add(id);
  const continent = CONTINENTS[id];
  const color = CONTINENT_COLORS[continent];
  revealCountry(id, color, false);
  updateScore();
  continentTracking.found[continent]++;
  updateContinentCount(continent);
  showFeedbackMsg(refs.feedback, `\u27F6 ${COUNTRIES[id]}`, "#d29922");
  refs.input.value = "";
  nextFlagsTarget();
}
