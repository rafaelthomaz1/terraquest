import { statesState, refs } from '../state.js';
import { normalize, makeHint } from '../utils/normalize.js';
import { createEl, clearChildren, createTooltipContent, createUnknownTooltip, showFeedbackMsg, createBreakdownItem } from '../utils/dom.js';
import { showCelebrationEffect } from '../ui/celebration.js';
import { BR_STATES, BR_ALIASES, BR_REGION_COLORS, BR_REGION_ICONS, BR_FLAG_FILES, BR_CAPITAL_ALIASES } from '../data/br-states.js';
import { US_STATES, US_ALIASES, US_REGION_COLORS, US_REGION_ICONS, US_FLAG_EXCEPTIONS, getStateFlagURL, US_CAPITAL_ALIASES } from '../data/us-states.js';

export function getStatesData() {
  return statesState.currentCountry === "BR" ? BR_STATES : US_STATES;
}

export function getStatesAliases() {
  return statesState.currentCountry === "BR" ? BR_ALIASES : US_ALIASES;
}

export function getRegionColors() {
  return statesState.currentCountry === "BR" ? BR_REGION_COLORS : US_REGION_COLORS;
}

export function getStatesTotal() {
  return Object.keys(getStatesData()).length;
}

export function getCapitalAliases() {
  return statesState.currentCountry === "BR" ? BR_CAPITAL_ALIASES : US_CAPITAL_ALIASES;
}

export function statesShowFeedback(msg, color) {
  showFeedbackMsg(refs.statesFeedback, msg, color);
}

export function statesShowHint(name) {
  clearTimeout(statesState.hintTimeout);
  refs.statesHintDisplay.textContent = makeHint(name);
  refs.statesHintDisplay.style.opacity = 1;
  statesState.hintTimeout = setTimeout(() => { refs.statesHintDisplay.style.opacity = 0; }, 4000);
}

export function statesUpdateScore() {
  document.getElementById("states-score-num").textContent = statesState.found.size;
  document.getElementById("states-total-num").textContent = getStatesTotal();
  document.getElementById("states-progress-bar").style.width = `${(statesState.found.size / getStatesTotal()) * 100}%`;
}

export function buildRegionLegend() {
  const legend = document.getElementById("states-region-legend");
  clearChildren(legend);
  const colors = getRegionColors();
  const states = getStatesData();
  statesState.regionTotals = {};
  statesState.regionFound = {};
  statesState.regionCompleted.clear();
  Object.values(states).forEach(s => {
    statesState.regionTotals[s.region] = (statesState.regionTotals[s.region] || 0) + 1;
  });
  Object.keys(statesState.regionTotals).forEach(r => { statesState.regionFound[r] = 0; });

  Object.keys(statesState.regionTotals).forEach(r => {
    const item = createEl('div', 'legend-item');
    item.id = `sleg-${normalize(r)}`;
    const dot = createEl('div', 'legend-dot');
    dot.style.background = colors[r];
    item.appendChild(dot);
    item.appendChild(document.createTextNode(r));
    const count = createEl('span', 'legend-count', `0/${statesState.regionTotals[r]}`);
    count.id = `scount-${normalize(r)}`;
    item.appendChild(count);
    legend.appendChild(item);
  });
}

export function statesUpdateRegionCount(region) {
  const key = normalize(region);
  const el = document.getElementById(`scount-${key}`);
  if (el) el.textContent = `${statesState.regionFound[region]}/${statesState.regionTotals[region]}`;
  if (statesState.regionFound[region] >= statesState.regionTotals[region] && !statesState.regionCompleted.has(region)) {
    statesState.regionCompleted.add(region);
    const leg = document.getElementById(`sleg-${key}`);
    if (leg) leg.classList.add("complete");
    const colors = getRegionColors();
    const icons = statesState.currentCountry === "BR" ? BR_REGION_ICONS : US_REGION_ICONS;
    showCelebrationEffect(
      `${region} completa!`,
      colors[region],
      icons[region],
      `${statesState.regionTotals[region]} estados encontrados`
    );
  }
}

export function revealState(id, color, flash) {
  const el = statesState.pathMap[id];
  if (!el) return;
  const flagUrl = getStateFlagURL(statesState.currentCountry, id, BR_FLAG_FILES);
  const applyFill = () => {
    if (flagUrl && statesState.defs) {
      const bbox = el.node().getBBox();
      const patId = `sflag-${statesState.currentCountry}-${id}`;
      const pat = statesState.defs.append("pattern")
        .attr("id", patId)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("x", bbox.x).attr("y", bbox.y)
        .attr("width", bbox.width).attr("height", bbox.height);
      pat.append("rect")
        .attr("width", bbox.width).attr("height", bbox.height)
        .attr("fill", color);
      pat.append("image")
        .attr("href", flagUrl)
        .attr("x", 0).attr("y", 0)
        .attr("width", bbox.width).attr("height", bbox.height)
        .attr("preserveAspectRatio", "xMidYMid slice");
      el.style("fill", `url(#${patId})`);
    } else {
      el.style("fill", color);
    }
    el.classed("state-found", true);
    el.style("stroke", "#fff").style("stroke-width", "0.8px");
  };
  if (flash) {
    el.classed("state-flash", true);
    setTimeout(() => { el.classed("state-flash", false); applyFill(); }, 150);
  } else {
    applyFill();
  }
}

export function loadStatesMap(country) {
  statesState.currentCountry = country;
  statesState.found.clear();
  statesState.gameOver = false;
  statesState.pathMap = {};
  statesState.loaded = false;

  const container = document.getElementById("states-map-container");
  clearChildren(container);

  const w = window.innerWidth;
  const h = window.innerHeight;

  const sSvg = d3.select("#states-map-container")
    .append("svg")
    .attr("viewBox", `0 0 ${w} ${h}`)
    .attr("preserveAspectRatio", "xMidYMid slice");

  statesState.svg = sSvg;
  statesState.defs = sSvg.append("defs");
  statesState.g = sSvg.append("g");

  sSvg.append("rect")
    .attr("x", -w * 2).attr("y", -h * 2)
    .attr("width", w * 5).attr("height", h * 5)
    .attr("class", "ocean").lower();

  if (country === "BR") {
    statesState.projection = d3.geoMercator()
      .center([-54, -15])
      .scale(w / 5.5)
      .translate([w / 2, h / 2]);
  } else {
    statesState.projection = d3.geoAlbersUsa()
      .scale(w / 5.5 * 3.5)
      .translate([w / 2, h / 2]);
  }

  statesState.path = d3.geoPath().projection(statesState.projection);

  statesState.zoom = d3.zoom()
    .scaleExtent([1, 12])
    .on("zoom", (event) => { statesState.g.attr("transform", event.transform); });
  sSvg.call(statesState.zoom);

  sSvg.on("mousemove", (event) => {
    refs.tooltip.style.left = (event.clientX + 16) + "px";
    refs.tooltip.style.top = (event.clientY - 16) + "px";
  });

  buildRegionLegend();
  statesUpdateScore();

  const si = refs.stateInput;
  si.disabled = false;
  si.value = "";
  document.getElementById("states-give-up-btn").disabled = false;
  refs.statesHintDisplay.style.display = "";
  refs.statesHintDisplay.style.opacity = 0;

  const url = country === "BR"
    ? "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/json&qualidade=intermediaria&intrarregiao=UF"
    : "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

  d3.json(url).then(data => {
    if (!data) {
      statesShowFeedback("Erro: dados do mapa inv\u00e1lidos.", "red");
      return;
    }

    let features;
    if (country === "BR") {
      features = data.type === "FeatureCollection" ? data.features :
                 data.type === "Topology" ? topojson.feature(data, data.objects[Object.keys(data.objects)[0]]).features :
                 [];
    } else {
      features = topojson.feature(data, data.objects.states).features;
    }

    const states = getStatesData();

    statesState.g.selectAll(".state-path")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "state-path")
      .attr("d", statesState.path)
      .each(function(d) {
        let id;
        if (country === "BR") {
          const coduf = d.properties?.codarea || d.properties?.coduf || d.id || "";
          id = String(coduf).substring(0, 2);
        } else {
          id = String(d.id).padStart(2, "0");
        }
        d._sid = id;
        if (states[id]) { statesState.pathMap[id] = d3.select(this); }
      })
      .on("mouseenter", function(event, d) {
        const id = d._sid;
        const states = getStatesData();
        if (!states[id]) return;
        if (statesState.found.has(id) || statesState.gameOver) {
          const s = states[id];
          createTooltipContent(refs.tooltip, `${s.name} (${s.abbr})`, [
            ["Capital:", s.capital],
            ["Regi\u00e3o:", s.region],
          ]);
        } else {
          createUnknownTooltip(refs.tooltip);
        }
        refs.tooltip.style.opacity = 1;
      })
      .on("mouseleave", () => { refs.tooltip.style.opacity = 0; })
      .on("click", function(event, d) {
        const id = d._sid;
        const states = getStatesData();
        if (!states[id] || statesState.found.has(id) || statesState.gameOver) return;
        const hintText = statesState.quizMode === "capitals" ? states[id].capital : states[id].name;
        statesShowHint(hintText);
      });

    // Borders
    if (country === "US") {
      statesState.g.append("path")
        .datum(topojson.mesh(data, data.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "#334155")
        .attr("stroke-width", 0.5)
        .attr("d", statesState.path);
    }

    statesState.loaded = true;

    // Fit to content for BR
    if (country === "BR") {
      const bounds = statesState.path.bounds({ type: "FeatureCollection", features });
      const dx = bounds[1][0] - bounds[0][0];
      const dy = bounds[1][1] - bounds[0][1];
      const x = (bounds[0][0] + bounds[1][0]) / 2;
      const y = (bounds[0][1] + bounds[1][1]) / 2;
      const scale = 0.85 / Math.max(dx / w, dy / h);
      const translate = [w / 2 - scale * x, h / 2 - scale * y];
      statesState.g.attr("transform", `translate(${translate[0]},${translate[1]}) scale(${scale})`);
      sSvg.call(statesState.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    si.focus();
  }).catch(err => {
    console.error("Erro ao carregar mapa de estados:", err);
    statesShowFeedback("Erro ao carregar o mapa. Verifique sua conex\u00e3o.", "red");
  });
}
