import { game, populationState } from '../state.js';
import { COUNTRIES, COUNTRY_INFO, ISO_ALPHA2 } from '../data/countries.js';
import { shuffleArray } from '../utils/shuffle.js';
import { parsePopulation } from '../utils/population.js';
import { createEl, clearChildren } from '../utils/dom.js';
import { navigateTo } from '../ui/navigation.js';
import { showGameLostPopup, showCountryInfoPopup } from '../ui/mode-popup.js';

let topoCache = null;

function loadTopo() {
  if (topoCache) return Promise.resolve(topoCache);
  return d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then(world => {
    topoCache = world;
    return world;
  });
}

export function showWorldPopulationMode() {
  const panel = document.getElementById("population-panel");
  panel.classList.add("active");
  document.getElementById("streak-container-population").style.display = "flex";

  const ids = Object.keys(COUNTRIES).filter(id => COUNTRY_INFO[id]);
  shuffleArray(ids);
  const pairs = [];
  for (let i = 0; i + 1 < ids.length; i += 2) {
    pairs.push([ids[i], ids[i + 1]]);
  }

  populationState.pairs = pairs;
  populationState.currentPairIndex = 0;
  populationState.streak = 0;
  populationState.bestStreak = 0;
  populationState.missedOnce = false;
  populationState.gameOver = false;

  updateStreakDisplay();
  loadTopo().then(() => nextPair()).catch(() => {});
}

function nextPair() {
  if (populationState.currentPairIndex >= populationState.pairs.length) {
    endPopulation();
    return;
  }
  populationState.missedOnce = false;
  const pair = populationState.pairs[populationState.currentPairIndex];
  renderPair(pair[0], pair[1]);
}

function renderPair(idA, idB) {
  const container = document.getElementById("population-cards");
  clearChildren(container);

  const popA = parsePopulation(COUNTRY_INFO[idA][1]);
  const popB = parsePopulation(COUNTRY_INFO[idB][1]);

  const cardA = buildPopCard(idA);
  const vs = createEl("div", "pop-versus", "VS");
  const cardB = buildPopCard(idB);

  container.appendChild(cardA.el);
  container.appendChild(vs);
  container.appendChild(cardB.el);

  let answered = false;

  function handleChoice(chosenId) {
    if (answered && !(game.difficulty !== "hard" && !populationState.missedOnce)) return;
    const correctId = popA >= popB ? idA : idB;
    const wrongId = correctId === idA ? idB : idA;

    if (chosenId === correctId) {
      answered = true;
      (correctId === idA ? cardA : cardB).el.classList.add("pop-card--correct");
      cardA.showPop();
      cardB.showPop();
      disableBoth();
      populationState.streak++;
      if (populationState.streak > populationState.bestStreak) {
        populationState.bestStreak = populationState.streak;
      }
      updateStreakDisplay();
      bumpStreak();
      setTimeout(() => {
        populationState.currentPairIndex++;
        nextPair();
      }, 1200);
    } else {
      if (game.difficulty !== "hard" && !populationState.missedOnce) {
        populationState.missedOnce = true;
        (chosenId === idA ? cardA : cardB).el.classList.add("pop-card--wrong");
        (chosenId === idA ? cardA : cardB).el.classList.add("pop-card--disabled");
      } else if (game.difficulty === "learning") {
        answered = true;
        (chosenId === idA ? cardA : cardB).el.classList.add("pop-card--wrong");
        (correctId === idA ? cardA : cardB).el.classList.add("pop-card--correct");
        cardA.showPop();
        cardB.showPop();
        disableBoth();
        populationState.streak = 0;
        updateStreakDisplay();
        setTimeout(() => {
          populationState.currentPairIndex++;
          nextPair();
        }, 1200);
      } else {
        answered = true;
        (chosenId === idA ? cardA : cardB).el.classList.add("pop-card--wrong");
        (correctId === idA ? cardA : cardB).el.classList.add("pop-card--correct");
        cardA.showPop();
        cardB.showPop();
        disableBoth();
        populationState.streak = 0;
        updateStreakDisplay();
        setTimeout(() => {
          showGameLostPopup(populationState.bestStreak, () => showWorldPopulationMode(), () => navigateTo("select"));
        }, 1200);
      }
    }
  }

  function disableBoth() {
    cardA.el.style.pointerEvents = "none";
    cardB.el.style.pointerEvents = "none";
  }

  cardA.el.addEventListener("click", () => handleChoice(idA));
  cardB.el.addEventListener("click", () => handleChoice(idB));
}

function buildPopCard(id) {
  const el = createEl("div", "pop-card");

  const svgWrap = createEl("div", "pop-card-svg-wrap");
  svgWrap.style.position = "relative";
  svgWrap.style.width = "220px";
  svgWrap.style.height = "160px";
  svgWrap.style.overflow = "hidden";
  svgWrap.style.borderRadius = "8px";

  const alpha2 = ISO_ALPHA2[id];
  const flagImg = createEl("img");
  flagImg.src = `/flags/${alpha2}.png`;
  flagImg.alt = COUNTRIES[id];
  flagImg.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;border-radius:8px;opacity:0.3;";

  const world = topoCache;
  const countries = topojson.feature(world, world.objects.countries);
  const feature = countries.features.find(f => String(Number(f.id)) === id);

  if (feature) {
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgEl.setAttribute("viewBox", "0 0 220 160");
    svgEl.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    const clipId = `pop-clip-${id}-${Date.now()}`;
    clipPath.setAttribute("id", clipId);

    const projection = d3.geoMercator().fitExtent([[8, 8], [212, 152]], feature);
    const path = d3.geoPath().projection(projection);

    const clipPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    clipPathEl.setAttribute("d", path(feature));
    clipPath.appendChild(clipPathEl);
    defs.appendChild(clipPath);
    svgEl.appendChild(defs);

    const imgEl = document.createElementNS("http://www.w3.org/2000/svg", "image");
    imgEl.setAttribute("href", `/flags/${alpha2}.png`);
    imgEl.setAttribute("x", "0");
    imgEl.setAttribute("y", "0");
    imgEl.setAttribute("width", "220");
    imgEl.setAttribute("height", "160");
    imgEl.setAttribute("preserveAspectRatio", "xMidYMid slice");
    imgEl.setAttribute("clip-path", `url(#${clipId})`);
    svgEl.appendChild(imgEl);

    const outline = document.createElementNS("http://www.w3.org/2000/svg", "path");
    outline.setAttribute("d", path(feature));
    outline.setAttribute("fill", "none");
    outline.setAttribute("stroke", "var(--border)");
    outline.setAttribute("stroke-width", "1.5");
    svgEl.appendChild(outline);

    svgWrap.appendChild(svgEl);
  } else {
    svgWrap.appendChild(flagImg);
  }

  el.appendChild(svgWrap);
  el.appendChild(createEl("div", "pop-card-name", COUNTRIES[id]));

  const learnBtn = createEl("button", "learn-country-btn", "Aprender");
  learnBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showCountryInfoPopup(id, ["population"]);
  });
  el.appendChild(learnBtn);

  const popEl = createEl("div", "pop-card-pop", COUNTRY_INFO[id][1]);
  el.appendChild(popEl);

  return {
    el,
    showPop() { popEl.classList.add("show"); }
  };
}

function updateStreakDisplay() {
  const el = document.getElementById("streak-value-population");
  const bestEl = document.getElementById("streak-best-population");
  if (el) el.textContent = populationState.streak;
  if (bestEl) bestEl.textContent = "Melhor: " + populationState.bestStreak;
}

function bumpStreak() {
  const el = document.getElementById("streak-value-population");
  if (!el) return;
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

function endPopulation() {
  populationState.gameOver = true;
  const container = document.getElementById("population-cards");
  clearChildren(container);

  const msg = createEl("div", "game-mode-country");
  msg.textContent = `Fim! Melhor sequência: ${populationState.bestStreak}`;
  container.appendChild(msg);

  const btn = createEl("button", "restart-btn", "Jogar Novamente");
  btn.addEventListener("click", () => showWorldPopulationMode());
  container.appendChild(btn);

  const menuBtn = createEl("button", "mode-switch-btn", "Trocar Módulo");
  menuBtn.style.marginTop = "12px";
  menuBtn.addEventListener("click", () => navigateTo("select"));
  container.appendChild(menuBtn);
}
