import { COUNTRIES, COUNTRY_INFO, COUNTRY_AREA, ISO_ALPHA2 } from '../data/countries.js';
import { parsePopulation } from '../utils/population.js';
import { normalize } from '../utils/normalize.js';
import { ALIASES } from '../data/aliases.js';
import { createEl, clearChildren } from '../utils/dom.js';
import { navigateTo } from '../ui/navigation.js';
import { stopStopwatch } from '../ui/stopwatch.js';
import { showEndGamePopup } from '../ui/mode-popup.js';
import { deduplicateFeatures } from '../utils/geo.js';

let topIds = [];
let foundIds = new Set();
let totalTarget = 15;
let gameType = "population";
let svgEl = null;
let projection = null;
let topoCache = null;
let countriesGeo = null;
let pathGen = null;

function loadTopo() {
  if (topoCache) return Promise.resolve(topoCache);
  return d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then(world => {
    topoCache = world;
    return world;
  });
}

function getTopCountries(type, count) {
  const ids = Object.keys(COUNTRIES).filter(id => {
    if (type === "population") return COUNTRY_INFO[id];
    return COUNTRY_AREA[id];
  });

  ids.sort((a, b) => {
    if (type === "population") {
      return parsePopulation(COUNTRY_INFO[b][1]) - parsePopulation(COUNTRY_INFO[a][1]);
    }
    return (COUNTRY_AREA[b] || 0) - (COUNTRY_AREA[a] || 0);
  });

  return count ? ids.slice(0, count) : ids;
}

export function showTopMapGame(type, count) {
  gameType = type;
  foundIds = new Set();
  topIds = getTopCountries(type, count);
  totalTarget = topIds.length;

  const panel = document.getElementById("capital-locate-panel");
  panel.classList.add("active");

  const banner = document.getElementById("capital-locate-banner");
  if (banner) banner.style.display = "flex";

  const container = document.getElementById("capital-locate-map");
  clearChildren(container);

  const width = container.clientWidth || 900;
  const height = container.clientHeight || 500;

  projection = d3.geoEquirectangular()
    .fitExtent([[20, 20], [width - 20, height - 20]], { type: "Sphere" });

  svgEl = d3.select(container).append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "var(--ocean)")
    .style("border-radius", "8px");

  loadTopo().then(world => {
    countriesGeo = topojson.feature(world, world.objects.countries);
    countriesGeo.features = deduplicateFeatures(countriesGeo.features);
    pathGen = d3.geoPath().projection(projection);

    svgEl.append("g").attr("class", "countries-g").selectAll("path")
      .data(countriesGeo.features)
      .enter().append("path")
      .attr("d", pathGen)
      .attr("fill", "var(--country-fill)")
      .attr("stroke", "var(--country-stroke)")
      .attr("stroke-width", 0.5)
      .attr("data-id", d => String(Number(d.id)));

    setupInput();
    updateBanner();
  }).catch(() => {});
}

function setupInput() {
  const banner = document.getElementById("capital-locate-banner");
  if (!banner) return;

  clearChildren(banner);

  const progress = createEl("span", "");
  progress.id = "capital-locate-progress";
  progress.style.fontWeight = "600";
  banner.appendChild(progress);

  const label = createEl("span", "");
  if (totalTarget >= Object.keys(COUNTRIES).length - 10) {
    label.textContent = gameType === "population"
      ? "Pa\u00edses por popula\u00e7\u00e3o"
      : "Pa\u00edses por \u00e1rea";
  } else {
    label.textContent = gameType === "population"
      ? `Top ${totalTarget} mais populosos`
      : `Top ${totalTarget} maiores em \u00e1rea`;
  }
  banner.appendChild(label);

  const input = createEl("input", "");
  input.type = "text";
  input.placeholder = "Digite o nome do pa\u00eds...";
  input.autocomplete = "off";
  input.maxLength = 100;
  input.id = "top-map-input";
  input.style.cssText = "width:220px;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--surface-solid);color:var(--text);font-family:inherit;font-size:14px;margin-left:12px;";
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleGuess(input);
  });
  banner.appendChild(input);

  setTimeout(() => input.focus(), 100);
}

function handleGuess(input) {
  const raw = input.value.trim();
  if (!raw) return;
  const guess = normalize(raw);

  let matchId = ALIASES[guess] || null;

  if (matchId && topIds.includes(matchId) && !foundIds.has(matchId)) {
    foundIds.add(matchId);
    revealCountryOnMap(matchId);
    input.value = "";
    updateBanner();

    if (foundIds.size >= topIds.length) {
      stopStopwatch();
      showEndGamePopup(
        "Parab\u00e9ns!",
        `Voc\u00ea acertou todos os ${totalTarget} pa\u00edses!`,
        () => showTopMapGame(gameType, totalTarget),
        () => navigateTo("select")
      );
    }
  } else {
    input.classList.add("input-shake");
    setTimeout(() => input.classList.remove("input-shake"), 400);
  }
}

function revealCountryOnMap(id) {
  if (!svgEl || !countriesGeo || !pathGen) return;

  const feature = countriesGeo.features.find(f => String(Number(f.id)) === id);
  if (!feature) return;

  const countryPath = svgEl.select(`path[data-id="${id}"]`);
  if (!countryPath.empty()) {
    countryPath.attr("fill", "#22c55e").attr("stroke", "#16a34a").attr("stroke-width", 1.5);
  }

  const alpha2 = ISO_ALPHA2[id];
  const centroid = pathGen.centroid(feature);
  if (!centroid || isNaN(centroid[0])) return;

  const g = svgEl.append("g").attr("class", "top-map-label");

  if (alpha2) {
    const flagSize = 20;
    g.append("image")
      .attr("href", `/flags/${alpha2}.png`)
      .attr("x", centroid[0] - flagSize / 2)
      .attr("y", centroid[1] - flagSize - 2)
      .attr("width", flagSize)
      .attr("height", flagSize * 0.67)
      .attr("preserveAspectRatio", "xMidYMid slice");
  }

  g.append("text")
    .attr("x", centroid[0])
    .attr("y", centroid[1] + 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "9px")
    .attr("font-weight", "700")
    .attr("fill", "var(--text)")
    .attr("stroke", "var(--bg)")
    .attr("stroke-width", "2px")
    .attr("paint-order", "stroke")
    .text(COUNTRIES[id]);
}

function updateBanner() {
  const progress = document.getElementById("capital-locate-progress");
  if (progress) progress.textContent = `${foundIds.size} / ${topIds.length}`;
}
