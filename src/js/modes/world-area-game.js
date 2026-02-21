import { game, areaState } from '../state.js';
import { COUNTRIES, COUNTRY_INFO, COUNTRY_AREA, ISO_ALPHA2 } from '../data/countries.js';
import { shuffleArray } from '../utils/shuffle.js';
import { parsePopulation } from '../utils/population.js';
import { createEl, clearChildren } from '../utils/dom.js';
import { navigateTo } from '../ui/navigation.js';
import { showGameLostPopup, showCountryInfoPopup, showEndGamePopup } from '../ui/mode-popup.js';
import { deduplicateFeatures } from '../utils/geo.js';

let topoCache = null;

function loadTopo() {
  if (topoCache) return Promise.resolve(topoCache);
  return d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then(world => {
    topoCache = world;
    return world;
  });
}

function formatArea(km2) {
  if (km2 >= 1000000) return (km2 / 1000000).toFixed(1).replace(".", ",") + "M km\u00b2";
  if (km2 >= 1000) return (km2 / 1000).toFixed(0) + "K km\u00b2";
  return km2 + " km\u00b2";
}

export function showWorldAreaGameMode(totalRounds) {
  const panel = document.getElementById("population-panel");
  panel.classList.add("active");
  document.getElementById("streak-container-population").style.display = "flex";
  document.querySelector(".pop-question").textContent = "Qual \u00e9 maior em \u00e1rea?";

  const ids = Object.keys(COUNTRIES).filter(id => COUNTRY_AREA[id]);
  shuffleArray(ids);

  const limit = totalRounds ? Math.min(totalRounds * 2, ids.length) : ids.length;
  const pairs = [];
  for (let i = 0; i + 1 < limit; i += 2) {
    pairs.push([ids[i], ids[i + 1]]);
  }

  areaState.pairs = pairs;
  areaState.currentPairIndex = 0;
  areaState.streak = 0;
  areaState.bestStreak = 0;
  areaState.missedOnce = false;
  areaState.gameOver = false;
  areaState.totalRounds = totalRounds || pairs.length;

  updateStreakDisplay();
  loadTopo().then(() => nextPair()).catch(() => {});
}

function nextPair() {
  if (areaState.currentPairIndex >= areaState.pairs.length) {
    endArea();
    return;
  }
  areaState.missedOnce = false;
  const pair = areaState.pairs[areaState.currentPairIndex];
  renderPair(pair[0], pair[1]);
}

function renderPair(idA, idB) {
  const container = document.getElementById("population-cards");
  clearChildren(container);

  const areaA = COUNTRY_AREA[idA] || 0;
  const areaB = COUNTRY_AREA[idB] || 0;

  const cardA = buildAreaCard(idA);
  const vs = createEl("div", "pop-versus", "VS");
  const cardB = buildAreaCard(idB);

  container.appendChild(cardA.el);
  container.appendChild(vs);
  container.appendChild(cardB.el);

  let answered = false;

  function handleChoice(chosenId) {
    if (answered && !(game.difficulty !== "hard" && !areaState.missedOnce)) return;
    const correctId = areaA >= areaB ? idA : idB;

    if (chosenId === correctId) {
      answered = true;
      (correctId === idA ? cardA : cardB).el.classList.add("pop-card--correct");
      cardA.showArea();
      cardB.showArea();
      disableBoth();
      areaState.streak++;
      if (areaState.streak > areaState.bestStreak) areaState.bestStreak = areaState.streak;
      updateStreakDisplay();
      bumpStreak();
      setTimeout(() => {
        areaState.currentPairIndex++;
        nextPair();
      }, 1200);
    } else {
      if (game.difficulty !== "hard" && !areaState.missedOnce) {
        areaState.missedOnce = true;
        (chosenId === idA ? cardA : cardB).el.classList.add("pop-card--wrong");
        (chosenId === idA ? cardA : cardB).el.classList.add("pop-card--disabled");
      } else if (game.difficulty === "learning") {
        answered = true;
        (chosenId === idA ? cardA : cardB).el.classList.add("pop-card--wrong");
        (correctId === idA ? cardA : cardB).el.classList.add("pop-card--correct");
        cardA.showArea();
        cardB.showArea();
        disableBoth();
        areaState.streak = 0;
        updateStreakDisplay();
        setTimeout(() => {
          areaState.currentPairIndex++;
          nextPair();
        }, 1200);
      } else {
        answered = true;
        (chosenId === idA ? cardA : cardB).el.classList.add("pop-card--wrong");
        (correctId === idA ? cardA : cardB).el.classList.add("pop-card--correct");
        cardA.showArea();
        cardB.showArea();
        disableBoth();
        areaState.streak = 0;
        updateStreakDisplay();
        setTimeout(() => {
          showGameLostPopup(areaState.bestStreak, () => showWorldAreaGameMode(areaState.totalRounds), () => navigateTo("select"));
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

function buildAreaCard(id) {
  const el = createEl("div", "pop-card");

  const svgWrap = createEl("div", "pop-card-svg-wrap");
  svgWrap.style.position = "relative";
  svgWrap.style.width = "220px";
  svgWrap.style.height = "160px";
  svgWrap.style.overflow = "hidden";
  svgWrap.style.borderRadius = "8px";

  const alpha2 = ISO_ALPHA2[id];

  const world = topoCache;
  const countries = topojson.feature(world, world.objects.countries);
  countries.features = deduplicateFeatures(countries.features);
  const feature = countries.features.find(f => String(Number(f.id)) === id);

  if (feature) {
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgEl.setAttribute("viewBox", "0 0 220 160");
    svgEl.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    const clipId = `area-clip-${id}-${Date.now()}`;
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
    const flagImg = createEl("img");
    flagImg.src = `/flags/${alpha2}.png`;
    flagImg.alt = COUNTRIES[id];
    flagImg.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;border-radius:8px;opacity:0.3;";
    svgWrap.appendChild(flagImg);
  }

  el.appendChild(svgWrap);
  el.appendChild(createEl("div", "pop-card-name", COUNTRIES[id]));

  const learnBtn = createEl("button", "learn-country-btn", "Aprender");
  learnBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showCountryInfoPopup(id);
  });
  el.appendChild(learnBtn);

  const areaEl = createEl("div", "pop-card-pop", formatArea(COUNTRY_AREA[id] || 0));
  el.appendChild(areaEl);

  return {
    el,
    showArea() { areaEl.classList.add("show"); }
  };
}

function updateStreakDisplay() {
  const el = document.getElementById("streak-value-population");
  const bestEl = document.getElementById("streak-best-population");
  if (el) el.textContent = areaState.streak;
  if (bestEl) bestEl.textContent = "Melhor: " + areaState.bestStreak;
}

function bumpStreak() {
  const el = document.getElementById("streak-value-population");
  if (!el) return;
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

function endArea() {
  areaState.gameOver = true;
  showEndGamePopup(
    `Melhor sequ\u00eancia: ${areaState.bestStreak}`,
    "\u00c1rea conclu\u00eddo!",
    () => showWorldAreaGameMode(areaState.totalRounds),
    () => navigateTo("select")
  );
}
