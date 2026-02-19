import { game, langState, worldMap, continentTracking, refs } from '../state.js';
import { COUNTRIES, CONTINENTS, CONTINENT_COLORS } from '../data/countries.js';
import { ALIASES, LANGUAGES_MAP } from '../data/aliases.js';
import { normalize } from '../utils/normalize.js';
import { showFeedbackMsg } from '../utils/dom.js';
import { shuffleArray } from '../utils/shuffle.js';
import { revealCountry } from '../map/world-map.js';
import { updateContinentCount } from '../ui/score.js';
import { resetGame } from '../ui/navigation.js';

export function showWorldLanguagesMode() {
  resetGame();
  document.getElementById("world-panel").style.display = "block";
  document.getElementById("top-bar").style.display = "";
  document.getElementById("progress-container").style.display = "";
  document.getElementById("continent-legend").style.display = "";
  document.getElementById("input-container").style.display = "flex";
  document.getElementById("hint-display").style.display = "none";
  document.getElementById("lang-banner").classList.add("active");
  document.getElementById("lang-skip-btn").style.display = "inline-block";
  refs.input.placeholder = "Digite um pa\u00eds...";

  langState.languages = Object.keys(LANGUAGES_MAP).slice();
  shuffleArray(langState.languages);
  langState.langIndex = 0;
  langState.currentLang = null;
  langState.currentIds = [];
  langState.foundInLang = new Set();
  langState.totalFound = 0;
  langState.totalCountries = Object.values(LANGUAGES_MAP).reduce((sum, arr) => sum + arr.length, 0);
  langState.gameOver = false;

  document.getElementById("score-total").textContent = langState.totalCountries;
  nextLanguage();
  refs.input.focus();
}

export function nextLanguage() {
  if (langState.langIndex >= langState.languages.length) {
    langState.gameOver = true;
    game.gameOver = true;
    document.getElementById("lang-banner").classList.remove("active");
    document.getElementById("lang-skip-btn").style.display = "none";
    game.found.forEach(id => {
      if (worldMap.pathMap[id]) worldMap.pathMap[id].classed("country-acertou", true);
    });
    document.getElementById("input-container").style.display = "none";
    document.getElementById("review-btn").style.display = "block";
    document.getElementById("review-legend").style.display = "flex";
    return;
  }

  langState.currentLang = langState.languages[langState.langIndex];
  langState.currentIds = LANGUAGES_MAP[langState.currentLang].slice();
  langState.foundInLang = new Set();

  document.getElementById("lang-name").textContent = langState.currentLang;
  updateLangBanner();
  refs.input.value = "";
  refs.input.focus();
}

function updateLangBanner() {
  const remaining = langState.currentIds.length - langState.foundInLang.size;
  document.getElementById("lang-progress").textContent =
    `L\u00edngua ${langState.langIndex + 1} / ${langState.languages.length} \u2014 Faltam ${remaining} pa\u00edses`;
}

function updateLangScore() {
  document.getElementById("score-num").textContent = langState.totalFound;
  refs.progressBar.style.width = `${(langState.totalFound / langState.totalCountries) * 100}%`;
}

export function handleLanguagesGuess() {
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

  if (langState.foundInLang.has(id)) {
    showFeedbackMsg(refs.feedback, `${COUNTRIES[id]} j\u00e1 foi encontrado nesta l\u00edngua!`, "yellow");
    refs.input.value = "";
    return;
  }

  if (langState.currentIds.includes(id)) {
    langState.foundInLang.add(id);
    langState.totalFound++;

    if (!game.found.has(id)) {
      game.found.add(id);
      const continent = CONTINENTS[id];
      const color = CONTINENT_COLORS[continent];
      revealCountry(id, color, true);
      continentTracking.found[continent]++;
      updateContinentCount(continent);
    }

    updateLangScore();
    updateLangBanner();
    showFeedbackMsg(refs.feedback, `${COUNTRIES[id]} \u2713`, "green");
    refs.input.value = "";

    if (langState.foundInLang.size >= langState.currentIds.length) {
      langState.langIndex++;
      setTimeout(() => nextLanguage(), 600);
    }
  } else {
    showFeedbackMsg(refs.feedback, `${COUNTRIES[id]} n\u00e3o fala ${langState.currentLang}!`, "red");
    refs.inputContainer.classList.add("shake");
    setTimeout(() => refs.inputContainer.classList.remove("shake"), 500);
    refs.input.value = "";
  }
}

export function langSkipCurrent() {
  if (langState.gameOver || !langState.currentLang) return;
  const remaining = langState.currentIds.filter(id => !langState.foundInLang.has(id));
  remaining.forEach(id => {
    langState.totalFound++;
    if (!game.found.has(id)) {
      game.found.add(id);
      const continent = CONTINENTS[id];
      const color = CONTINENT_COLORS[continent];
      revealCountry(id, color, false);
      continentTracking.found[continent]++;
      updateContinentCount(continent);
    }
  });
  updateLangScore();
  showFeedbackMsg(refs.feedback, `\u27F6 Pulou ${langState.currentLang} (${remaining.length} pa\u00edses)`, "#d29922");
  langState.langIndex++;
  nextLanguage();
}

export function langGiveUp() {
  if (langState.gameOver) return;
  langState.gameOver = true;
  game.gameOver = true;
  refs.input.disabled = true;
  refs.giveUpBtn.disabled = true;
  document.getElementById("lang-banner").classList.remove("active");
  document.getElementById("lang-skip-btn").style.display = "none";

  const allRemaining = new Set();
  if (langState.currentIds) {
    langState.currentIds.filter(id => !langState.foundInLang.has(id)).forEach(id => allRemaining.add(id));
  }
  for (let i = langState.langIndex + 1; i < langState.languages.length; i++) {
    LANGUAGES_MAP[langState.languages[i]].forEach(id => allRemaining.add(id));
  }

  const toReveal = [...allRemaining].filter(id => !game.found.has(id) && worldMap.pathMap[id]);
  toReveal.sort((a, b) => {
    const ba = worldMap.pathMap[a].node().getBBox();
    const bb = worldMap.pathMap[b].node().getBBox();
    return (ba.x + ba.width / 2) - (bb.x + bb.width / 2);
  });

  toReveal.forEach((id, i) => {
    setTimeout(() => {
      const cont = CONTINENTS[id];
      revealCountry(id, CONTINENT_COLORS[cont], false);
    }, i * 18);
  });

  const waveTime = toReveal.length * 18 + 600;
  setTimeout(() => {
    game.found.forEach(id => {
      if (worldMap.pathMap[id]) worldMap.pathMap[id].classed("country-acertou", true);
    });
    document.getElementById("input-container").style.display = "none";
    document.getElementById("review-btn").style.display = "block";
    document.getElementById("review-legend").style.display = "flex";
  }, waveTime);
}
