import { game, clickState, worldMap, continentTracking, refs } from '../state.js';
import { COUNTRIES, CONTINENTS, CONTINENT_COLORS, CONTINENT_NAMES } from '../data/countries.js';
import { clearChildren, createBreakdownItem, showFeedbackMsg } from '../utils/dom.js';
import { shuffleArray } from '../utils/shuffle.js';
import { revealCountry } from '../map/world-map.js';
import { updateContinentCount } from '../ui/score.js';
import { resetGame } from '../ui/navigation.js';

const TOTAL = 195;

export function showWorldClickMode() {
  resetGame();
  document.getElementById("world-panel").style.display = "block";
  document.getElementById("continent-legend").style.display = "";
  document.getElementById("input-container").style.display = "none";
  document.getElementById("hint-display").style.display = "none";
  document.getElementById("top-bar").style.display = "none";
  document.getElementById("progress-container").style.display = "none";

  clickState.queue = Object.keys(COUNTRIES).slice();
  shuffleArray(clickState.queue);
  clickState.currentTarget = null;
  clickState.correct = 0;
  clickState.incorrect = 0;
  clickState.skipped = 0;
  clickState.found = new Set();
  clickState.gameOver = false;

  document.getElementById("click-prompt").classList.add("active");
  nextClickTarget();
}

export function nextClickTarget() {
  if (clickState.queue.length === 0) {
    clickState.gameOver = true;
    game.gameOver = true;
    document.getElementById("click-prompt").classList.remove("active");
    document.getElementById("gameover-content").querySelector("h1").textContent = "Parab\u00e9ns!";
    document.getElementById("go-score").textContent = clickState.correct;
    document.getElementById("gameover-content").querySelector(".go-label").textContent =
      `de ${TOTAL} pa\u00edses (${clickState.skipped} pulados, ${clickState.incorrect} erros)`;
    const bd = document.getElementById("gameover-breakdown");
    clearChildren(bd);
    Object.keys(continentTracking.totals).forEach(c => {
      let count = 0;
      clickState.found.forEach(id => { if (CONTINENTS[id] === c) count++; });
      bd.appendChild(createBreakdownItem(CONTINENT_COLORS[c], CONTINENT_NAMES[c], `${count}/${continentTracking.totals[c]}`));
    });
    refs.gameoverOverlay.style.display = "flex";
    requestAnimationFrame(() => { refs.gameoverOverlay.classList.add("show"); });
    return;
  }
  clickState.currentTarget = clickState.queue.shift();
  updateClickScoreDisplay();
}

export function updateClickScoreDisplay() {
  document.getElementById("click-target-name").textContent = COUNTRIES[clickState.currentTarget];
  document.getElementById("click-correct").textContent = "\u2713 " + clickState.correct;
  document.getElementById("click-skipped").textContent = "\u27F6 " + clickState.skipped;
  document.getElementById("click-incorrect").textContent = "\u2717 " + clickState.incorrect;
  document.getElementById("click-remaining").textContent = "\u23F3 " + (clickState.queue.length + 1);
}

export function handleClickModeClick(id) {
  if (clickState.gameOver || !clickState.currentTarget) return;
  if (clickState.found.has(id)) return;

  if (id === clickState.currentTarget) {
    clickState.correct++;
    clickState.found.add(id);
    game.found.add(id);
    const continent = CONTINENTS[id];
    const color = CONTINENT_COLORS[continent];
    revealCountry(id, color, true);
    continentTracking.found[continent]++;
    updateContinentCount(continent);
    nextClickTarget();
  } else {
    clickState.incorrect++;
    const el = worldMap.pathMap[id];
    if (el) {
      el.classed("click-wrong-flash", true);
      showFeedbackMsg(refs.feedback, "\u2717 " + COUNTRIES[id], "red");
      setTimeout(() => { el.classed("click-wrong-flash", false); }, 400);
    }
    updateClickScoreDisplay();
  }
}

export function clickGiveUp() {
  if (clickState.gameOver) return;
  clickState.gameOver = true;
  game.gameOver = true;
  document.getElementById("click-prompt").classList.remove("active");

  const remaining = [clickState.currentTarget, ...clickState.queue].filter(id => !clickState.found.has(id) && worldMap.pathMap[id]);
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
    clickState.found.forEach(id => {
      if (worldMap.pathMap[id]) worldMap.pathMap[id].classed("country-acertou", true);
    });
    document.getElementById("review-btn").style.display = "block";
    document.getElementById("review-legend").style.display = "flex";
  }, waveTime);
}
