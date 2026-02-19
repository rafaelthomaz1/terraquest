import '../css/styles.css';

import { game, continentTracking, clickState, refs, initRefs } from './state.js';
import { COUNTRIES, CONTINENTS, CONTINENT_COLORS } from './data/countries.js';
import { initWorldMap, revealCountry } from './map/world-map.js';
import { initContinentTracking, updateContinentCount } from './ui/score.js';
import { initTheme } from './ui/theme.js';
import { navigateTo, handleInputKeydown, handleGiveUp, handleReviewBtn } from './ui/navigation.js';
import { handleStatesGuess, statesGiveUp } from './modes/states-mode.js';
import { flagsSkip } from './modes/world-flags.js';
import { capitalsSkip } from './modes/world-capitals.js';
import { langSkipCurrent } from './modes/world-languages.js';
import { clickGiveUp, nextClickTarget } from './modes/world-click.js';
import { showFeedbackMsg } from './utils/dom.js';

// Initialize DOM references
initRefs();

// Build continent tracking
Object.values(CONTINENTS).forEach(c => {
  continentTracking.totals[c] = (continentTracking.totals[c] || 0) + 1;
});
Object.keys(continentTracking.totals).forEach(c => {
  continentTracking.found[c] = 0;
});

// Init continent legend
initContinentTracking();

// Init world map
initWorldMap();

// Init theme
initTheme();

// Event listeners
refs.input.addEventListener("keydown", handleInputKeydown);
refs.giveUpBtn.addEventListener("click", handleGiveUp);
refs.restartBtn.addEventListener("click", () => { if (game.currentGameMode) navigateTo("game"); });
refs.restartBtnGo.addEventListener("click", () => { if (game.currentGameMode) navigateTo("game"); });

// Navigation
document.getElementById("play-btn").addEventListener("click", () => navigateTo("select"));
document.getElementById("back-btn").addEventListener("click", () => navigateTo("home"));
document.getElementById("menu-btn").addEventListener("click", () => navigateTo("select"));
document.getElementById("mode-switch-btn-v").addEventListener("click", () => navigateTo("select"));
document.getElementById("mode-switch-btn-go").addEventListener("click", () => navigateTo("select"));

// Mode card selection
document.querySelectorAll(".mode-card").forEach(card => {
  card.addEventListener("click", () => {
    game.currentGameMode = card.dataset.mode;
    navigateTo("game");
  });
});

// States input
refs.stateInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleStatesGuess();
});
document.getElementById("states-give-up-btn").addEventListener("click", statesGiveUp);

// Skip buttons
document.getElementById("flags-skip-btn").addEventListener("click", flagsSkip);
document.getElementById("capitals-skip-btn").addEventListener("click", capitalsSkip);
document.getElementById("lang-skip-btn").addEventListener("click", langSkipCurrent);

// Click mode buttons
document.getElementById("click-skip-btn").addEventListener("click", () => {
  if (clickState.gameOver || !clickState.currentTarget) return;
  const id = clickState.currentTarget;
  clickState.skipped++;
  clickState.found.add(id);
  game.found.add(id);
  const continent = CONTINENTS[id];
  const color = CONTINENT_COLORS[continent];
  revealCountry(id, color, true);
  continentTracking.found[continent]++;
  updateContinentCount(continent);
  showFeedbackMsg(refs.feedback, "\u27F6 " + COUNTRIES[id], "#d29922");
  nextClickTarget();
});

document.getElementById("click-give-up-btn").addEventListener("click", clickGiveUp);

// Review button (captures for all modes)
document.getElementById("review-btn").addEventListener("click", handleReviewBtn, true);

// Start at home screen
navigateTo("home");

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
