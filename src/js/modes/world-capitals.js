import { game, capitalsState, worldMap, continentTracking, refs } from '../state.js';
import { COUNTRIES, CONTINENTS, CONTINENT_COLORS, COUNTRY_INFO, ISO_ALPHA2 } from '../data/countries.js';
import { WORLD_CAPITAL_ALIASES } from '../data/aliases.js';
import { normalize } from '../utils/normalize.js';
import { showFeedbackMsg } from '../utils/dom.js';
import { shuffleArray } from '../utils/shuffle.js';
import { revealCountry } from '../map/world-map.js';
import { updateScore, updateContinentCount } from '../ui/score.js';
import { resetGame } from '../ui/navigation.js';

const TOTAL = 195;

export function showWorldCapitalsMode() {
  resetGame();
  document.getElementById("world-panel").style.display = "block";
  document.getElementById("top-bar").style.display = "";
  document.getElementById("progress-container").style.display = "";
  document.getElementById("continent-legend").style.display = "";
  document.getElementById("input-container").style.display = "flex";
  document.getElementById("hint-display").style.display = "none";
  document.getElementById("capitals-banner").classList.add("active");
  document.getElementById("capitals-skip-btn").style.display = "inline-block";
  refs.input.placeholder = "Digite a capital...";

  capitalsState.queue = Object.keys(COUNTRIES).slice();
  shuffleArray(capitalsState.queue);
  capitalsState.current = null;
  capitalsState.found = new Set();
  capitalsState.skipped = 0;
  capitalsState.gameOver = false;

  nextCapitalsTarget();
  refs.input.focus();
}

export function nextCapitalsTarget() {
  if (capitalsState.queue.length === 0) {
    capitalsState.gameOver = true;
    game.gameOver = true;
    document.getElementById("capitals-banner").classList.remove("active");
    document.getElementById("capitals-skip-btn").style.display = "none";
    if (game.found.size >= TOTAL) {
      setTimeout(() => refs.victoryOverlay.classList.add("show"), 600);
    }
    return;
  }
  capitalsState.current = capitalsState.queue.shift();
  const alpha2 = ISO_ALPHA2[capitalsState.current];
  document.getElementById("capitals-country").textContent = COUNTRIES[capitalsState.current];
  document.getElementById("capitals-flag").src = `/flags/${alpha2}.png`;
  const done = capitalsState.found.size + capitalsState.skipped;
  document.getElementById("capitals-progress").textContent = `${done + 1} / ${TOTAL}`;
}

export function handleCapitalsGuess() {
  const val = refs.input.value.trim();
  if (!val) return;
  const norm = normalize(val);
  const id = WORLD_CAPITAL_ALIASES[norm];

  if (!id) {
    showFeedbackMsg(refs.feedback, "Capital n\u00e3o encontrada!", "red");
    refs.inputContainer.classList.add("shake");
    setTimeout(() => refs.inputContainer.classList.remove("shake"), 500);
    refs.input.value = "";
    return;
  }

  if (id === capitalsState.current) {
    capitalsState.found.add(id);
    game.found.add(id);
    const continent = CONTINENTS[id];
    const color = CONTINENT_COLORS[continent];
    revealCountry(id, color, true);
    updateScore();
    continentTracking.found[continent]++;
    updateContinentCount(continent);
    showFeedbackMsg(refs.feedback, `${COUNTRY_INFO[id][0]} \u2192 ${COUNTRIES[id]} \u2713`, "green");
    refs.input.value = "";
    nextCapitalsTarget();
  } else {
    showFeedbackMsg(refs.feedback, `${COUNTRY_INFO[id][0]} \u00e9 capital de ${COUNTRIES[id]}!`, "red");
    refs.inputContainer.classList.add("shake");
    setTimeout(() => refs.inputContainer.classList.remove("shake"), 500);
    refs.input.value = "";
  }
}

export function capitalsGiveUp() {
  if (capitalsState.gameOver) return;
  capitalsState.gameOver = true;
  game.gameOver = true;
  refs.input.disabled = true;
  refs.giveUpBtn.disabled = true;
  document.getElementById("capitals-banner").classList.remove("active");
  document.getElementById("capitals-skip-btn").style.display = "none";

  const remaining = [capitalsState.current, ...capitalsState.queue].filter(id => !game.found.has(id) && worldMap.pathMap[id]);
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
    capitalsState.found.forEach(id => {
      if (worldMap.pathMap[id]) worldMap.pathMap[id].classed("country-acertou", true);
    });
    document.getElementById("input-container").style.display = "none";
    document.getElementById("review-btn").style.display = "block";
    document.getElementById("review-legend").style.display = "flex";
  }, waveTime);
}

export function capitalsSkip() {
  if (capitalsState.gameOver || !capitalsState.current) return;
  const id = capitalsState.current;
  capitalsState.skipped++;
  game.found.add(id);
  const continent = CONTINENTS[id];
  const color = CONTINENT_COLORS[continent];
  revealCountry(id, color, false);
  updateScore();
  continentTracking.found[continent]++;
  updateContinentCount(continent);
  showFeedbackMsg(refs.feedback, `\u27F6 ${COUNTRIES[id]} (${COUNTRY_INFO[id][0]})`, "#d29922");
  refs.input.value = "";
  nextCapitalsTarget();
}
