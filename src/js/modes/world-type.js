import { game, worldMap, continentTracking, refs } from '../state.js';
import { COUNTRIES, CONTINENTS, CONTINENT_COLORS } from '../data/countries.js';
import { ALIASES } from '../data/aliases.js';
import { normalize } from '../utils/normalize.js';
import { showFeedbackMsg } from '../utils/dom.js';
import { revealCountry } from '../map/world-map.js';
import { updateScore, updateContinentCount } from '../ui/score.js';
import { resetGame } from '../ui/navigation.js';

const TOTAL = 195;

export function showWorldTypeMode() {
  resetGame();
  document.getElementById("world-panel").style.display = "block";
  document.getElementById("top-bar").style.display = "";
  document.getElementById("progress-container").style.display = "";
  document.getElementById("continent-legend").style.display = "";
  document.getElementById("input-container").style.display = "flex";
  document.getElementById("hint-display").style.display = "";
  refs.input.focus();
}

export function handleGuess() {
  const val = refs.input.value.trim();
  if (!val) return;
  const norm = normalize(val);
  const id = ALIASES[norm];

  if (!id || !COUNTRIES[id]) {
    showFeedbackMsg(refs.feedback, "Pa\u00eds n\u00e3o encontrado!", "red");
    refs.inputContainer.classList.add("shake");
    setTimeout(() => refs.inputContainer.classList.remove("shake"), 500);
    refs.input.value = "";
    return;
  }
  if (game.found.has(id)) {
    showFeedbackMsg(refs.feedback, `${COUNTRIES[id]} j\u00e1 foi encontrado!`, "yellow");
    refs.input.value = "";
    return;
  }

  game.found.add(id);
  const continent = CONTINENTS[id];
  const color = CONTINENT_COLORS[continent];
  revealCountry(id, color, true);
  updateScore();
  continentTracking.found[continent]++;
  updateContinentCount(continent);
  showFeedbackMsg(refs.feedback, `${COUNTRIES[id]} \u2713`, "green");
  refs.input.value = "";

  if (game.found.size >= TOTAL) {
    game.gameOver = true;
    setTimeout(() => refs.victoryOverlay.classList.add("show"), 600);
  }
}

export function worldTypeGiveUp() {
  if (game.gameOver) return;
  game.gameOver = true;
  refs.input.disabled = true;
  refs.giveUpBtn.disabled = true;

  const remaining = Object.keys(COUNTRIES).filter(id => !game.found.has(id) && worldMap.pathMap[id]);
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
    game.found.forEach(id => {
      if (worldMap.pathMap[id]) worldMap.pathMap[id].classed("country-acertou", true);
    });
    document.getElementById("input-container").style.display = "none";
    document.getElementById("hint-display").style.display = "none";
    document.getElementById("review-btn").style.display = "block";
    document.getElementById("review-legend").style.display = "flex";
  }, waveTime);
}
