import { game, continentTracking, refs } from '../state.js';
import { CONTINENT_COLORS, CONTINENT_NAMES, CONTINENT_ICONS } from '../data/countries.js';
import { showCelebrationEffect } from './celebration.js';

const TOTAL = 195;

export function initContinentTracking() {
  // Already populated in app.js, but init legend display
  Object.keys(continentTracking.totals).forEach(c => {
    const el = document.getElementById(`count-${c}`);
    if (el) el.textContent = `0/${continentTracking.totals[c]}`;
  });
}

export function updateScore() {
  refs.scoreNum.textContent = game.found.size;
  refs.progressBar.style.width = `${(game.found.size / TOTAL) * 100}%`;
}

export function updateContinentCount(cont) {
  const el = document.getElementById(`count-${cont}`);
  if (el) el.textContent = `${continentTracking.found[cont]}/${continentTracking.totals[cont]}`;
  if (continentTracking.found[cont] >= continentTracking.totals[cont] && !continentTracking.completed.has(cont)) {
    continentTracking.completed.add(cont);
    document.getElementById(`leg-${cont}`).classList.add("complete");
    showContinentCelebration(cont);
  }
}

function showContinentCelebration(cont) {
  showCelebrationEffect(
    `${CONTINENT_NAMES[cont]} completa!`,
    CONTINENT_COLORS[cont],
    CONTINENT_ICONS[cont],
    `${continentTracking.totals[cont]} pa\u00edses encontrados`
  );
}
