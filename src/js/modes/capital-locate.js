import { game } from '../state.js';
import { COUNTRIES, COUNTRY_INFO, CAPITAL_COORDS, ISO_ALPHA2, CONTINENTS } from '../data/countries.js';
import { BR_STATES } from '../data/br-states.js';
import { US_STATES } from '../data/us-states.js';
import { BR_CAPITAL_COORDS, US_CAPITAL_COORDS } from '../data/capital-coords.js';
import { shuffleArray } from '../utils/shuffle.js';
import { createEl, clearChildren } from '../utils/dom.js';
import { navigateTo } from '../ui/navigation.js';
import { stopStopwatch } from '../ui/stopwatch.js';
import { showModePopup, showGameLostPopup, showEndGamePopup } from '../ui/mode-popup.js';
import { deduplicateFeatures } from '../utils/geo.js';

let queue = [];
let currentTarget = null;
let correct = 0;
let wrong = 0;
let errors = 0;
let totalRounds = 10;
let dots = [];
let mapMode = "world";
let svgEl = null;
let projection = null;
let currentContinent = null;

const CONTINENT_FILTER = {
  "africa": "AF",
  "americas-n": "NA",
  "americas-c": "CA",
  "americas-s": "SA",
  "asia": "AS",
  "europe": "EU",
  "oceania": "OC",
  "world": null
};


export function showCapitalLocateMode(mode, continent, rounds) {
  mapMode = mode || "world";
  const defaultRounds = (mapMode === "br" || mapMode === "us") ? 999 : 10;
  totalRounds = rounds || defaultRounds;
  currentContinent = continent || null;
  correct = 0;
  wrong = 0;
  errors = 0;
  game._capitalLocateCorrect = 0;
  game._capitalLocateTotal = totalRounds;

  const panel = document.getElementById("capital-locate-panel");
  panel.classList.add("active");

  if (mapMode === "world") {
    setupWorldMap(continent);
  } else if (mapMode === "br") {
    setupStatesMap("br");
  } else if (mapMode === "us") {
    setupStatesMap("us");
  }
}

function setupWorldMap(continent) {
  const container = document.getElementById("capital-locate-map");
  clearChildren(container);

  const contCode = continent ? CONTINENT_FILTER[continent] : null;
  let ids = Object.keys(CAPITAL_COORDS).filter(id => COUNTRIES[id]);
  if (contCode) ids = ids.filter(id => CONTINENTS[id] === contCode);

  shuffleArray(ids);
  const selected = ids.slice(0, Math.min(totalRounds, ids.length));
  queue = selected.slice();
  dots = selected.slice();

  const width = window.innerWidth;
  const height = window.innerHeight;
  const padding = 40;

  svgEl = d3.select(container).append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "var(--ocean)");

  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then(world => {
    const countries = topojson.feature(world, world.objects.countries);
    countries.features = deduplicateFeatures(countries.features);

    let displayFeatures = countries.features;
    if (contCode) {
      displayFeatures = countries.features.filter(f => CONTINENTS[String(Number(f.id))] === contCode);
    }

    if (continent === "americas-n") {
      projection = d3.geoEquirectangular()
        .center([-95, 40])
        .scale(Math.min(width, height) * 0.65)
        .translate([width / 2, height / 2 + 40]);
    } else if (continent === "oceania") {
      projection = d3.geoEquirectangular()
        .center([155, -25])
        .scale(Math.min(width, height) * 0.7)
        .translate([width / 2, height / 2 + 30]);
    } else if (continent === "europe") {
      projection = d3.geoEquirectangular()
        .center([15, 52])
        .scale(Math.min(width, height) * 0.85)
        .translate([width / 2, height / 2 + 30]);
    } else if (contCode) {
      const fitTarget = { type: "FeatureCollection", features: displayFeatures };
      projection = d3.geoEquirectangular()
        .fitExtent([[padding, padding + 50], [width - padding, height - padding]], fitTarget);
    } else {
      projection = d3.geoEquirectangular()
        .fitExtent([[padding, padding], [width - padding, height - padding]], { type: "Sphere" });
    }

    const path = d3.geoPath().projection(projection);

    svgEl.append("g").selectAll("path")
      .data(displayFeatures)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", "var(--country-fill)")
      .attr("stroke", "var(--country-stroke)")
      .attr("stroke-width", 0.5);

    renderDots();
    setupSkipButton();
    nextTarget();
  }).catch(() => {});
}

function setupStatesMap(country) {
  const container = document.getElementById("capital-locate-map");
  clearChildren(container);

  const statesData = country === "br" ? BR_STATES : US_STATES;
  const coords = country === "br" ? BR_CAPITAL_COORDS : US_CAPITAL_COORDS;
  let ids = Object.keys(coords).filter(id => statesData[id]);

  shuffleArray(ids);
  const selected = ids.slice(0, Math.min(totalRounds, ids.length));
  queue = selected.slice();
  dots = ids;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const dataUrl = country === "br"
    ? "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/json&qualidade=intermediaria&intrarregiao=UF"
    : "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

  d3.json(dataUrl).then(data => {
    let features;
    if (country === "br") {
      features = data.type === "FeatureCollection" ? data.features
        : data.type === "Topology" ? topojson.feature(data, data.objects[Object.keys(data.objects)[0]]).features
        : [];
    } else {
      features = topojson.feature(data, data.objects.states).features;
    }
    const states = { type: "FeatureCollection", features };

    projection = country === "br"
      ? d3.geoMercator().fitExtent([[60, 80], [width - 60, height - 40]], states)
      : d3.geoAlbersUsa().fitExtent([[20, 20], [width - 20, height - 20]], states);

    svgEl = d3.select(container).append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "var(--ocean)");

    const path = d3.geoPath().projection(projection);

    svgEl.append("g").selectAll("path")
      .data(states.features)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", "var(--country-fill)")
      .attr("stroke", "var(--country-stroke)")
      .attr("stroke-width", 0.5);

    renderDots();
    setupSkipButton();
    nextTarget();
  }).catch(() => {});
}

function renderDots() {
  if (!svgEl || !projection) return;
  const coordsMap = mapMode === "world" ? CAPITAL_COORDS
    : mapMode === "br" ? BR_CAPITAL_COORDS : US_CAPITAL_COORDS;

  const dotsG = svgEl.append("g").attr("class", "capital-dots");

  dots.forEach(id => {
    const coord = coordsMap[id];
    if (!coord) return;
    const [lat, lon] = coord;
    const pt = projection([lon, lat]);
    if (!pt) return;

    dotsG.append("circle")
      .attr("cx", pt[0])
      .attr("cy", pt[1])
      .attr("r", 6)
      .attr("fill", "white")
      .attr("stroke", "var(--border)")
      .attr("stroke-width", 1)
      .attr("class", "capital-dot")
      .attr("data-id", id)
      .style("cursor", "pointer")
      .on("click", () => handleDotClick(id));
  });
}

function setupSkipButton() {
  const skipBtn = document.getElementById("capital-locate-skip");
  if (skipBtn) skipBtn.remove();

  if (game.difficulty === "hard") return;

  const banner = document.getElementById("capital-locate-banner");
  if (!banner) return;

  const btn = createEl("button", "skip-btn", "Pular");
  btn.id = "capital-locate-skip";
  btn.style.marginLeft = "12px";
  btn.addEventListener("click", handleSkip);
  banner.appendChild(btn);
}

function handleSkip() {
  if (!currentTarget) return;
  const dot = svgEl ? svgEl.select(`.capital-dot[data-id="${currentTarget}"]`) : null;
  if (dot && !dot.empty()) {
    dot.attr("fill", "#eab308").attr("r", 7).classed("dot-correct", true);
    dot.on("click", null);
  }
  nextTarget();
}

function nextTarget() {
  if (queue.length === 0) {
    endGame();
    return;
  }
  currentTarget = queue.shift();
  updateBanner();
}

function handleDotClick(id) {
  if (!currentTarget) return;
  const dot = svgEl.select(`.capital-dot[data-id="${id}"]`);
  if (dot.empty() || dot.classed("dot-correct")) return;

  if (id === currentTarget) {
    correct++;
    game._capitalLocateCorrect = correct;
    dot.attr("fill", "#22c55e").attr("r", 8).classed("dot-correct", true);
    dot.on("click", null);
    nextTarget();
  } else {
    wrong++;
    errors++;
    const origFill = dot.attr("fill");
    dot.attr("fill", "#ef4444");
    setTimeout(() => {
      if (!dot.classed("dot-correct")) dot.attr("fill", origFill);
    }, 400);
    updateBanner();

    const maxErrors = game.difficulty === "hard" ? 1 : game.difficulty === "easy" ? 2 : Infinity;
    if (errors >= maxErrors) {
      currentTarget = null;
      setTimeout(() => {
        showGameLostPopup(correct, () => showCapitalLocateMode(mapMode, currentContinent, totalRounds), () => navigateTo("select"));
      }, 500);
      return;
    }
  }
}

function updateBanner() {
  const progress = document.getElementById("capital-locate-progress");
  const target = document.getElementById("capital-locate-target");
  const flag = document.getElementById("capital-locate-flag");

  const done = correct;
  const total = correct + queue.length + (currentTarget ? 1 : 0);

  if (progress) progress.textContent = `${done} / ${total}`;
  if (currentTarget) {
    if (mapMode === "world") {
      const info = COUNTRY_INFO[currentTarget];
      if (target) target.textContent = info ? info[0] : "---";
      if (flag) {
        flag.src = `/flags/${ISO_ALPHA2[currentTarget]}.png`;
        flag.style.display = "inline";
      }
    } else {
      const statesData = mapMode === "br" ? BR_STATES : US_STATES;
      const state = statesData[currentTarget];
      if (target) target.textContent = state ? state.capital : "---";
      if (flag) flag.style.display = "none";
    }
  }
}

function endGame() {
  currentTarget = null;
  stopStopwatch();

  const skipBtn = document.getElementById("capital-locate-skip");
  if (skipBtn) skipBtn.remove();

  const subtitle = wrong > 0 ? `${correct}/${totalRounds} acertos, ${wrong} erros` : `${correct}/${totalRounds} acertos`;
  showEndGamePopup(
    "Fim!",
    subtitle,
    () => showCapitalLocateMode(mapMode, currentContinent, totalRounds),
    () => navigateTo("select")
  );
}
