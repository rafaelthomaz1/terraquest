import '../css/styles.css';

import { game, continentTracking, clickState, worldMap, refs, initRefs, whereIsState } from './state.js';
import { COUNTRIES, CONTINENTS, CONTINENT_COLORS } from './data/countries.js';
import { initWorldMap, revealCountry } from './map/world-map.js';
import { initContinentTracking, updateContinentCount } from './ui/score.js';
import { initTheme } from './ui/theme.js';
import { initDifficulty } from './ui/difficulty.js';
import { navigateTo, handleInputKeydown, handleGiveUp, handleReviewBtn } from './ui/navigation.js';
import { handleStatesGuess, statesGiveUp } from './modes/states-mode.js';
import { flagsSkip } from './modes/world-flags.js';
import { capitalsSkip } from './modes/world-capitals.js';
import { langSkipCurrent } from './modes/world-languages.js';
import { clickGiveUp, nextClickTarget } from './modes/world-click.js';
import { showFeedbackMsg } from './utils/dom.js';
import { showModePopup, showGuidelinesPopup } from './ui/mode-popup.js';

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

// Init difficulty toggle
initDifficulty();

// Event listeners
refs.input.addEventListener("keydown", handleInputKeydown);
refs.giveUpBtn.addEventListener("click", handleGiveUp);
refs.restartBtn.addEventListener("click", () => { if (game.currentGameMode) navigateTo("game"); });
refs.restartBtnGo.addEventListener("click", () => { if (game.currentGameMode) navigateTo("game"); });

// Navigation
document.getElementById("play-btn").addEventListener("click", () => navigateTo("select"));
document.getElementById("guidelines-btn").addEventListener("click", () => showGuidelinesPopup());
document.getElementById("back-btn").addEventListener("click", () => navigateTo("home"));
document.getElementById("menu-btn").addEventListener("click", () => navigateTo("select"));
document.getElementById("mode-switch-btn-v").addEventListener("click", () => navigateTo("select"));
document.getElementById("mode-switch-btn-go").addEventListener("click", () => navigateTo("select"));

// Mode card selection
document.querySelectorAll(".mode-card").forEach(card => {
  card.addEventListener("click", () => {
    const mode = card.dataset.mode;
    if (mode === "world-flags" || mode === "world-capitals" || mode === "world-languages") {
      const labels = { "world-flags": "Bandeiras", "world-capitals": "Capitais", "world-languages": "L\u00ednguas" };
      showModePopup(labels[mode], "Escolha como voc\u00ea quer praticar", [
        { label: "Modo Mapa", value: mode, icon: "\uD83D\uDDFA\uFE0F", desc: "Encontre os pa\u00edses no mapa mundial interativo" },
        { label: "Modo Game", value: mode + "-game", icon: "\uD83C\uDFAE", desc: "Teste seu conhecimento com m\u00faltipla escolha" }
      ], (chosen) => {
        game.currentGameMode = chosen;
        navigateTo("game");
      });
      return;
    }
    if (mode === "world-click") {
      showModePopup("Localizar no Mapa", "Escolha o modo de jogo", [
        { label: "Modo Simples", value: "world-click", icon: "\uD83D\uDDFA\uFE0F", desc: "Clique no pa\u00eds correto no mapa", tooltip: "Voc\u00ea deve clicar exatamente no pa\u00eds pedido. Acertou ou errou!" },
        { label: "Modo Menor Dist\u00e2ncia", value: "world-where", icon: "\uD83D\uDCCD", desc: "Clique o mais perto poss\u00edvel do pa\u00eds e ganhe pontos por precis\u00e3o" }
      ], (chosen) => {
        if (chosen === "world-where") {
          showModePopup("Rodadas", "Quantos pa\u00edses por rodada?", [
            { label: "5 pa\u00edses", value: "5", icon: "\u26A1", desc: "Partida r\u00e1pida" },
            { label: "10 pa\u00edses", value: "10", icon: "\uD83C\uDFAF", desc: "Partida m\u00e9dia" },
            { label: "20 pa\u00edses", value: "20", icon: "\uD83C\uDFC6", desc: "Desafio completo" }
          ], (roundsStr) => {
            whereIsState.totalRounds = parseInt(roundsStr);
            game.currentGameMode = chosen;
            navigateTo("game");
          });
          return;
        }
        game.currentGameMode = chosen;
        navigateTo("game");
      });
      return;
    }
    if (mode === "study-br" || mode === "study-us") {
      const isBr = mode === "study-br";
      const country = isBr ? "Brasil" : "EUA";
      const prefix = isBr ? "br" : "us";
      const statesCount = isBr ? "27" : "51";
      showModePopup("Estudar " + country, "Escolha o que praticar", [
        { label: "Estados", value: prefix + "-states", icon: "\uD83D\uDDFA\uFE0F", desc: "Aprenda os " + statesCount + " estados" },
        { label: "Capitais", value: prefix + "-capitals", icon: "\uD83C\uDFDB\uFE0F", desc: "Aprenda as capitais dos " + statesCount + " estados" }
      ], (chosen) => {
        game.currentGameMode = chosen;
        navigateTo("game");
      });
      return;
    }
    game.currentGameMode = mode;
    navigateTo("game");
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

// Review button (captures for all modes)
document.getElementById("review-btn").addEventListener("click", handleReviewBtn, true);

// Home screen particle trail effect
const particleCanvas = document.getElementById("home-particles");
const pCtx = particleCanvas.getContext("2d");
const particles = [];
let particleAnimId = null;

function resizeParticleCanvas() {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}
resizeParticleCanvas();
window.addEventListener("resize", resizeParticleCanvas);

function spawnParticles(x, y) {
  const isLight = document.body.classList.contains("light");
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.8;
    const size = 1.5 + Math.random() * 2.5;
    const life = 0.6 + Math.random() * 0.5;
    const hue = 140 + Math.random() * 30;
    const alpha = isLight ? 0.5 + Math.random() * 0.3 : 0.6 + Math.random() * 0.4;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size, life, maxLife: life, hue, alpha });
  }
}

function animateParticles() {
  pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.016;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    const progress = p.life / p.maxLife;
    const currentAlpha = p.alpha * progress;
    const currentSize = p.size * (0.3 + 0.7 * progress);
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
    pCtx.fillStyle = `hsla(${p.hue}, 70%, 55%, ${currentAlpha})`;
    pCtx.fill();
    if (currentSize > 1.5) {
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, currentSize * 2.5, 0, Math.PI * 2);
      pCtx.fillStyle = `hsla(${p.hue}, 70%, 55%, ${currentAlpha * 0.15})`;
      pCtx.fill();
    }
  }
  particleAnimId = requestAnimationFrame(animateParticles);
}
animateParticles();

document.getElementById("home-screen").addEventListener("mousemove", (e) => {
  spawnParticles(e.clientX, e.clientY);
});

// Start at home screen
navigateTo("home");

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
