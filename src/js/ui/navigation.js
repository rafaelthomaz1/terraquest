import { game, worldMap, continentTracking, statesState, clickState, flagsState, capitalsState, langState, walkState, areaState, silhouetteState, populationState, whereIsState, refs, authState } from '../state.js';
import { CONTINENTS, CONTINENT_COLORS, CONTINENT_NAMES } from '../data/countries.js';
import { showWorldTypeMode, handleGuess, worldTypeGiveUp } from '../modes/world-type.js';
import { showWorldClickMode } from '../modes/world-click.js';
import { showWorldFlagsMode, handleFlagsGuess, flagsGiveUp } from '../modes/world-flags.js';
import { showWorldCapitalsMode, handleCapitalsGuess, capitalsGiveUp } from '../modes/world-capitals.js';
import { showWorldLanguagesMode, handleLanguagesGuess, langGiveUp } from '../modes/world-languages.js';
import { showWorldWalkMode, handleWalkGuess, walkGiveUp } from '../modes/world-walk.js';
import { showStatesMode } from '../modes/states-mode.js';
import { getStatesTotal } from '../map/states-map.js';
import { showWorldSilhouettesMode } from '../modes/world-silhouettes.js';
import { showWorldPopulationMode } from '../modes/world-population.js';
import { showWorldWhereMode, cleanupWhere } from '../modes/world-where.js';
import { showWorldFlagsGameMode } from '../modes/world-flags-game.js';
import { showWorldCapitalsGameMode } from '../modes/world-capitals-game.js';
import { showWorldLanguagesGameMode } from '../modes/world-languages-game.js';
import { showWorldAreaGameMode } from '../modes/world-area-game.js';
import { showFlagClickGameMode } from '../modes/flag-click-game.js';
import { showCapitalLocateMode } from '../modes/capital-locate.js';
import { showLandmarksGameMode } from '../modes/landmarks-game.js';
import { showBrBiomesMode } from '../modes/br-biomes-mode.js';
import { showTopMapGame } from '../modes/top-map-game.js';
import { clearChildren, createBreakdownItem } from '../utils/dom.js';
import { hideBridgeLines } from '../map/world-map.js';
import { startStopwatch, resetStopwatch, getElapsedSeconds } from '../ui/stopwatch.js';
import { showAchievementsScreen, hideAchievementsScreen, MODE_NAMES, getLevelProgress, getLevelTitle } from '../ui/achievements.js';
import { showEndMatchPopup } from '../ui/mode-popup.js';

const TOTAL = 195;

let typingInterval = null;

function startSubtitleTyping() {
  const el = document.getElementById("home-subtitle");
  if (!el) return;
  if (typingInterval) { clearInterval(typingInterval); typingInterval = null; }
  const name = authState.currentUser?.name?.split(' ')[0];
  const text = name ? `Olá, ${name}! Explore e aprenda geografia!` : "Explore e aprenda geografia do mundo inteiro!";
  el.textContent = "";
  el.classList.add("typing");
  let i = 0;
  typingInterval = setInterval(() => {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
    } else {
      clearInterval(typingInterval);
      typingInterval = null;
      el.classList.remove("typing");
    }
  }, 50);
}

function autoSaveCurrentGame() {
  if (game.currentScreen !== "game" || game._recordSaved || !game.currentGameMode) return;
  const mode = game.currentGameMode;
  let score = 0;
  let total = 0;

  switch (mode) {
    case "world-type":
      score = game.found.size;
      total = TOTAL;
      break;
    case "world-click":
      score = clickState.correct;
      total = TOTAL;
      break;
    case "world-flags":
      score = flagsState.found.size;
      total = TOTAL;
      break;
    case "world-capitals":
      score = capitalsState.found.size;
      total = TOTAL;
      break;
    case "world-languages":
      score = langState.totalFound;
      total = langState.totalCountries;
      break;
    case "world-walk":
      score = walkState.steps;
      total = walkState.shortestPath.length > 2 ? walkState.shortestPath.length - 2 : 0;
      break;
    case "br-states":
    case "br-capitals":
    case "us-states":
    case "us-capitals":
      score = statesState.found.size;
      total = getStatesTotal();
      break;
    case "world-silhouettes":
      score = silhouetteState.bestStreak;
      total = silhouetteState.bestStreak;
      break;
    case "world-population":
      score = populationState.bestStreak;
      total = populationState.bestStreak;
      break;
    case "world-area-game":
      score = areaState.bestStreak;
      total = areaState.bestStreak;
      break;
    case "world-where":
      score = whereIsState.totalPoints;
      total = whereIsState.totalRounds * 1000;
      break;
    case "world-flags-game":
    case "world-capitals-game":
    case "world-languages-game":
    case "landmarks-game": {
      const bs = game._bestStreak || 0;
      score = bs;
      total = bs;
      break;
    }
    default:
      return;
  }

  if (score > 0) {
    trySaveRecord(mode, score, total);
    game._recordSaved = true;
  }
}

export function navigateTo(screen) {
  autoSaveCurrentGame();
  game.currentScreen = screen;
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("register-screen").style.display = "none";
  document.getElementById("home-screen").style.display = "none";
  document.getElementById("select-screen").style.display = "none";
  document.getElementById("menu-btn").style.display = "none";
  document.getElementById("end-match-btn").style.display = "none";
  hideAchievementsScreen();
  hideAllGameUI();

  const diffToggle = document.getElementById("difficulty-toggle");
  const themeToggle = document.getElementById("theme-toggle");
  const logoutBtn = document.getElementById("logout-btn");
  const achToggle = document.getElementById("achievements-toggle");
  const achBtn = document.getElementById("achievements-btn");
  const isAuth = authState.currentUser && !authState.isGuest;

  if (typingInterval) { clearInterval(typingInterval); typingInterval = null; }

  if (screen === "login") {
    document.getElementById("login-screen").style.display = "flex";
    diffToggle.style.display = "none";
    themeToggle.style.display = "none";
    logoutBtn.style.display = "none";
    achToggle.style.display = "none";
    if (achBtn) achBtn.style.display = "none";
    resetStopwatch();
  } else if (screen === "register") {
    document.getElementById("register-screen").style.display = "flex";
    diffToggle.style.display = "none";
    themeToggle.style.display = "none";
    logoutBtn.style.display = "none";
    achToggle.style.display = "none";
    if (achBtn) achBtn.style.display = "none";
    resetStopwatch();
  } else if (screen === "home") {
    document.getElementById("home-screen").style.display = "flex";
    diffToggle.style.display = "none";
    themeToggle.style.display = "";
    logoutBtn.style.display = "";
    achToggle.style.display = "none";
    if (achBtn) achBtn.style.display = isAuth ? "flex" : "none";
    resetStopwatch();
    startSubtitleTyping();
  } else if (screen === "select") {
    document.getElementById("select-screen").style.display = "flex";
    diffToggle.style.display = "flex";
    themeToggle.style.display = "";
    logoutBtn.style.display = "";
    achToggle.style.display = isAuth ? "" : "none";
    if (achBtn) achBtn.style.display = "none";
    resetStopwatch();
  } else if (screen === "game") {
    document.getElementById("end-match-btn").style.display = "block";
    diffToggle.style.display = "flex";
    themeToggle.style.display = "";
    logoutBtn.style.display = "none";
    achToggle.style.display = "none";
    if (achBtn) achBtn.style.display = "none";
    startStopwatch();
    startGameMode(game.currentGameMode);
  } else if (screen === "achievements") {
    diffToggle.style.display = "none";
    themeToggle.style.display = "";
    logoutBtn.style.display = "none";
    achToggle.style.display = "none";
    if (achBtn) achBtn.style.display = "none";
    resetStopwatch();
    showAchievementsScreen();
  }
}

function hideAllGameUI() {
  document.getElementById("world-panel").style.display = "none";
  document.getElementById("top-bar").style.display = "none";
  document.getElementById("progress-container").style.display = "none";
  document.getElementById("continent-legend").style.display = "none";
  document.getElementById("input-container").style.display = "none";
  document.getElementById("hint-display").style.display = "none";
  document.getElementById("review-btn").style.display = "none";
  document.getElementById("review-legend").style.display = "none";
  document.getElementById("click-prompt").classList.remove("active");
  document.getElementById("flags-banner").classList.remove("active");
  document.getElementById("capitals-banner").classList.remove("active");
  document.getElementById("lang-banner").classList.remove("active");
  document.getElementById("walk-banner").classList.remove("active");
  document.getElementById("flags-skip-btn").style.display = "none";
  document.getElementById("capitals-skip-btn").style.display = "none";
  document.getElementById("lang-skip-btn").style.display = "none";
  document.getElementById("states-panel").classList.remove("active");
  document.getElementById("states-score-display").classList.remove("active");
  document.getElementById("states-progress-container").classList.remove("active");
  document.getElementById("states-input-container").classList.remove("active");
  document.getElementById("states-hint-display").classList.remove("active");
  document.getElementById("states-feedback").classList.remove("active");
  document.getElementById("states-region-legend").classList.remove("active");
  document.getElementById("silhouette-panel").classList.remove("active");
  document.getElementById("population-panel").classList.remove("active");
  document.getElementById("game-mode-panel").classList.remove("active");
  document.getElementById("streak-container-silhouettes").style.display = "none";
  document.getElementById("streak-container-population").style.display = "none";
  document.getElementById("streak-container-game").style.display = "none";
  document.getElementById("where-banner").classList.remove("active");
  document.getElementById("where-round-result").classList.remove("active");
  document.getElementById("flag-click-panel").classList.remove("active");
  document.getElementById("capital-locate-panel").classList.remove("active");
  document.getElementById("biomes-panel").classList.remove("active");
  const flagClickHeader = document.getElementById("flag-click-header");
  if (flagClickHeader) flagClickHeader.style.display = "";
  const capLocBanner = document.getElementById("capital-locate-banner");
  if (capLocBanner) capLocBanner.style.display = "flex";
  const biomesBanner = document.getElementById("biomes-banner");
  if (biomesBanner) biomesBanner.style.display = "flex";
  cleanupWhere();
  refs.victoryOverlay.classList.remove("show");
  refs.gameoverOverlay.classList.remove("show");
  refs.gameoverOverlay.style.display = "none";
}

function startGameMode(mode) {
  game._recordSaved = false;
  // Extract rounds param if stored
  const rounds = game._pendingRounds || null;
  game._pendingRounds = null;

  switch (mode) {
    case "world-type": showWorldTypeMode(); break;
    case "world-click": showWorldClickMode(); break;
    case "world-flags": showWorldFlagsMode(); break;
    case "world-capitals": showWorldCapitalsMode(); break;
    case "world-languages": showWorldLanguagesMode(); break;
    case "br-states": showStatesMode("BR", "states"); break;
    case "br-capitals": showStatesMode("BR", "capitals"); break;
    case "us-states": showStatesMode("US", "states"); break;
    case "us-capitals": showStatesMode("US", "capitals"); break;
    case "world-walk": showWorldWalkMode(); break;
    case "world-silhouettes": showWorldSilhouettesMode(); break;
    case "world-population": showWorldPopulationMode(rounds); break;
    case "world-where": showWorldWhereMode(); break;
    case "world-flags-game": showWorldFlagsGameMode(); break;
    case "world-capitals-game": showWorldCapitalsGameMode(); break;
    case "world-languages-game": showWorldLanguagesGameMode(); break;
    case "world-area-game": showWorldAreaGameMode(rounds); break;
    case "flag-click-game": showFlagClickGameMode(rounds); break;
    case "world-capital-locate": showCapitalLocateMode("world", game._pendingContinent, rounds); break;
    case "br-capital-locate": showCapitalLocateMode("br", null, rounds); break;
    case "us-capital-locate": showCapitalLocateMode("us", null, rounds); break;
    case "landmarks-game": showLandmarksGameMode(); break;
    case "br-biomes": showBrBiomesMode("biomes"); break;
    case "br-vegetation": showBrBiomesMode("vegetation"); break;
    case "br-climate": showBrBiomesMode("climate"); break;
    case "top-population-map": showTopMapGame("population", rounds); break;
    case "top-area-map": showTopMapGame("area", rounds); break;
  }
}

export function resetGame() {
  game.found.clear();
  game.gameOver = false;
  game._recordSaved = false;
  refs.scoreNum.textContent = "0";
  refs.progressBar.style.width = "0%";
  refs.input.disabled = false;
  refs.input.value = "";
  refs.giveUpBtn.disabled = false;
  refs.victoryOverlay.classList.remove("show");
  refs.gameoverOverlay.classList.remove("show");
  refs.gameoverOverlay.style.display = "none";
  document.getElementById("gameover-content").querySelector("h1").textContent = "Sess\u00e3o Conclu\u00edda";
  document.getElementById("gameover-content").querySelector(".go-label").textContent = "de 195 pa\u00edses estudados";
  refs.hintDisplay.style.opacity = 0;
  document.getElementById("input-container").style.display = "flex";
  document.getElementById("hint-display").style.display = "";
  document.getElementById("review-btn").style.display = "none";
  document.getElementById("review-legend").style.display = "none";
  document.getElementById("flags-banner").classList.remove("active");
  document.getElementById("capitals-banner").classList.remove("active");
  document.getElementById("lang-banner").classList.remove("active");
  document.getElementById("walk-banner").classList.remove("active");
  document.getElementById("flags-skip-btn").style.display = "none";
  document.getElementById("capitals-skip-btn").style.display = "none";
  document.getElementById("lang-skip-btn").style.display = "none";
  refs.input.placeholder = "Digite o nome de um pa\u00eds...";
  refs.scoreTotal.textContent = "195";
  continentTracking.completed.clear();
  Object.keys(continentTracking.found).forEach(c => {
    continentTracking.found[c] = 0;
    const el = document.getElementById(`count-${c}`);
    if (el) el.textContent = `0/${continentTracking.totals[c]}`;
    const leg = document.getElementById(`leg-${c}`);
    if (leg) leg.classList.remove("complete");
  });
  hideBridgeLines();
  worldMap.defs.selectAll("pattern[id^='flag-']").remove();
  worldMap.defs.selectAll("clipPath[id^='clip-']").remove();
  worldMap.g.selectAll(".flag-overlay").remove();
  Object.values(worldMap.pathMap).forEach(el => {
    el.style("fill", null);
    el.style("stroke", null).style("stroke-width", null);
    el.classed("country-found", false);
    el.classed("country-flash", false);
    el.classed("country-acertou", false);
    el.classed("walk-country-start", false);
    el.classed("walk-country-end", false);
    el.classed("walk-country-path", false);
  });
  refs.input.focus();
}

export function handleInputKeydown(e) {
  if (e.key === "Enter") {
    if (game.currentGameMode === "world-flags") handleFlagsGuess();
    else if (game.currentGameMode === "world-capitals") handleCapitalsGuess();
    else if (game.currentGameMode === "world-languages") handleLanguagesGuess();
    else if (game.currentGameMode === "world-walk") handleWalkGuess();
    else handleGuess();
  }
}

export function handleGiveUp() {
  if (game.currentGameMode === "world-walk") { walkGiveUp(); return; }
  if (game.currentGameMode === "world-flags") { flagsGiveUp(); return; }
  if (game.currentGameMode === "world-capitals") { capitalsGiveUp(); return; }
  if (game.currentGameMode === "world-languages") { langGiveUp(); return; }
  worldTypeGiveUp();
}

function trySaveRecord(mode, score, total) {
  if (typeof window.__saveGameRecord === 'function') {
    window.__saveGameRecord(mode, score, total, getElapsedSeconds());
    game._recordSaved = true;
  }
}

const MODE_ICONS = {
  "world-type": "\u2328\uFE0F", "world-click": "\uD83D\uDDFA\uFE0F", "world-flags": "\uD83C\uDFF3\uFE0F",
  "world-capitals": "\uD83C\uDFDB\uFE0F", "world-languages": "\uD83D\uDDE3\uFE0F", "world-walk": "\uD83D\uDEA9",
  "br-states": "\uD83C\uDDE7\uD83C\uDDF7", "br-capitals": "\uD83C\uDDE7\uD83C\uDDF7", "us-states": "\uD83C\uDDFA\uD83C\uDDF8",
  "us-capitals": "\uD83C\uDDFA\uD83C\uDDF8", "world-silhouettes": "\uD83D\uDDFA\uFE0F", "world-population": "\uD83D\uDC65",
  "world-area-game": "\uD83D\uDCCF", "world-where": "\uD83C\uDFAF", "world-flags-game": "\uD83C\uDFAE",
  "world-capitals-game": "\uD83C\uDFAE", "world-languages-game": "\uD83C\uDFAE", "landmarks-game": "\uD83C\uDFDB\uFE0F",
  "flag-click-game": "\uD83D\uDC46", "world-capital-locate": "\uD83D\uDCCD", "br-capital-locate": "\uD83D\uDCCD",
  "us-capital-locate": "\uD83D\uDCCD", "br-biomes": "\uD83C\uDF3F", "br-vegetation": "\uD83C\uDF33",
  "br-climate": "\u2600\uFE0F", "top-population-map": "\uD83D\uDC65", "top-area-map": "\uD83D\uDCCF"
};

// Expose achievement functions globally for popup XP level display
window.__achFns = { getLevelProgress, getLevelTitle };

export function endCurrentMatch() {
  if (game.currentScreen !== "game" || !game.currentGameMode) return;

  const mode = game.currentGameMode;
  let score = 0;
  let total = 0;

  switch (mode) {
    case "world-type":
      score = game.found.size; total = TOTAL; break;
    case "world-click":
      score = clickState.correct; total = TOTAL; break;
    case "world-flags":
      score = flagsState.found.size; total = TOTAL; break;
    case "world-capitals":
      score = capitalsState.found.size; total = TOTAL; break;
    case "world-languages":
      score = langState.totalFound; total = langState.totalCountries; break;
    case "world-walk":
      score = walkState.steps;
      total = walkState.shortestPath.length > 2 ? walkState.shortestPath.length - 2 : 0;
      break;
    case "br-states": case "br-capitals": case "us-states": case "us-capitals":
      score = statesState.found.size; total = getStatesTotal(); break;
    case "world-silhouettes":
      score = silhouetteState.bestStreak; total = silhouetteState.bestStreak; break;
    case "world-population":
      score = populationState.bestStreak; total = populationState.bestStreak; break;
    case "world-area-game":
      score = areaState.bestStreak; total = areaState.bestStreak; break;
    case "world-where":
      score = whereIsState.totalPoints; total = whereIsState.totalRounds * 1000; break;
    case "world-flags-game": case "world-capitals-game": case "world-languages-game": case "landmarks-game": {
      const bs = game._bestStreak || 0;
      score = bs; total = bs; break;
    }
    default: return;
  }

  // Stop stopwatch
  const timeSeconds = getElapsedSeconds();
  resetStopwatch();

  // Save record
  let xpPromise = null;
  if (typeof window.__saveGameRecord === 'function' && !game._recordSaved) {
    xpPromise = window.__saveGameRecord(mode, score, total, timeSeconds);
    game._recordSaved = true;
  }

  showEndMatchPopup({
    modeName: MODE_NAMES[mode] || mode,
    modeIcon: MODE_ICONS[mode] || "\uD83C\uDFAE",
    score,
    total,
    timeSeconds,
    xpPromise,
    onRestart: () => { navigateTo("game"); },
    onMenu: () => { navigateTo("select"); }
  });
}

export function handleReviewBtn(e) {
  const { currentGameMode } = game;

  if (currentGameMode === "world-click") {
    e.stopImmediatePropagation();
    trySaveRecord("world-click", clickState.correct, TOTAL);
    document.getElementById("go-score").textContent = clickState.correct;
    const bd = document.getElementById("gameover-breakdown");
    clearChildren(bd);
    Object.keys(continentTracking.totals).forEach(c => {
      let count = 0;
      clickState.found.forEach(id => { if (CONTINENTS[id] === c) count++; });
      bd.appendChild(createBreakdownItem(CONTINENT_COLORS[c], CONTINENT_NAMES[c], `${count}/${continentTracking.totals[c]}`));
    });
    document.getElementById("gameover-content").querySelector("h1").textContent = "Sess\u00e3o Conclu\u00edda";
    document.getElementById("gameover-content").querySelector(".go-label").textContent = `de ${TOTAL} pa\u00edses (${clickState.incorrect} a revisar)`;
    document.getElementById("review-btn").style.display = "none";
    document.getElementById("review-legend").style.display = "none";
    refs.gameoverOverlay.style.display = "flex";
    requestAnimationFrame(() => { refs.gameoverOverlay.classList.add("show"); });
  } else if (currentGameMode === "world-flags" || currentGameMode === "world-capitals") {
    e.stopImmediatePropagation();
    const st = currentGameMode === "world-flags" ? flagsState : capitalsState;
    trySaveRecord(currentGameMode, st.found.size, TOTAL);
    document.getElementById("go-score").textContent = st.found.size;
    const bd = document.getElementById("gameover-breakdown");
    clearChildren(bd);
    Object.keys(continentTracking.totals).forEach(c => {
      bd.appendChild(createBreakdownItem(CONTINENT_COLORS[c], CONTINENT_NAMES[c], `${continentTracking.found[c]}/${continentTracking.totals[c]}`));
    });
    document.getElementById("gameover-content").querySelector("h1").textContent = "Sess\u00e3o Conclu\u00edda";
    document.getElementById("gameover-content").querySelector(".go-label").textContent = `de ${TOTAL} pa\u00edses (${st.skipped} revelados)`;
    document.getElementById("review-btn").style.display = "none";
    document.getElementById("review-legend").style.display = "none";
    refs.gameoverOverlay.style.display = "flex";
    requestAnimationFrame(() => { refs.gameoverOverlay.classList.add("show"); });
  } else if (currentGameMode === "world-languages") {
    e.stopImmediatePropagation();
    trySaveRecord("world-languages", langState.totalFound, langState.totalCountries);
    document.getElementById("go-score").textContent = langState.totalFound;
    const bd = document.getElementById("gameover-breakdown");
    clearChildren(bd);
    Object.keys(continentTracking.totals).forEach(c => {
      bd.appendChild(createBreakdownItem(CONTINENT_COLORS[c], CONTINENT_NAMES[c], `${continentTracking.found[c]}/${continentTracking.totals[c]}`));
    });
    document.getElementById("gameover-content").querySelector("h1").textContent = "Sess\u00e3o Conclu\u00edda";
    document.getElementById("gameover-content").querySelector(".go-label").textContent = `de ${langState.totalCountries} respostas poss\u00edveis`;
    document.getElementById("review-btn").style.display = "none";
    document.getElementById("review-legend").style.display = "none";
    refs.gameoverOverlay.style.display = "flex";
    requestAnimationFrame(() => { refs.gameoverOverlay.classList.add("show"); });
  } else if (currentGameMode === "world-type") {
    trySaveRecord("world-type", game.found.size, TOTAL);
    document.getElementById("go-score").textContent = game.found.size;
    const bd = document.getElementById("gameover-breakdown");
    clearChildren(bd);
    Object.keys(continentTracking.totals).forEach(c => {
      bd.appendChild(createBreakdownItem(CONTINENT_COLORS[c], CONTINENT_NAMES[c], `${continentTracking.found[c]}/${continentTracking.totals[c]}`));
    });
    document.getElementById("review-btn").style.display = "none";
    document.getElementById("review-legend").style.display = "none";
    refs.gameoverOverlay.style.display = "flex";
    requestAnimationFrame(() => { refs.gameoverOverlay.classList.add("show"); });
  } else if (statesState._reviewHandler) {
    e.stopImmediatePropagation();
    statesState._reviewHandler();
  }
}
