import '../css/styles.css';

import { game, continentTracking, clickState, worldMap, refs, initRefs, whereIsState, areaState, authState } from './state.js';
import { COUNTRIES, CONTINENTS, CONTINENT_COLORS } from './data/countries.js';
import { initWorldMap, revealCountry } from './map/world-map.js';
import { initContinentTracking, updateContinentCount } from './ui/score.js';
import { initTheme } from './ui/theme.js';
import { loadDifficulty } from './ui/difficulty.js';
import { navigateTo, handleInputKeydown, handleGiveUp, handleReviewBtn, endCurrentMatch } from './ui/navigation.js';
import { handleStatesGuess, statesGiveUp } from './modes/states-mode.js';
import { flagsSkip } from './modes/world-flags.js';
import { capitalsSkip } from './modes/world-capitals.js';
import { langSkipCurrent } from './modes/world-languages.js';
import { clickGiveUp, nextClickTarget } from './modes/world-click.js';
import { showFeedbackMsg } from './utils/dom.js';
import { showModePopup, showGuidelinesPopup } from './ui/mode-popup.js';
import { skipFlagClick } from './modes/flag-click-game.js';
import { getCurrentUser, logout, fetchRecords, saveGameRecord } from './auth/auth.js';
import { showLoginScreen } from './auth/login.js';
import { trackPageView } from './analytics/tracker.js';

// Initialize DOM references
initRefs();

// Build continent tracking
Object.values(CONTINENTS).forEach(c => {
  continentTracking.totals[c] = (continentTracking.totals[c] || 0) + 1;
});
Object.keys(continentTracking.totals).forEach(c => {
  continentTracking.found[c] = 0;
});

// Init continent legend
initContinentTracking();

// Init world map
initWorldMap();

// Init theme
initTheme();

// Load saved difficulty
loadDifficulty();

// Event listeners
refs.input.addEventListener("keydown", handleInputKeydown);
refs.giveUpBtn.addEventListener("click", handleGiveUp);
refs.restartBtn.addEventListener("click", () => { if (game.currentGameMode) navigateTo("game"); });
refs.restartBtnGo.addEventListener("click", () => { if (game.currentGameMode) navigateTo("game"); });

// Navigation
document.getElementById("play-btn").addEventListener("click", () => navigateTo("select"));
document.getElementById("guidelines-btn").addEventListener("click", () => showGuidelinesPopup());
document.getElementById("achievements-btn").addEventListener("click", () => navigateTo("achievements"));
document.getElementById("achievements-toggle").addEventListener("click", () => navigateTo("achievements"));
document.getElementById("back-btn").addEventListener("click", () => navigateTo("home"));
document.getElementById("menu-btn").addEventListener("click", () => navigateTo("select"));
document.getElementById("end-match-btn").addEventListener("click", endCurrentMatch);
document.getElementById("mode-switch-btn-v").addEventListener("click", () => navigateTo("select"));
document.getElementById("mode-switch-btn-go").addEventListener("click", () => navigateTo("select"));

// Category card definitions
const CATEGORIES = {
  "map-territory": {
    title: "Mapa e Territ\u00f3rio",
    subtitle: "Escolha um modo de jogo",
    options: [
      { label: "Nomear Pa\u00edses", value: "world-type", icon: "\u2328\uFE0F", desc: "Digite os nomes dos 195 pa\u00edses" },
      { label: "Localizar no Mapa", value: "world-click", icon: "\uD83D\uDDFA\uFE0F", desc: "Clique no pa\u00eds correto no mapa", noRecord: true },
      { label: "Rota entre Fronteiras", value: "world-walk", icon: "\uD83D\uDEA9", desc: "Conecte dois pa\u00edses por vizinhos" }
    ]
  },
  "flags": {
    title: "Bandeiras",
    subtitle: "Escolha um modo de jogo",
    options: [
      { label: "Bandeiras Game", value: "world-flags-game", icon: "\uD83C\uDFAE", desc: "Teste com m\u00faltipla escolha" },
      { label: "Clicar na Bandeira", value: "flag-click-game", icon: "\uD83D\uDC46", desc: "Grid de bandeiras - clique na correta", noRecord: true }
    ]
  },
  "capitals": {
    title: "Capitais e Cidades",
    subtitle: "Escolha um modo de jogo",
    options: [
      { label: "Capitais Game", value: "world-capitals-game", icon: "\uD83C\uDFAE", desc: "Teste com m\u00faltipla escolha" },
      { label: "Localizar Capitais", value: "world-capital-locate", icon: "\uD83D\uDCCD", desc: "Clique no ponto da capital no mapa", noRecord: true },
      { label: "Pontos Tur\u00edsticos", value: "landmarks-game", icon: "\uD83C\uDFDB\uFE0F", desc: "Adivinhe a cidade e pa\u00eds do landmark" }
    ]
  },
  "languages": {
    title: "Idiomas",
    subtitle: "Escolha um modo de jogo",
    options: [
      { label: "L\u00ednguas", value: "world-languages-map", icon: "\uD83D\uDDFA\uFE0F", desc: "Encontre pa\u00edses no mapa pelo idioma", noRecord: true }
    ]
  },
  "challenges": {
    title: "Desafios",
    subtitle: "Escolha um desafio",
    options: [
      { label: "Silhuetas", value: "world-silhouettes", icon: "\uD83D\uDDFA\uFE0F", desc: "Identifique pa\u00edses pelo contorno" },
      { label: "Popula\u00e7\u00e3o", value: "population-menu", icon: "\uD83D\uDC65", desc: "Desafios de popula\u00e7\u00e3o", noRecord: true },
      { label: "Maior em \u00c1rea", value: "area-menu", icon: "\uD83D\uDCCF", desc: "Desafios de territ\u00f3rio", noRecord: true }
    ]
  },
  "study-br": {
    title: "Estudar o Brasil",
    subtitle: "Escolha o que praticar",
    options: [
      { label: "Estados", value: "br-states", icon: "\uD83D\uDDFA\uFE0F", desc: "Aprenda os 27 estados" },
      { label: "Capitais", value: "br-capitals", icon: "\uD83C\uDFDB\uFE0F", desc: "Aprenda as capitais dos estados" },
      { label: "Localizar Capitais", value: "br-capital-locate", icon: "\uD83D\uDCCD", desc: "Clique na capital correta no mapa" },
      { label: "Biomas/Veg./Clima", value: "br-biomes-menu", icon: "\uD83C\uDF3F", desc: "Biomas, vegeta\u00e7\u00e3o e clima do Brasil", noRecord: true }
    ]
  },
  "study-us": {
    title: "Estudar os EUA",
    subtitle: "Escolha o que praticar",
    options: [
      { label: "Estados", value: "us-states", icon: "\uD83D\uDDFA\uFE0F", desc: "Aprenda os 51 estados" },
      { label: "Capitais", value: "us-capitals", icon: "\uD83C\uDFDB\uFE0F", desc: "Aprenda as capitais dos estados" },
      { label: "Localizar Capitais", value: "us-capital-locate", icon: "\uD83D\uDCCD", desc: "Clique na capital correta no mapa" }
    ]
  }
};

function handleTopRoundsPopup(modeValue) {
  if (modeValue === "top-population-map" || modeValue === "top-area-map") {
    showModePopup("Rodadas", "Quantos pa\u00edses?", [
      { label: "5 pa\u00edses", value: "5", icon: "\u26A1", desc: "Top 5" },
      { label: "15 pa\u00edses", value: "15", icon: "\uD83C\uDFAF", desc: "Top 15" },
      { label: "30 pa\u00edses", value: "30", icon: "\uD83C\uDFC6", desc: "Top 30" }
    ], (roundsStr) => {
      game._pendingRounds = parseInt(roundsStr);
      game.currentGameMode = modeValue;
      navigateTo("game");
    });
  } else {
    handleRoundsPopup(modeValue, "");
  }
}

function handleRoundsPopup(modeValue, label) {
  showModePopup("Rodadas", "Quantas rodadas?", [
    { label: "5 pa\u00edses", value: "5", icon: "\u26A1", desc: "Partida r\u00e1pida", noRecord: true },
    { label: "10 pa\u00edses", value: "10", icon: "\uD83C\uDFAF", desc: "Partida m\u00e9dia", noRecord: true },
    { label: "30 pa\u00edses", value: "30", icon: "\uD83C\uDFC6", desc: "Desafio completo", noRecord: true }
  ], (roundsStr) => {
    game._pendingRounds = parseInt(roundsStr);
    game.currentGameMode = modeValue;
    navigateTo("game");
  });
}

async function handleCategoryClick(category) {
  const cat = CATEGORIES[category];
  if (!cat) return;

  const records = await fetchRecords();

  showModePopup(cat.title, cat.subtitle, cat.options, (chosen) => {
    // Handle special sub-menus
    if (chosen === "world-click") {
      showModePopup("Localizar no Mapa", "Escolha o modo de jogo", [
        { label: "Modo Simples", value: "world-click", icon: "\uD83D\uDDFA\uFE0F", desc: "Clique no pa\u00eds correto", tooltip: "Voc\u00ea deve clicar exatamente no pa\u00eds pedido." },
        { label: "Modo Menor Dist\u00e2ncia", value: "world-where", icon: "\uD83D\uDCCD", desc: "Ganhe pontos por precis\u00e3o", noRecord: true }
      ], (sub) => {
        if (sub === "world-where") {
          handleRoundsPopup("world-where", "Rodadas");
          whereIsState.totalRounds = 7; // default, will be overridden
          return;
        }
        game.currentGameMode = sub;
        navigateTo("game");
      });
      return;
    }

    if (chosen === "world-where") {
      handleRoundsPopup("world-where", "Rodadas");
      return;
    }

    if (chosen === "world-languages-map") {
      showModePopup("L\u00ednguas", "Escolha como praticar", [
        { label: "Mapa", value: "world-languages", icon: "\uD83D\uDDFA\uFE0F", desc: "Encontre no mapa pelo idioma" },
        { label: "Game", value: "world-languages-game", icon: "\uD83C\uDFAE", desc: "Teste com m\u00faltipla escolha" }
      ], (sub) => {
        game.currentGameMode = sub;
        navigateTo("game");
      });
      return;
    }

    if (chosen === "flag-click-game") {
      handleRoundsPopup("flag-click-game", "Bandeiras");
      return;
    }

    if (chosen === "world-capital-locate") {
      showModePopup("Localizar Capitais", "Escolha a regi\u00e3o", [
        { label: "Mundo", value: "world", icon: "\uD83C\uDF0D", desc: "Todos os pa\u00edses", noRecord: true },
        { label: "\u00c1frica", value: "africa", icon: "\uD83E\uDD81", desc: "Capitais africanas", noRecord: true },
        { label: "Am\u00e9rica do Norte", value: "americas-n", icon: "\uD83D\uDDFD", desc: "Canad\u00e1, EUA, M\u00e9xico...", noRecord: true },
        { label: "Am\u00e9rica Central", value: "americas-c", icon: "\uD83C\uDF34", desc: "Caribe e Am\u00e9rica Central", noRecord: true },
        { label: "Am\u00e9rica do Sul", value: "americas-s", icon: "\u26F0\uFE0F", desc: "Capitais sul-americanas", noRecord: true },
        { label: "Europa", value: "europe", icon: "\uD83C\uDFF0", desc: "Capitais europeias", noRecord: true },
        { label: "\u00c1sia", value: "asia", icon: "\u26E9\uFE0F", desc: "Capitais asi\u00e1ticas", noRecord: true },
        { label: "Oceania", value: "oceania", icon: "\uD83C\uDFDD\uFE0F", desc: "Capitais da Oceania", noRecord: true }
      ], (continent) => {
        game._pendingContinent = continent;
        handleRoundsPopup("world-capital-locate", "Capitais");
      });
      return;
    }

    if (chosen === "population-menu") {
      showModePopup("Popula\u00e7\u00e3o", "Escolha o modo", [
        { label: "Game", value: "world-population", icon: "\uD83C\uDFAE", desc: "Qual pa\u00eds tem mais popula\u00e7\u00e3o?" },
        { label: "Mapa", value: "top-population-map", icon: "\uD83D\uDDFA\uFE0F", desc: "Liste os top pa\u00edses mais populosos", noRecord: true }
      ], (sub) => {
        if (sub === "top-population-map") {
          handleTopRoundsPopup(sub);
        } else {
          game.currentGameMode = sub;
          navigateTo("game");
        }
      });
      return;
    }

    if (chosen === "area-menu") {
      showModePopup("\u00c1rea", "Escolha o modo", [
        { label: "Game", value: "world-area-game", icon: "\uD83C\uDFAE", desc: "Qual pa\u00eds tem mais \u00e1rea?" },
        { label: "Mapa", value: "top-area-map", icon: "\uD83D\uDDFA\uFE0F", desc: "Liste os top pa\u00edses maiores em \u00e1rea", noRecord: true }
      ], (sub) => {
        if (sub === "top-area-map") {
          handleTopRoundsPopup(sub);
        } else {
          game.currentGameMode = sub;
          navigateTo("game");
        }
      });
      return;
    }

    if (chosen === "br-biomes-menu") {
      showModePopup("Brasil", "Escolha o que estudar", [
        { label: "Biomas", value: "br-biomes", icon: "\uD83C\uDF3F", desc: "6 biomas brasileiros" },
        { label: "Vegeta\u00e7\u00e3o", value: "br-vegetation", icon: "\uD83C\uDF33", desc: "Tipos de vegeta\u00e7\u00e3o do Brasil" },
        { label: "Clima", value: "br-climate", icon: "\u2600\uFE0F", desc: "Zonas clim\u00e1ticas do Brasil" }
      ], (sub) => {
        game.currentGameMode = sub;
        navigateTo("game");
      });
      return;
    }

    if (chosen === "br-capital-locate" || chosen === "us-capital-locate") {
      game.currentGameMode = chosen;
      game._pendingRounds = null;
      navigateTo("game");
      return;
    }

    game.currentGameMode = chosen;
    navigateTo("game");
  });
}

// Category card selection
document.querySelectorAll(".category-card").forEach(card => {
  card.addEventListener("click", () => {
    const category = card.dataset.category;
    handleCategoryClick(category);
  });
});

// Render country silhouettes with flags on mode cards
function renderCardSilhouettes() {
  if (!worldMap.features) return;
  const cards = [
    { containerId: "silhouette-card-br", numericId: "76", alpha2: "br" },
    { containerId: "silhouette-card-us", numericId: "840", alpha2: "us" }
  ];
  cards.forEach(({ containerId, numericId, alpha2 }) => {
    const container = document.getElementById(containerId);
    if (!container || container.querySelector("svg")) return;
    const feature = worldMap.features.find(f => String(Number(f.id)) === numericId);
    if (!feature) return;

    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgEl.setAttribute("viewBox", "0 0 80 80");

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    const clipId = "card-clip-" + alpha2;
    clip.setAttribute("id", clipId);

    const projection = alpha2 === "us"
      ? d3.geoAlbersUsa().fitExtent([[4, 4], [76, 76]], feature)
      : d3.geoMercator().fitExtent([[4, 4], [76, 76]], feature);
    const pathGen = d3.geoPath().projection(projection);

    const clipPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    clipPathEl.setAttribute("d", pathGen(feature));
    clip.appendChild(clipPathEl);
    defs.appendChild(clip);
    svgEl.appendChild(defs);

    const imgEl = document.createElementNS("http://www.w3.org/2000/svg", "image");
    imgEl.setAttribute("href", "/flags/" + alpha2 + ".png");
    imgEl.setAttribute("x", "0");
    imgEl.setAttribute("y", "0");
    imgEl.setAttribute("width", "80");
    imgEl.setAttribute("height", "80");
    imgEl.setAttribute("preserveAspectRatio", "xMidYMid slice");
    imgEl.setAttribute("clip-path", "url(#" + clipId + ")");
    svgEl.appendChild(imgEl);

    const outline = document.createElementNS("http://www.w3.org/2000/svg", "path");
    outline.setAttribute("d", pathGen(feature));
    outline.setAttribute("fill", "none");
    outline.setAttribute("stroke", "var(--text-secondary)");
    outline.setAttribute("stroke-width", "1.5");
    svgEl.appendChild(outline);

    container.appendChild(svgEl);
  });
}

document.addEventListener("worldFeaturesReady", renderCardSilhouettes);

// States input
refs.stateInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleStatesGuess();
});
document.getElementById("states-give-up-btn").addEventListener("click", statesGiveUp);

// Skip buttons
document.getElementById("flags-skip-btn").addEventListener("click", flagsSkip);
document.getElementById("capitals-skip-btn").addEventListener("click", capitalsSkip);
document.getElementById("lang-skip-btn").addEventListener("click", langSkipCurrent);

// Click mode buttons
document.getElementById("click-skip-btn").addEventListener("click", () => {
  if (clickState.gameOver || !clickState.currentTarget) return;
  const id = clickState.currentTarget;
  clickState.skipped++;
  clickState.found.add(id);
  game.found.add(id);
  const continent = CONTINENTS[id];
  const color = CONTINENT_COLORS[continent];
  revealCountry(id, color, true);
  continentTracking.found[continent]++;
  updateContinentCount(continent);
  showFeedbackMsg(refs.feedback, "\u27F6 " + COUNTRIES[id], "#d29922");
  nextClickTarget();
});

document.getElementById("click-give-up-btn").addEventListener("click", clickGiveUp);

// Flag click skip
document.getElementById("flag-click-skip").addEventListener("click", skipFlagClick);

// Review button (captures for all modes)
document.getElementById("review-btn").addEventListener("click", handleReviewBtn, true);

// Home screen grid dot effect
(function() {
  const GRID = 25, RADIUS = 160, LERP = 0.06, PUSH = 25;
  const DOT_BASE = 0.9, DOT_GROW = 1.5;

  const canvas = document.getElementById("home-particles");
  const ctx = canvas.getContext("2d");
  const mouse = { x: -9999, y: -9999 };
  let dots = [], raf = null, running = false;

  function rebuild() {
    const homeEl = document.getElementById("home-screen");
    canvas.width = homeEl.offsetWidth;
    canvas.height = homeEl.offsetHeight;
    dots = [];
    const cols = Math.ceil(canvas.width / GRID) + 1;
    const rows = Math.ceil(canvas.height / GRID) + 1;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        dots.push({ bx: c * GRID, by: r * GRID, x: c * GRID, y: r * GRID });
  }

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const dx = mouse.x - d.bx, dy = mouse.y - d.by;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let tx = d.bx, ty = d.by;
      if (dist < RADIUS && dist > 0) {
        const f = 1 - dist / RADIUS, force = f * f * PUSH;
        tx = d.bx - (dx / dist) * force;
        ty = d.by - (dy / dist) * force;
      }
      d.x += (tx - d.x) * LERP;
      d.y += (ty - d.y) * LERP;
      let alpha = 0.12, size = DOT_BASE;
      if (dist < RADIUS) {
        const t = 1 - dist / RADIUS;
        alpha = 0.12 + t * 0.55;
        size = DOT_BASE + t * DOT_GROW;
      }
      ctx.fillStyle = `rgba(232,119,46,${alpha})`;
      const h = size / 2;
      ctx.fillRect(d.x - h, d.y - h, size, size);
    }
    raf = requestAnimationFrame(draw);
  }

  function start() { if (!running) { running = true; rebuild(); draw(); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

  const homeEl = document.getElementById("home-screen");
  homeEl.addEventListener("mousemove", (e) => {
    const r = homeEl.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  homeEl.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });
  window.addEventListener("resize", rebuild);

  // Start/stop based on home screen visibility
  const observer = new MutationObserver(() => {
    if (homeEl.style.display !== "none" && homeEl.style.opacity !== "0") start();
    else stop();
  });
  observer.observe(homeEl, { attributes: true, attributeFilter: ["style"] });
  start();
})();

// Export saveGameRecord for other modules
window.__saveGameRecord = saveGameRecord;

// Auth check and start
(async () => {
  const user = await getCurrentUser();
  trackPageView();
  if (user) {
    if (authState.isAdmin) {
      const adminBtn = document.createElement("button");
      adminBtn.id = "admin-btn";
      adminBtn.textContent = "ADMIN";
      adminBtn.addEventListener("click", () => navigateTo("admin"));
      document.getElementById("top-right-controls").appendChild(adminBtn);
      window.__adminNav = { navigateTo };
    }
    navigateTo("home");
  } else {
    showLoginScreen();
    navigateTo("login");
  }
})();

// Logout button on home screen
const logoutBtn = document.createElement("button");
logoutBtn.id = "logout-btn";
logoutBtn.textContent = "SAIR";
logoutBtn.addEventListener("click", async () => {
  await logout();
  showLoginScreen();
  navigateTo("login");
});
document.getElementById("top-right-controls").appendChild(logoutBtn);

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
