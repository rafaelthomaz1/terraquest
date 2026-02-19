import { game, worldMap, continentTracking, statesState, clickState, flagsState, capitalsState, langState, refs } from '../state.js';
import { CONTINENTS, CONTINENT_COLORS, CONTINENT_NAMES } from '../data/countries.js';
import { showWorldTypeMode, handleGuess, worldTypeGiveUp } from '../modes/world-type.js';
import { showWorldClickMode } from '../modes/world-click.js';
import { showWorldFlagsMode, handleFlagsGuess, flagsGiveUp } from '../modes/world-flags.js';
import { showWorldCapitalsMode, handleCapitalsGuess, capitalsGiveUp } from '../modes/world-capitals.js';
import { showWorldLanguagesMode, handleLanguagesGuess, langGiveUp } from '../modes/world-languages.js';
import { showStatesMode } from '../modes/states-mode.js';
import { clearChildren, createBreakdownItem } from '../utils/dom.js';

const TOTAL = 195;

export function navigateTo(screen) {
  game.currentScreen = screen;
  document.getElementById("home-screen").style.display = "none";
  document.getElementById("select-screen").style.display = "none";
  document.getElementById("menu-btn").style.display = "none";
  hideAllGameUI();

  if (screen === "home") {
    document.getElementById("home-screen").style.display = "flex";
  } else if (screen === "select") {
    document.getElementById("select-screen").style.display = "flex";
  } else if (screen === "game") {
    document.getElementById("menu-btn").style.display = "block";
    startGameMode(game.currentGameMode);
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
  refs.victoryOverlay.classList.remove("show");
  refs.gameoverOverlay.classList.remove("show");
  refs.gameoverOverlay.style.display = "none";
}

function startGameMode(mode) {
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
  }
}

export function resetGame() {
  game.found.clear();
  game.gameOver = false;
  refs.scoreNum.textContent = "0";
  refs.progressBar.style.width = "0%";
  refs.input.disabled = false;
  refs.input.value = "";
  refs.giveUpBtn.disabled = false;
  refs.victoryOverlay.classList.remove("show");
  refs.gameoverOverlay.classList.remove("show");
  refs.gameoverOverlay.style.display = "none";
  document.getElementById("gameover-content").querySelector("h1").textContent = "Fim de Jogo";
  document.getElementById("gameover-content").querySelector(".go-label").textContent = "de 195 pa\u00edses encontrados";
  refs.hintDisplay.style.opacity = 0;
  document.getElementById("input-container").style.display = "flex";
  document.getElementById("hint-display").style.display = "";
  document.getElementById("review-btn").style.display = "none";
  document.getElementById("review-legend").style.display = "none";
  document.getElementById("flags-banner").classList.remove("active");
  document.getElementById("capitals-banner").classList.remove("active");
  document.getElementById("lang-banner").classList.remove("active");
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
  worldMap.defs.selectAll("pattern[id^='flag-']").remove();
  Object.values(worldMap.pathMap).forEach(el => {
    el.style("fill", null);
    el.style("stroke", null).style("stroke-width", null);
    el.classed("country-found", false);
    el.classed("country-flash", false);
    el.classed("country-acertou", false);
  });
  refs.input.focus();
}

export function handleInputKeydown(e) {
  if (e.key === "Enter") {
    if (game.currentGameMode === "world-flags") handleFlagsGuess();
    else if (game.currentGameMode === "world-capitals") handleCapitalsGuess();
    else if (game.currentGameMode === "world-languages") handleLanguagesGuess();
    else handleGuess();
  }
}

export function handleGiveUp() {
  if (game.currentGameMode === "world-flags") { flagsGiveUp(); return; }
  if (game.currentGameMode === "world-capitals") { capitalsGiveUp(); return; }
  if (game.currentGameMode === "world-languages") { langGiveUp(); return; }
  worldTypeGiveUp();
}

export function handleReviewBtn(e) {
  const { currentGameMode } = game;

  if (currentGameMode === "world-click") {
    e.stopImmediatePropagation();
    document.getElementById("go-score").textContent = clickState.correct;
    const bd = document.getElementById("gameover-breakdown");
    clearChildren(bd);
    Object.keys(continentTracking.totals).forEach(c => {
      let count = 0;
      clickState.found.forEach(id => { if (CONTINENTS[id] === c) count++; });
      bd.appendChild(createBreakdownItem(CONTINENT_COLORS[c], CONTINENT_NAMES[c], `${count}/${continentTracking.totals[c]}`));
    });
    document.getElementById("gameover-content").querySelector("h1").textContent = "Fim de Jogo";
    document.getElementById("gameover-content").querySelector(".go-label").textContent = `de ${TOTAL} pa\u00edses (${clickState.incorrect} erros)`;
    document.getElementById("review-btn").style.display = "none";
    document.getElementById("review-legend").style.display = "none";
    refs.gameoverOverlay.style.display = "flex";
    requestAnimationFrame(() => { refs.gameoverOverlay.classList.add("show"); });
  } else if (currentGameMode === "world-flags" || currentGameMode === "world-capitals") {
    e.stopImmediatePropagation();
    const st = currentGameMode === "world-flags" ? flagsState : capitalsState;
    document.getElementById("go-score").textContent = st.found.size;
    const bd = document.getElementById("gameover-breakdown");
    clearChildren(bd);
    Object.keys(continentTracking.totals).forEach(c => {
      bd.appendChild(createBreakdownItem(CONTINENT_COLORS[c], CONTINENT_NAMES[c], `${continentTracking.found[c]}/${continentTracking.totals[c]}`));
    });
    document.getElementById("gameover-content").querySelector("h1").textContent = "Fim de Jogo";
    document.getElementById("gameover-content").querySelector(".go-label").textContent = `de ${TOTAL} pa\u00edses (${st.skipped} pulados)`;
    document.getElementById("review-btn").style.display = "none";
    document.getElementById("review-legend").style.display = "none";
    refs.gameoverOverlay.style.display = "flex";
    requestAnimationFrame(() => { refs.gameoverOverlay.classList.add("show"); });
  } else if (currentGameMode === "world-languages") {
    e.stopImmediatePropagation();
    document.getElementById("go-score").textContent = langState.totalFound;
    const bd = document.getElementById("gameover-breakdown");
    clearChildren(bd);
    Object.keys(continentTracking.totals).forEach(c => {
      bd.appendChild(createBreakdownItem(CONTINENT_COLORS[c], CONTINENT_NAMES[c], `${continentTracking.found[c]}/${continentTracking.totals[c]}`));
    });
    document.getElementById("gameover-content").querySelector("h1").textContent = "Fim de Jogo";
    document.getElementById("gameover-content").querySelector(".go-label").textContent = `de ${langState.totalCountries} respostas poss\u00edveis`;
    document.getElementById("review-btn").style.display = "none";
    document.getElementById("review-legend").style.display = "none";
    refs.gameoverOverlay.style.display = "flex";
    requestAnimationFrame(() => { refs.gameoverOverlay.classList.add("show"); });
  } else if (currentGameMode === "world-type") {
    // Default review for world-type
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
