import { game, whereIsState, worldMap } from '../state.js';
import { COUNTRIES, CONTINENTS, CONTINENT_COLORS, ISO_ALPHA2 } from '../data/countries.js';
import { shuffleArray } from '../utils/shuffle.js';
import { createEl, clearChildren } from '../utils/dom.js';
import { resetGame, navigateTo } from '../ui/navigation.js';
import { refs } from '../state.js';
import { revealCountry } from '../map/world-map.js';
import { showEndGamePopup } from '../ui/mode-popup.js';

const MAX_DIST = 6000;

let whereClickHandler = null;
let featuresCache = null;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function showWorldWhereMode() {
  resetGame();
  document.getElementById("world-panel").style.display = "block";
  document.getElementById("top-bar").style.display = "none";
  document.getElementById("progress-container").style.display = "none";
  document.getElementById("continent-legend").style.display = "none";
  document.getElementById("input-container").style.display = "none";
  document.getElementById("hint-display").style.display = "none";
  document.getElementById("where-banner").classList.add("active");

  const rounds = whereIsState.totalRounds || 7;
  const ids = Object.keys(COUNTRIES).slice();
  shuffleArray(ids);
  whereIsState.queue = ids.slice(0, rounds);
  whereIsState.currentTarget = null;
  whereIsState.round = 0;
  whereIsState.totalRounds = rounds;
  whereIsState.totalPoints = 0;
  whereIsState.gameOver = false;

  cacheFeatures();
  installClickHandler();
  nextWhereRound();
}

function cacheFeatures() {
  if (featuresCache) return;
  if (!worldMap.features) return;
  featuresCache = {};
  worldMap.features.forEach(f => {
    const id = String(Number(f.id));
    featuresCache[id] = f;
  });
}

function installClickHandler() {
  removeClickHandler();
  whereClickHandler = function (event) {
    if (whereIsState.gameOver || !whereIsState.currentTarget) return;
    const point = worldMap.projection.invert(d3.pointer(event, worldMap.svg.node()));
    if (!point) return;
    handleWhereClick(point[0], point[1]);
  };
  worldMap.svg.on("click.where", whereClickHandler);
}

function removeClickHandler() {
  worldMap.svg.on("click.where", null);
  whereClickHandler = null;
}

function nextWhereRound() {
  const resultEl = document.getElementById("where-round-result");
  resultEl.classList.remove("active");
  clearChildren(resultEl);

  if (whereIsState.round >= whereIsState.totalRounds || whereIsState.queue.length === 0) {
    endWhere();
    return;
  }

  whereIsState.currentTarget = whereIsState.queue[whereIsState.round];
  whereIsState.round++;

  document.getElementById("where-target-name").textContent = COUNTRIES[whereIsState.currentTarget];
  document.getElementById("where-round-info").textContent = `Rodada ${whereIsState.round} / ${whereIsState.totalRounds}`;
  document.getElementById("where-points-display").textContent = `Pontos: ${whereIsState.totalPoints}`;

  worldMap.g.selectAll(".where-marker").remove();
  worldMap.g.selectAll(".where-line").remove();
}

function handleWhereClick(lon, lat) {
  const id = whereIsState.currentTarget;
  const feature = featuresCache[id];
  if (!feature) {
    nextWhereRound();
    return;
  }

  const centroid = d3.geoCentroid(feature);
  const clickedOnCorrect = d3.geoContains(feature, [lon, lat]);

  let points;
  let dist;
  if (clickedOnCorrect) {
    points = 1000;
    dist = 0;
  } else {
    dist = haversine(lat, lon, centroid[1], centroid[0]);
    points = dist <= 50 ? 1000 : dist >= MAX_DIST ? 0 : Math.round(1000 * (1 - dist / MAX_DIST));
  }
  whereIsState.totalPoints += points;

  const continent = CONTINENTS[id];
  const color = CONTINENT_COLORS[continent];
  revealCountry(id, color, true);

  if (!clickedOnCorrect) {
    const clickedGeo = { type: "Point", coordinates: [lon, lat] };
    worldMap.g.append("path")
      .datum(clickedGeo)
      .attr("class", "where-marker")
      .attr("d", worldMap.path.pointRadius(5))
      .attr("fill", "#f85149")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    const correctGeo = { type: "Point", coordinates: centroid };
    worldMap.g.append("path")
      .datum(correctGeo)
      .attr("class", "where-marker")
      .attr("d", worldMap.path.pointRadius(5))
      .attr("fill", "#22c55e")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    const lineGeo = {
      type: "LineString",
      coordinates: [[lon, lat], centroid]
    };
    worldMap.g.append("path")
      .datum(lineGeo)
      .attr("class", "where-line")
      .attr("d", worldMap.path)
      .attr("fill", "none")
      .attr("stroke", "#fbbf24")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "6 4");
  }

  document.getElementById("where-points-display").textContent = `Pontos: ${whereIsState.totalPoints}`;

  const resultEl = document.getElementById("where-round-result");
  clearChildren(resultEl);
  if (clickedOnCorrect) {
    resultEl.appendChild(document.createTextNode(`Exato!  |  +${points} pts`));
  } else {
    resultEl.appendChild(document.createTextNode(`${Math.round(dist)} km  |  +${points} pts`));
  }

  const nextBtn = createEl("button", "where-next-btn", whereIsState.round >= whereIsState.totalRounds ? "Ver Resultado" : "Pr\u00f3ximo");
  nextBtn.addEventListener("click", () => nextWhereRound());
  resultEl.appendChild(nextBtn);
  resultEl.classList.add("active");

  whereIsState.currentTarget = null;
}

function endWhere() {
  whereIsState.gameOver = true;
  removeClickHandler();
  document.getElementById("where-banner").classList.remove("active");
  document.getElementById("where-round-result").classList.remove("active");

  const maxPoints = whereIsState.totalRounds * 1000;
  showEndGamePopup(
    "Resultado",
    `${whereIsState.totalPoints}/${maxPoints} pontos`,
    () => navigateTo("game"),
    () => navigateTo("select")
  );
}

export function cleanupWhere() {
  removeClickHandler();
  if (!worldMap.g) return;
  worldMap.g.selectAll(".where-marker").remove();
  worldMap.g.selectAll(".where-line").remove();
  Object.values(worldMap.pathMap).forEach(el => {
    el.classed("where-correct", false);
  });
}
