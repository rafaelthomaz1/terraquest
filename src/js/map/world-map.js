import { game, worldMap, refs } from '../state.js';
import { COUNTRIES, COUNTRY_INFO, ISO_ALPHA2 } from '../data/countries.js';
import { createTooltipContent, createUnknownTooltip } from '../utils/dom.js';
import { makeHint } from '../utils/normalize.js';
import { showFeedbackMsg } from '../utils/dom.js';
import { handleClickModeClick } from '../modes/world-click.js';

// ── Map initialization ──────────────────────────────────────────────────────
export function initWorldMap() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  worldMap.width = width;
  worldMap.height = height;

  const svg = d3.select("#map-container")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid slice");

  worldMap.svg = svg;
  worldMap.defs = svg.append("defs");
  worldMap.g = svg.append("g");

  worldMap.baseScale = height / Math.PI;
  worldMap.currentScale = worldMap.baseScale;

  worldMap.projection = d3.geoEquirectangular()
    .scale(worldMap.baseScale)
    .translate([width / 2, height / 2])
    .rotate([0, 0]);

  worldMap.path = d3.geoPath().projection(worldMap.projection);

  svg.append("rect")
    .attr("x", -width * 2)
    .attr("y", -height * 2)
    .attr("width", width * 5)
    .attr("height", height * 5)
    .attr("class", "ocean")
    .lower();

  // Drag behavior
  const drag = d3.drag()
    .on("start", (event) => {
      worldMap.dragStart = [event.x, event.y];
      worldMap.dragStartRotate = worldMap.projection.rotate()[0];
      worldMap.dragStartTY = worldMap.projection.translate()[1];
    })
    .on("drag", (event) => {
      const dx = event.x - worldMap.dragStart[0];
      const dy = event.y - worldMap.dragStart[1];
      const degPerPx = 360 / (2 * Math.PI * worldMap.currentScale);
      worldMap.projection.rotate([worldMap.dragStartRotate + dx * degPerPx, 0]);
      const [tx] = worldMap.projection.translate();
      worldMap.projection.translate([tx, worldMap.dragStartTY + dy]);
      renderMap();
    });

  svg.call(drag);

  // Zoom behavior
  svg.node().addEventListener("wheel", (event) => {
    event.preventDefault();
    const sx = event.clientX;
    const sy = event.clientY;
    const geo = worldMap.projection.invert([sx, sy]);
    const factor = event.deltaY > 0 ? 1 / 1.15 : 1.15;
    worldMap.currentScale = Math.max(worldMap.baseScale, Math.min(worldMap.baseScale * 12, worldMap.currentScale * factor));
    worldMap.projection.scale(worldMap.currentScale);
    if (geo) {
      const newPos = worldMap.projection(geo);
      if (newPos) {
        const [tx, ty] = worldMap.projection.translate();
        worldMap.projection.translate([tx + (sx - newPos[0]), ty + (sy - newPos[1])]);
      }
    }
    renderMap();
  }, { passive: false });

  // Tooltip positioning
  svg.on("mousemove", (event) => {
    refs.tooltip.style.left = (event.clientX + 16) + "px";
    refs.tooltip.style.top = (event.clientY - 16) + "px";
  });

  // Load world data
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then(world => {
    if (!world || !world.objects || !world.objects.countries) {
      showFeedbackMsg(refs.feedback, "Erro: dados do mapa inv\u00e1lidos.", "red");
      return;
    }

    const countries = topojson.feature(world, world.objects.countries);
    worldMap.features = countries.features;
    document.dispatchEvent(new Event("worldFeaturesReady"));

    worldMap.g.selectAll(".country-path")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("class", "country-path")
      .attr("d", worldMap.path)
      .each(function(d) {
        const id = String(Number(d.id));
        d._nid = id;
        if (COUNTRIES[id]) { worldMap.pathMap[id] = d3.select(this); }
      })
      .on("mouseenter", function(event, d) {
        const id = d._nid;
        if (!COUNTRIES[id]) return;
        if (game.found.has(id) || game.gameOver) {
          const info = COUNTRY_INFO[id];
          const cName = COUNTRIES[id];
          if (info) {
            createTooltipContent(refs.tooltip, cName, [
              ["Capital:", info[0]],
              ["Popula\u00e7\u00e3o:", info[1]],
              ["L\u00edngua:", info[2]],
              ["Moeda:", info[3]],
            ]);
          } else {
            createTooltipContent(refs.tooltip, cName);
          }
        } else {
          createUnknownTooltip(refs.tooltip);
        }
        refs.tooltip.style.opacity = 1;
      })
      .on("mouseleave", () => { refs.tooltip.style.opacity = 0; })
      .on("click", function(event, d) {
        const id = d._nid;
        if (!COUNTRIES[id]) return;
        if (game.currentGameMode === "world-click") { handleClickModeClick(id); return; }
        if (game.found.has(id) || game.gameOver) return;
        showHint(COUNTRIES[id]);
      });

  }).catch(err => {
    console.error("Erro ao carregar mapa:", err);
    showFeedbackMsg(refs.feedback, "Erro ao carregar o mapa. Verifique sua conex\u00e3o.", "red");
  });
}

const BRIDGE_PAIRS = [["76", "266"], ["840", "620"]];

export function showBridgeLines() {
  hideBridgeLines();
  if (!worldMap.features || !worldMap.g) return;

  const bridgeG = worldMap.g.append("g").attr("class", "bridge-lines-group");
  worldMap.bridgeLines = bridgeG;

  const featureMap = {};
  worldMap.features.forEach(f => {
    featureMap[String(Number(f.id))] = f;
  });

  BRIDGE_PAIRS.forEach(([idA, idB]) => {
    const fA = featureMap[idA];
    const fB = featureMap[idB];
    if (!fA || !fB) return;

    const centA = d3.geoCentroid(fA);
    const centB = d3.geoCentroid(fB);

    const lineGeo = {
      type: "LineString",
      coordinates: [centA, centB],
    };

    bridgeG.append("path")
      .datum(lineGeo)
      .attr("class", "bridge-line")
      .attr("d", worldMap.path);
  });
}

export function hideBridgeLines() {
  if (worldMap.bridgeLines) {
    worldMap.bridgeLines.remove();
    worldMap.bridgeLines = null;
  }
}

export function renderMap() {
  worldMap.g.selectAll(".country-path").attr("d", worldMap.path);
  worldMap.g.selectAll(".bridge-line").attr("d", worldMap.path);
  worldMap.g.selectAll(".where-line").attr("d", worldMap.path);
  worldMap.g.selectAll(".where-marker").attr("d", worldMap.path.pointRadius(5));
  worldMap.defs.selectAll("pattern[id^='flag-']").each(function() {
    const patId = this.id;
    const countryId = patId.replace("flag-", "");
    const el = worldMap.pathMap[countryId];
    if (!el) return;
    const bbox = el.node().getBBox();
    d3.select(this)
      .attr("x", bbox.x).attr("y", bbox.y)
      .attr("width", bbox.width).attr("height", bbox.height);
  });
}

function showHint(name) {
  if (game.difficulty === "hard") return;
  clearTimeout(game.hintTimeout);
  refs.hintDisplay.textContent = makeHint(name);
  refs.hintDisplay.style.opacity = 1;
  game.hintTimeout = setTimeout(() => { refs.hintDisplay.style.opacity = 0; }, 4000);
}

// ── Reveal country with flag clipped to shape ───────────────────────────────
// Uses clipPath + <image> overlay instead of <pattern> for cross-browser support.
export function revealCountry(id, color, flash) {
  const el = worldMap.pathMap[id];
  if (!el) return;
  const alpha2 = ISO_ALPHA2[id];

  const applyFill = () => {
    // Fill country with continent color
    el.style("fill", color);
    el.classed("country-found", true);
    el.style("stroke", "#fff").style("stroke-width", "0.8px");

    if (alpha2) {
      const bbox = el.node().getBBox();
      const clipId = `clip-${id}`;
      const flagUrl = `/flags/${alpha2}.png`;

      // Create clipPath from country shape
      const clip = worldMap.defs.append("clipPath").attr("id", clipId);
      clip.node().appendChild(el.node().cloneNode(true));

      // Add flag image clipped to country shape (on top of the colored path)
      worldMap.g.append("image")
        .attr("class", "flag-overlay")
        .attr("data-country", id)
        .attr("xlink:href", flagUrl)
        .attr("href", flagUrl)
        .attr("x", bbox.x).attr("y", bbox.y)
        .attr("width", bbox.width).attr("height", bbox.height)
        .attr("preserveAspectRatio", "xMidYMid slice")
        .attr("clip-path", `url(#${clipId})`)
        .style("pointer-events", "none");
    }
  };

  if (flash) {
    el.classed("country-flash", true);
    setTimeout(() => { el.classed("country-flash", false); applyFill(); }, 150);
  } else {
    applyFill();
  }
}
