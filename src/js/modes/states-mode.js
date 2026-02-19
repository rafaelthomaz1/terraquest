import { statesState, refs } from '../state.js';
import { normalize } from '../utils/normalize.js';
import { clearChildren, createBreakdownItem } from '../utils/dom.js';
import {
  getStatesData, getStatesAliases, getRegionColors, getStatesTotal, getCapitalAliases,
  statesShowFeedback, statesUpdateScore, statesUpdateRegionCount, buildRegionLegend,
  revealState, loadStatesMap
} from '../map/states-map.js';

export function showStatesMode(country, quizMode) {
  statesState.quizMode = quizMode;
  document.getElementById("states-panel").classList.add("active");
  document.getElementById("states-score-display").classList.add("active");
  document.getElementById("states-progress-container").classList.add("active");
  document.getElementById("states-input-container").classList.add("active");
  document.getElementById("states-hint-display").classList.add("active");
  document.getElementById("states-feedback").classList.add("active");
  document.getElementById("states-region-legend").classList.add("active");
  refs.stateInput.placeholder = quizMode === "capitals" ? "Digite a capital de um estado..." : "Digite o nome de um estado...";
  loadStatesMap(country);
}

export function handleStatesGuess() {
  const val = refs.stateInput.value.trim();
  if (!val) return;
  const norm = normalize(val);
  const isCapitals = statesState.quizMode === "capitals";
  const aliases = isCapitals ? getCapitalAliases() : getStatesAliases();
  const states = getStatesData();
  const id = aliases[norm];

  if (!id || !states[id]) {
    statesShowFeedback(isCapitals ? "Capital n\u00e3o encontrada!" : "Estado n\u00e3o encontrado!", "red");
    const ic = document.getElementById("states-input-container");
    ic.classList.add("shake");
    setTimeout(() => ic.classList.remove("shake"), 500);
    refs.stateInput.value = "";
    return;
  }
  if (statesState.found.has(id)) {
    const s = states[id];
    statesShowFeedback(isCapitals ? `${s.capital} j\u00e1 foi encontrada!` : `${s.name} j\u00e1 foi encontrado!`, "yellow");
    refs.stateInput.value = "";
    return;
  }

  statesState.found.add(id);
  const state = states[id];
  const colors = getRegionColors();
  const color = colors[state.region];
  revealState(id, color, true);
  statesUpdateScore();
  statesState.regionFound[state.region]++;
  statesUpdateRegionCount(state.region);
  statesShowFeedback(isCapitals ? `${state.capital} \u2192 ${state.name} \u2713` : `${state.name} \u2713`, "green");
  refs.stateInput.value = "";

  if (statesState.found.size >= getStatesTotal()) {
    statesState.gameOver = true;
    setTimeout(() => {
      document.getElementById("go-score").textContent = statesState.found.size;
      const bd = document.getElementById("gameover-breakdown");
      clearChildren(bd);
      const rc = getRegionColors();
      Object.keys(statesState.regionTotals).forEach(r => {
        bd.appendChild(createBreakdownItem(rc[r], r, `${statesState.regionFound[r]}/${statesState.regionTotals[r]}`));
      });
      document.getElementById("gameover-content").querySelector("h1").textContent = "Parab\u00e9ns!";
      document.getElementById("gameover-content").querySelector(".go-label").textContent = `de ${getStatesTotal()} estados encontrados`;
      refs.gameoverOverlay.style.display = "flex";
      requestAnimationFrame(() => { refs.gameoverOverlay.classList.add("show"); });
    }, 600);
  }
}

export function statesGiveUp() {
  if (statesState.gameOver) return;
  statesState.gameOver = true;
  refs.stateInput.disabled = true;
  document.getElementById("states-give-up-btn").disabled = true;

  const states = getStatesData();
  const colors = getRegionColors();
  const remaining = Object.keys(states).filter(id => !statesState.found.has(id) && statesState.pathMap[id]);
  remaining.sort((a, b) => {
    const ba = statesState.pathMap[a].node().getBBox();
    const bb = statesState.pathMap[b].node().getBBox();
    return (ba.x + ba.width / 2) - (bb.x + bb.width / 2);
  });

  remaining.forEach((id, i) => {
    setTimeout(() => {
      revealState(id, colors[states[id].region], false);
    }, i * 30);
  });

  const waveTime = remaining.length * 30 + 600;
  setTimeout(() => {
    statesState.found.forEach(id => {
      if (statesState.pathMap[id]) statesState.pathMap[id].classed("state-acertou", true);
    });
    document.getElementById("states-input-container").classList.remove("active");
    document.getElementById("states-hint-display").style.display = "none";
    document.getElementById("review-btn").style.display = "block";
    document.getElementById("review-legend").style.display = "flex";

    statesState._reviewHandler = () => {
      document.getElementById("go-score").textContent = statesState.found.size;
      const bd = document.getElementById("gameover-breakdown");
      clearChildren(bd);
      const rc = getRegionColors();
      Object.keys(statesState.regionTotals).forEach(r => {
        bd.appendChild(createBreakdownItem(rc[r], r, `${statesState.regionFound[r]}/${statesState.regionTotals[r]}`));
      });
      document.getElementById("gameover-content").querySelector("h1").textContent = "Fim de Jogo";
      document.getElementById("gameover-content").querySelector(".go-label").textContent = `de ${getStatesTotal()} estados encontrados`;
      document.getElementById("review-btn").style.display = "none";
      document.getElementById("review-legend").style.display = "none";
      refs.gameoverOverlay.style.display = "flex";
      requestAnimationFrame(() => { refs.gameoverOverlay.classList.add("show"); });
    };
  }, waveTime);
}

export function resetStatesGame() {
  if (!statesState.currentCountry) return;
  statesState.found.clear();
  statesState.gameOver = false;
  statesState._reviewHandler = null;
  refs.stateInput.disabled = false;
  refs.stateInput.value = "";
  refs.stateInput.placeholder = statesState.quizMode === "capitals" ? "Digite a capital de um estado..." : "Digite o nome de um estado...";
  document.getElementById("states-give-up-btn").disabled = false;
  document.getElementById("states-input-container").classList.add("active");
  refs.statesHintDisplay.style.display = "";
  refs.statesHintDisplay.style.opacity = 0;
  document.getElementById("review-btn").style.display = "none";
  document.getElementById("review-legend").style.display = "none";
  refs.gameoverOverlay.classList.remove("show");
  refs.gameoverOverlay.style.display = "none";

  statesUpdateScore();
  buildRegionLegend();

  if (statesState.defs) statesState.defs.selectAll("pattern[id^='sflag-']").remove();
  Object.values(statesState.pathMap).forEach(el => {
    el.style("fill", null).style("stroke", null).style("stroke-width", null);
    el.classed("state-found", false).classed("state-flash", false).classed("state-acertou", false);
  });
  refs.stateInput.focus();
}
