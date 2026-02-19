// Shared mutable game state
// All modules import from here and mutate properties directly

export const game = {
  found: new Set(),
  gameOver: false,
  currentScreen: "home",
  currentGameMode: null,
  hintTimeout: null,
};

export const worldMap = {
  pathMap: {},
  svg: null,
  g: null,
  defs: null,
  projection: null,
  path: null,
  baseScale: 0,
  currentScale: 0,
  dragStart: null,
  dragStartRotate: 0,
  dragStartTY: 0,
  width: 0,
  height: 0,
};

export const continentTracking = {
  totals: {},
  found: {},
  completed: new Set(),
};

export const statesState = {
  currentCountry: null,
  found: new Set(),
  gameOver: false,
  pathMap: {},
  svg: null,
  g: null,
  defs: null,
  projection: null,
  path: null,
  zoom: null,
  hintTimeout: null,
  regionTotals: {},
  regionFound: {},
  regionCompleted: new Set(),
  loaded: false,
  quizMode: "states",
  _reviewHandler: null,
};

export const flagsState = {
  queue: [],
  current: null,
  found: new Set(),
  skipped: 0,
  gameOver: false,
};

export const capitalsState = {
  queue: [],
  current: null,
  found: new Set(),
  skipped: 0,
  gameOver: false,
};

export const langState = {
  languages: [],
  langIndex: 0,
  currentLang: null,
  currentIds: [],
  foundInLang: new Set(),
  totalFound: 0,
  totalCountries: 0,
  gameOver: false,
};

export const clickState = {
  queue: [],
  currentTarget: null,
  correct: 0,
  incorrect: 0,
  skipped: 0,
  found: new Set(),
  gameOver: false,
};

// DOM element references (initialized in app.js)
export const refs = {};

export function initRefs() {
  refs.scoreNum = document.getElementById("score-num");
  refs.scoreTotal = document.getElementById("score-total");
  refs.progressBar = document.getElementById("progress-bar");
  refs.input = document.getElementById("country-input");
  refs.feedback = document.getElementById("feedback");
  refs.tooltip = document.getElementById("tooltip");
  refs.hintDisplay = document.getElementById("hint-display");
  refs.giveUpBtn = document.getElementById("give-up-btn");
  refs.victoryOverlay = document.getElementById("victory-overlay");
  refs.restartBtn = document.getElementById("restart-btn");
  refs.restartBtnGo = document.getElementById("restart-btn-go");
  refs.celebEl = document.getElementById("continent-celebration");
  refs.gameoverOverlay = document.getElementById("gameover-overlay");
  refs.inputContainer = document.getElementById("input-container");
  refs.stateInput = document.getElementById("state-input");
  refs.statesFeedback = document.getElementById("states-feedback");
  refs.statesHintDisplay = document.getElementById("states-hint-display");
}
