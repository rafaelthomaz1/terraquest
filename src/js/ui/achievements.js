import { createEl, clearChildren } from '../utils/dom.js';
import { authState, game } from '../state.js';

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
  4000, 5000, 6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000,
  26000, 30500, 35500, 41000, 47500, 55000, 63500, 73000, 84000, 96000,
  110000, 126000, 144000, 165000, 189000, 216000, 247000, 282000, 322000, 368000,
  420000, 479000, 546000, 622000, 709000, 808000, 920000, 1048000, 1194000, 1360000
];

const LEVEL_TITLES = {
  1: "Iniciante", 6: "Estudante", 11: "Explorador",
  16: "Ge\u00f3grafo", 21: "Especialista", 26: "Mestre",
  31: "Gr\u00e3o-Mestre", 41: "Lenda"
};

export function getLevel(xp) {
  let lvl = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
    else break;
  }
  return lvl;
}

export function getLevelTitle(lvl) {
  let title = "Iniciante";
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => a - b);
  for (const k of keys) {
    if (lvl >= k) title = LEVEL_TITLES[k];
  }
  return title;
}

export function getLevelProgress(xp) {
  const lvl = getLevel(xp);
  const cur = LEVEL_THRESHOLDS[lvl - 1] || 0;
  const next = LEVEL_THRESHOLDS[lvl] || cur + 1000;
  const pct = Math.min(((xp - cur) / (next - cur)) * 100, 100);
  return { lvl, cur, next, pct };
}

export const MODE_NAMES = {
  "world-type": "Nomear Pa\u00edses",
  "world-click": "Localizar no Mapa",
  "world-flags": "Bandeiras (Mapa)",
  "world-capitals": "Capitais (Mapa)",
  "world-languages": "Idiomas (Mapa)",
  "world-walk": "Rota entre Fronteiras",
  "br-states": "Estados BR",
  "br-capitals": "Capitais BR",
  "us-states": "Estados EUA",
  "us-capitals": "Capitais EUA",
  "world-silhouettes": "Silhuetas",
  "world-population": "Popula\u00e7\u00e3o",
  "world-area-game": "\u00c1rea",
  "world-where": "Onde \u00c9?",
  "world-flags-game": "Bandeiras (Game)",
  "world-capitals-game": "Capitais (Game)",
  "world-languages-game": "Idiomas (Game)",
  "landmarks-game": "Pontos Tur\u00edsticos",
  "flag-click-game": "Clicar na Bandeira",
  "world-capital-locate": "Localizar Capitais",
  "br-capital-locate": "Capitais BR (Loc.)",
  "us-capital-locate": "Capitais EUA (Loc.)",
  "br-biomes": "Biomas BR",
  "br-vegetation": "Vegeta\u00e7\u00e3o BR",
  "br-climate": "Clima BR",
  "top-population-map": "Top Popula\u00e7\u00e3o",
  "top-area-map": "Top \u00c1rea"
};

const SKILL_CATEGORIES = {
  "Mapas": { icon: "\uD83C\uDF0D", modes: ["world-type", "world-click"] },
  "Bandeiras": { icon: "\uD83C\uDFF3\uFE0F", modes: ["world-flags", "world-flags-game", "flag-click-game"] },
  "Capitais": { icon: "\uD83C\uDFDB\uFE0F", modes: ["world-capitals", "world-capitals-game"] },
  "Idiomas": { icon: "\uD83D\uDDE3\uFE0F", modes: ["world-languages", "world-languages-game"] },
  "Desafios": { icon: "\uD83C\uDFAF", modes: ["world-silhouettes", "world-population", "world-area-game", "world-where"] },
  "Brasil & EUA": { icon: "\uD83D\uDDFA\uFE0F", modes: ["br-states", "br-capitals", "us-states", "us-capitals"] }
};

const CATEGORY_FOR_MODE = {};
for (const [cat, data] of Object.entries(SKILL_CATEGORIES)) {
  for (const m of data.modes) CATEGORY_FOR_MODE[m] = cat;
}

const ACHIEVEMENTS = [
  { id: "first-step", name: "Primeiro Passo", icon: "\uD83D\uDC63", desc: "Completou seu primeiro jogo!", hint: "Complete seu primeiro jogo", category: "geral",
    check: s => ({ unlocked: s.overall.total_games >= 1, progress: Math.min(s.overall.total_games, 1), total: 1 }) },
  { id: "curious", name: "Curioso", icon: "\uD83D\uDD0D", desc: "Jogou 3 modos diferentes!", hint: "Jogue 3 modos diferentes", category: "geral",
    check: s => ({ unlocked: s.overall.modes_played >= 3, progress: Math.min(s.overall.modes_played, 3), total: 3 }) },
  { id: "explorer", name: "Explorador", icon: "\uD83E\uDDED", desc: "Jogou pelo menos 1 modo de cada categoria!", hint: "Jogue pelo menos 1 modo de cada categoria", category: "geral",
    check: s => {
      const cats = new Set();
      for (const ms of s.modeStats) { if (CATEGORY_FOR_MODE[ms.game_mode]) cats.add(CATEGORY_FOR_MODE[ms.game_mode]); }
      return { unlocked: cats.size >= 6, progress: cats.size, total: 6 };
    } },
  { id: "cartographer-jr", name: "Cart\u00f3grafo Jr", icon: "\uD83D\uDDFA\uFE0F", desc: "Encontrou 50 pa\u00edses digitando!", hint: "Encontre 50 pa\u00edses digitando", category: "mapas",
    check: s => { const m = s.modeMap["world-type"]; const sc = m?.best_score || 0; return { unlocked: sc >= 50, progress: Math.min(sc, 50), total: 50 }; } },
  { id: "cartographer", name: "Cart\u00f3grafo", icon: "\uD83C\uDF10", desc: "Encontrou 100 pa\u00edses digitando!", hint: "Encontre 100 pa\u00edses digitando", category: "mapas",
    check: s => { const m = s.modeMap["world-type"]; const sc = m?.best_score || 0; return { unlocked: sc >= 100, progress: Math.min(sc, 100), total: 100 }; } },
  { id: "map-master", name: "Mestre dos Mapas", icon: "\uD83C\uDFC6", desc: "Encontrou todos os 195 pa\u00edses digitando!", hint: "Encontre todos os 195 pa\u00edses digitando", category: "mapas",
    check: s => { const m = s.modeMap["world-type"]; const sc = m?.best_score || 0; return { unlocked: sc >= 195, progress: Math.min(sc, 195), total: 195 }; } },
  { id: "sharp-eye", name: "Olho Vivo", icon: "\uD83D\uDC41\uFE0F", desc: "Identificou 50 bandeiras!", hint: "Identifique 50 bandeiras", category: "bandeiras",
    check: s => { const m = s.modeMap["world-flags"]; const sc = m?.best_score || 0; return { unlocked: sc >= 50, progress: Math.min(sc, 50), total: 50 }; } },
  { id: "vexillologist", name: "Vexil\u00f3logo", icon: "\uD83C\uDF8C", desc: "Identificou todas as 195 bandeiras!", hint: "Identifique todas as 195 bandeiras", category: "bandeiras",
    check: s => { const m = s.modeMap["world-flags"]; const sc = m?.best_score || 0; return { unlocked: sc >= 195, progress: Math.min(sc, 195), total: 195 }; } },
  { id: "capital-jr", name: "Capital Jr", icon: "\uD83C\uDFDB\uFE0F", desc: "Acertou 50 capitais!", hint: "Acerte 50 capitais", category: "capitais",
    check: s => { const m = s.modeMap["world-capitals"]; const sc = m?.best_score || 0; return { unlocked: sc >= 50, progress: Math.min(sc, 50), total: 50 }; } },
  { id: "diplomat", name: "Diplomata", icon: "\uD83C\uDFA9", desc: "Acertou todas as 195 capitais!", hint: "Acerte todas as 195 capitais", category: "capitais",
    check: s => { const m = s.modeMap["world-capitals"]; const sc = m?.best_score || 0; return { unlocked: sc >= 195, progress: Math.min(sc, 195), total: 195 }; } },
  { id: "polyglot", name: "Poliglota", icon: "\uD83D\uDCAC", desc: "Completou todos os pa\u00edses de um idioma!", hint: "Complete todos os pa\u00edses de um idioma", category: "idiomas",
    check: s => { const m = s.modeMap["world-languages"]; const sc = m?.best_score || 0; const t = m?.best_total || 1; return { unlocked: sc > 0 && sc >= t, progress: sc, total: t }; } },
  { id: "good-streak", name: "Boa Sequ\u00eancia", icon: "\uD83D\uDD25", desc: "Conseguiu sequ\u00eancia de 10!", hint: "Consiga sequ\u00eancia de 10 em qualquer modo", category: "streak",
    check: s => { const best = getMaxStreak(s); return { unlocked: best >= 10, progress: Math.min(best, 10), total: 10 }; } },
  { id: "on-fire", name: "Em Chamas", icon: "\uD83D\uDCA5", desc: "Conseguiu sequ\u00eancia de 25!", hint: "Consiga sequ\u00eancia de 25", category: "streak",
    check: s => { const best = getMaxStreak(s); return { unlocked: best >= 25, progress: Math.min(best, 25), total: 25 }; } },
  { id: "unstoppable", name: "Imbat\u00edvel", icon: "\u26A1", desc: "Conseguiu sequ\u00eancia de 50!", hint: "Consiga sequ\u00eancia de 50", category: "streak",
    check: s => { const best = getMaxStreak(s); return { unlocked: best >= 50, progress: Math.min(best, 50), total: 50 }; } },
  { id: "legendary", name: "Lend\u00e1rio", icon: "\uD83D\uDC51", desc: "Conseguiu sequ\u00eancia de 100!", hint: "Consiga sequ\u00eancia de 100", category: "streak",
    check: s => { const best = getMaxStreak(s); return { unlocked: best >= 100, progress: Math.min(best, 100), total: 100 }; } },
  { id: "lightning", name: "Rel\u00e2mpago", icon: "\u23F1\uFE0F", desc: "Completou um modo rapidamente com 80%+!", hint: "Complete um modo com 80%+ em menos de 10min", category: "speed",
    check: s => {
      for (const ms of s.modeStats) {
        if (ms.best_total > 0 && (ms.best_score / ms.best_total) >= 0.8 && ms.best_time && ms.best_time < 600) return { unlocked: true, progress: 1, total: 1 };
      }
      return { unlocked: false, progress: 0, total: 1 };
    } },
  { id: "speed-runner", name: "Speed Runner", icon: "\uD83C\uDFCE\uFE0F", desc: "Completou 195 pa\u00edses em menos de 15min!", hint: "Complete 195 pa\u00edses em menos de 15 minutos", category: "speed",
    check: s => { const m = s.modeMap["world-type"]; return { unlocked: m?.best_score >= 195 && m?.best_time < 900, progress: m?.best_score >= 195 && m?.best_time < 900 ? 1 : 0, total: 1 }; } },
  { id: "consistent", name: "Consistente", icon: "\uD83D\uDCC5", desc: "Jogou 5 dias seguidos!", hint: "Jogue 5 dias seguidos", category: "dedicacao",
    check: s => ({ unlocked: s.streak >= 5, progress: Math.min(s.streak, 5), total: 5 }) },
  { id: "dedicated", name: "Dedicado", icon: "\uD83D\uDCAA", desc: "Jogou 10 dias seguidos!", hint: "Jogue 10 dias seguidos", category: "dedicacao",
    check: s => ({ unlocked: s.streak >= 10, progress: Math.min(s.streak, 10), total: 10 }) },
  { id: "unshakable", name: "Inabal\u00e1vel", icon: "\uD83C\uDFD4\uFE0F", desc: "Jogou 30 dias seguidos!", hint: "Jogue 30 dias seguidos", category: "dedicacao",
    check: s => ({ unlocked: s.streak >= 30, progress: Math.min(s.streak, 30), total: 30 }) },
  { id: "marathoner", name: "Maratonista", icon: "\uD83C\uDFC3", desc: "Completou 100 partidas!", hint: "Complete 100 partidas", category: "geral",
    check: s => ({ unlocked: s.overall.total_games >= 100, progress: Math.min(s.overall.total_games, 100), total: 100 }) },
  { id: "veteran", name: "Veterano", icon: "\uD83C\uDF96\uFE0F", desc: "Completou 500 partidas!", hint: "Complete 500 partidas", category: "geral",
    check: s => ({ unlocked: s.overall.total_games >= 500, progress: Math.min(s.overall.total_games, 500), total: 500 }) },
  { id: "brasileiro", name: "Brasileiro", icon: "\uD83C\uDDE7\uD83C\uDDF7", desc: "Encontrou todos os 27 estados!", hint: "Encontre todos os 27 estados brasileiros", category: "regional",
    check: s => { const m = s.modeMap["br-states"]; const sc = m?.best_score || 0; return { unlocked: sc >= 27, progress: Math.min(sc, 27), total: 27 }; } },
  { id: "americanist", name: "Americanista", icon: "\uD83C\uDDFA\uD83C\uDDF8", desc: "Encontrou todos os 51 estados!", hint: "Encontre todos os 51 estados americanos", category: "regional",
    check: s => { const m = s.modeMap["us-states"]; const sc = m?.best_score || 0; return { unlocked: sc >= 51, progress: Math.min(sc, 51), total: 51 }; } },
  { id: "eagle-eye", name: "Olho de \u00c1guia", icon: "\uD83E\uDD85", desc: "Marcou 5000+ pontos no Onde \u00c9?!", hint: "Marque 5000+ pontos no Onde \u00c9?", category: "desafios",
    check: s => { const m = s.modeMap["world-where"]; const sc = m?.best_score || 0; return { unlocked: sc >= 5000, progress: Math.min(sc, 5000), total: 5000 }; } },
  { id: "silhouette-master", name: "Silhueta Mestre", icon: "\uD83C\uDFAD", desc: "Sequ\u00eancia 20 em Silhuetas!", hint: "Consiga sequ\u00eancia 20 em Silhuetas", category: "desafios",
    check: s => { const m = s.modeMap["world-silhouettes"]; const sc = m?.best_score || 0; return { unlocked: sc >= 20, progress: Math.min(sc, 20), total: 20 }; } },
  { id: "demographer", name: "Dem\u00f3grafo", icon: "\uD83D\uDCCA", desc: "Sequ\u00eancia 20 em Popula\u00e7\u00e3o!", hint: "Consiga sequ\u00eancia 20 em Popula\u00e7\u00e3o", category: "desafios",
    check: s => { const m = s.modeMap["world-population"]; const sc = m?.best_score || 0; return { unlocked: sc >= 20, progress: Math.min(sc, 20), total: 20 }; } },
  { id: "xp-beginner", name: "XP Iniciante", icon: "\u2B50", desc: "Acumulou 500 XP!", hint: "Acumule 500 XP", category: "xp",
    check: s => ({ unlocked: s.totalXP >= 500, progress: Math.min(s.totalXP, 500), total: 500 }) },
  { id: "xp-advanced", name: "XP Avan\u00e7ado", icon: "\uD83C\uDF1F", desc: "Acumulou 5.000 XP!", hint: "Acumule 5.000 XP", category: "xp",
    check: s => ({ unlocked: s.totalXP >= 5000, progress: Math.min(s.totalXP, 5000), total: 5000 }) },
  { id: "xp-master", name: "XP Mestre", icon: "\u2728", desc: "Acumulou 20.000 XP!", hint: "Acumule 20.000 XP", category: "xp",
    check: s => ({ unlocked: s.totalXP >= 20000, progress: Math.min(s.totalXP, 20000), total: 20000 }) },
  { id: "collector", name: "Colecionador", icon: "\uD83C\uDFC5", desc: "Desbloqueou 15 conquistas!", hint: "Desbloqueie 15 conquistas", category: "meta",
    check: () => ({ unlocked: false, progress: 0, total: 15 }) },
  { id: "geography-legend", name: "Lenda da Geografia", icon: "\uD83C\uDF0D", desc: "Desbloqueou todas as conquistas!", hint: "Desbloqueie todas as conquistas", category: "meta",
    check: () => ({ unlocked: false, progress: 0, total: 32 }) }
];

const STREAK_MODE_IDS = [
  "world-silhouettes", "world-population", "world-area-game",
  "world-flags-game", "world-capitals-game", "world-languages-game", "landmarks-game"
];

function getMaxStreak(s) {
  let max = 0;
  for (const mode of STREAK_MODE_IDS) {
    const m = s.modeMap[mode];
    if (m && m.best_score > max) max = m.best_score;
  }
  return max;
}

function calculateStreak(playDates) {
  if (!playDates || playDates.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  if (playDates[0] !== todayStr && playDates[0] !== yesterdayStr) return 0;

  let streak = 1;
  let expected = new Date(playDates[0]);
  for (let i = 1; i < playDates.length; i++) {
    expected.setDate(expected.getDate() - 1);
    const expStr = expected.toISOString().slice(0, 10);
    if (playDates[i] === expStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function computeAchievements(stats) {
  const results = [];
  let unlockedCount = 0;
  for (const ach of ACHIEVEMENTS) {
    if (ach.id === "collector" || ach.id === "geography-legend") continue;
    const r = ach.check(stats);
    if (r.unlocked) unlockedCount++;
    results.push({ ...ach, ...r });
  }
  // Collector
  const collectorAch = ACHIEVEMENTS.find(a => a.id === "collector");
  const collectorResult = { unlocked: unlockedCount >= 15, progress: Math.min(unlockedCount, 15), total: 15 };
  if (collectorResult.unlocked) unlockedCount++;
  results.push({ ...collectorAch, ...collectorResult });

  // Geography legend
  const legendAch = ACHIEVEMENTS.find(a => a.id === "geography-legend");
  const legendResult = { unlocked: unlockedCount >= 31, progress: unlockedCount, total: 31 };
  results.push({ ...legendAch, ...legendResult });

  return results;
}

function computeSkills(modeStats) {
  const modeMap = {};
  for (const ms of modeStats) modeMap[ms.game_mode] = ms;

  const skills = {};
  for (const [cat, data] of Object.entries(SKILL_CATEGORIES)) {
    let sum = 0, count = 0;
    for (const mode of data.modes) {
      const ms = modeMap[mode];
      if (ms && ms.best_total > 0) {
        sum += ms.best_score / ms.best_total;
        count++;
      }
    }
    skills[cat] = { icon: data.icon, pct: count > 0 ? Math.round((sum / count) * 100) : 0, played: count > 0 };
  }
  return skills;
}

function formatTime(seconds) {
  if (!seconds) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

export async function showAchievementsScreen() {
  const container = document.getElementById("achievements-screen");
  if (!container) return;
  clearChildren(container);
  container.style.display = "flex";

  const loading = createEl("div", "ach-loading", "Carregando...");
  container.appendChild(loading);

  let data;
  try {
    const res = await fetch('/api/records/stats', { credentials: 'include' });
    if (!res.ok) throw new Error('Erro ao carregar stats');
    data = await res.json();
  } catch {
    clearChildren(container);
    container.appendChild(createEl("div", "ach-error", "Erro ao carregar dados. Tente novamente."));
    const backBtn = createEl("button", "ach-back-btn", "\u2190 Voltar");
    backBtn.addEventListener("click", () => { container.style.display = "none"; });
    container.appendChild(backBtn);
    return;
  }

  clearChildren(container);

  const { totalXP, modeStats, overall, playDates } = data;
  const modeMap = {};
  for (const ms of modeStats) modeMap[ms.game_mode] = ms;

  const streak = calculateStreak(playDates);
  const stats = { totalXP, modeStats, modeMap, overall: overall || { total_games: 0, total_time: 0, modes_played: 0 }, streak, playDates };
  const { lvl, pct, cur, next } = getLevelProgress(totalXP);
  const title = getLevelTitle(lvl);
  const achievements = computeAchievements(stats);
  const skills = computeSkills(modeStats);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Scroll wrapper
  const scroll = createEl("div", "ach-scroll");

  // Back button
  const backBtn = createEl("button", "ach-back-btn", "\u2190 Voltar");
  backBtn.addEventListener("click", () => {
    container.style.display = "none";
    game.currentScreen = "home";
    document.getElementById("home-screen").style.display = "flex";
    const achBtn = document.getElementById("achievements-btn");
    if (achBtn && authState.currentUser && !authState.isGuest) achBtn.style.display = "flex";
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.style.display = "";
  });
  container.appendChild(backBtn);

  // Header
  const header = createEl("div", "ach-header");
  const avatarWrap = createEl("div", "ach-avatar-wrap");
  const initial = authState.currentUser?.name?.charAt(0)?.toUpperCase() || "?";
  avatarWrap.appendChild(createEl("div", "ach-avatar", initial));
  header.appendChild(avatarWrap);

  const headerInfo = createEl("div", "ach-header-info");
  headerInfo.appendChild(createEl("div", "ach-username", authState.currentUser?.name || "Jogador"));
  headerInfo.appendChild(createEl("div", "ach-level-title", `N\u00edvel ${lvl} \u2014 ${title}`));

  const xpBar = createEl("div", "ach-xp-bar-wrap");
  const xpTrack = createEl("div", "ach-xp-track");
  const xpFill = createEl("div", "ach-xp-fill");
  xpFill.style.width = `${pct}%`;
  xpTrack.appendChild(xpFill);
  xpBar.appendChild(xpTrack);
  xpBar.appendChild(createEl("span", "ach-xp-label", `${formatNumber(totalXP)} / ${formatNumber(next)} XP`));
  headerInfo.appendChild(xpBar);

  const statsRow = createEl("div", "ach-stats-row");
  statsRow.appendChild(createStatCard("\uD83C\uDFAE", stats.overall.total_games, "Partidas"));
  statsRow.appendChild(createStatCard("\u23F1\uFE0F", formatTime(stats.overall.total_time), "Tempo Total"));
  statsRow.appendChild(createStatCard("\uD83D\uDD25", `${streak} dia${streak !== 1 ? 's' : ''}`, "Sequ\u00eancia"));
  statsRow.appendChild(createStatCard("\uD83C\uDFC5", `${unlockedCount}/${achievements.length}`, "Conquistas"));
  headerInfo.appendChild(statsRow);

  header.appendChild(headerInfo);
  scroll.appendChild(header);

  // Streak motivational
  if (streak > 0) {
    const streakMsg = createEl("div", "ach-streak-msg");
    streakMsg.appendChild(createEl("span", "ach-streak-fire", "\uD83D\uDD25"));
    streakMsg.appendChild(createEl("span", null, `Sequ\u00eancia de ${streak} dia${streak !== 1 ? 's' : ''}! N\u00e3o perca amanh\u00e3!`));
    scroll.appendChild(streakMsg);
  }

  // Skills section
  scroll.appendChild(createEl("div", "ach-section-title", "Habilidades"));
  const skillsGrid = createEl("div", "ach-skills-grid");
  for (const [cat, skill] of Object.entries(skills)) {
    const item = createEl("div", "ach-skill-item");
    const skillHeader = createEl("div", "ach-skill-header");
    skillHeader.appendChild(createEl("span", "ach-skill-icon", skill.icon));
    skillHeader.appendChild(createEl("span", "ach-skill-name", cat));
    skillHeader.appendChild(createEl("span", "ach-skill-pct", skill.played ? `${skill.pct}%` : "-"));
    item.appendChild(skillHeader);

    const track = createEl("div", "ach-skill-track");
    const fill = createEl("div", "ach-skill-fill");
    fill.style.width = `${skill.pct}%`;
    track.appendChild(fill);
    item.appendChild(track);
    skillsGrid.appendChild(item);
  }
  scroll.appendChild(skillsGrid);

  // Mode stats section
  scroll.appendChild(createEl("div", "ach-section-title", "Desempenho por Modo"));
  const modesGrid = createEl("div", "ach-modes-grid");
  if (modeStats.length === 0) {
    modesGrid.appendChild(createEl("div", "ach-empty-msg", "Jogue algumas partidas para ver suas estat\u00edsticas aqui!"));
  } else {
    for (const ms of modeStats) {
      const card = createEl("div", "ach-mode-card");
      card.appendChild(createEl("div", "ach-mode-name", MODE_NAMES[ms.game_mode] || ms.game_mode));
      const info = createEl("div", "ach-mode-info");
      info.appendChild(createModeRow("\uD83C\uDFC6", `${ms.best_score}/${ms.best_total}`));
      info.appendChild(createModeRow("\u23F1\uFE0F", formatTime(ms.best_time)));
      info.appendChild(createModeRow("\uD83C\uDFAE", `${ms.games_played}x`));
      info.appendChild(createModeRow("\u2B50", `${ms.mode_xp || 0} XP`));
      card.appendChild(info);
      const pctVal = ms.best_total > 0 ? Math.round((ms.best_score / ms.best_total) * 100) : 0;
      const modeTrack = createEl("div", "ach-mode-track");
      const modeFill = createEl("div", "ach-mode-fill");
      modeFill.style.width = `${pctVal}%`;
      modeTrack.appendChild(modeFill);
      card.appendChild(modeTrack);
      modesGrid.appendChild(card);
    }
  }
  scroll.appendChild(modesGrid);

  // Next objectives section
  const upcoming = achievements.filter(a => !a.unlocked).sort((a, b) => (b.progress / b.total) - (a.progress / a.total)).slice(0, 3);
  if (upcoming.length > 0) {
    scroll.appendChild(createEl("div", "ach-section-title", "Pr\u00f3ximos Objetivos"));
    const nextGrid = createEl("div", "ach-next-grid");
    for (const a of upcoming) {
      const item = createEl("div", "ach-next-item");
      item.appendChild(createEl("span", "ach-next-icon", a.icon));
      const info = createEl("div", "ach-next-info");
      info.appendChild(createEl("div", "ach-next-name", a.name));
      info.appendChild(createEl("div", "ach-next-hint", a.hint));
      const track = createEl("div", "ach-next-track");
      const fill = createEl("div", "ach-next-fill");
      const nextPct = a.total > 0 ? Math.round((a.progress / a.total) * 100) : 0;
      fill.style.width = `${nextPct}%`;
      track.appendChild(fill);
      info.appendChild(track);
      info.appendChild(createEl("div", "ach-next-progress", `${a.progress}/${a.total} \u2014 ${nextPct}%`));
      item.appendChild(info);
      nextGrid.appendChild(item);
    }
    scroll.appendChild(nextGrid);
  }

  // Recommendations
  const recs = getRecommendations(skills, achievements, stats);
  if (recs.length > 0) {
    scroll.appendChild(createEl("div", "ach-section-title", "Recomenda\u00e7\u00f5es"));
    const recsList = createEl("div", "ach-recs");
    for (const rec of recs) {
      recsList.appendChild(createEl("div", "ach-rec-item", rec));
    }
    scroll.appendChild(recsList);
  }

  // Achievements section
  scroll.appendChild(createEl("div", "ach-section-title", `Conquistas (${unlockedCount}/${achievements.length})`));
  const achGrid = createEl("div", "ach-badges-grid");
  // Show unlocked first, then locked
  const sorted = [...achievements].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));
  for (const a of sorted) {
    const badge = createEl("div", a.unlocked ? "ach-badge ach-badge--unlocked" : "ach-badge ach-badge--locked");
    badge.appendChild(createEl("div", "ach-badge-icon", a.unlocked ? a.icon : "\uD83D\uDD12"));
    badge.appendChild(createEl("div", "ach-badge-name", a.name));

    // Tooltip
    const tooltip = createEl("div", "ach-badge-tooltip");
    if (a.unlocked) {
      tooltip.appendChild(createEl("div", "ach-tooltip-title", `${a.icon} ${a.name}`));
      tooltip.appendChild(createEl("div", "ach-tooltip-desc", a.desc));
    } else {
      tooltip.appendChild(createEl("div", "ach-tooltip-title", `\uD83D\uDD12 ${a.name}`));
      tooltip.appendChild(createEl("div", "ach-tooltip-hint", a.hint));
      const tipTrack = createEl("div", "ach-tooltip-track");
      const tipFill = createEl("div", "ach-tooltip-fill");
      const tipPct = a.total > 0 ? Math.round((a.progress / a.total) * 100) : 0;
      tipFill.style.width = `${tipPct}%`;
      tipTrack.appendChild(tipFill);
      tooltip.appendChild(tipTrack);
      tooltip.appendChild(createEl("div", "ach-tooltip-progress", `${a.progress}/${a.total} \u2014 ${tipPct}%`));
    }
    badge.appendChild(tooltip);
    achGrid.appendChild(badge);
  }
  scroll.appendChild(achGrid);

  container.appendChild(scroll);
}

function createStatCard(icon, value, label) {
  const card = createEl("div", "ach-stat-card");
  card.appendChild(createEl("div", "ach-stat-icon", icon));
  card.appendChild(createEl("div", "ach-stat-value", String(value)));
  card.appendChild(createEl("div", "ach-stat-label", label));
  return card;
}

function createModeRow(icon, text) {
  const row = createEl("div", "ach-mode-row");
  row.appendChild(createEl("span", "ach-mode-row-icon", icon));
  row.appendChild(createEl("span", null, text));
  return row;
}

function getRecommendations(skills, achievements, stats) {
  const recs = [];
  // Best skill
  let bestCat = null, bestPct = 0;
  let worstCat = null, worstPct = 101;
  for (const [cat, skill] of Object.entries(skills)) {
    if (skill.played && skill.pct > bestPct) { bestPct = skill.pct; bestCat = cat; }
    if (skill.pct < worstPct) { worstPct = skill.pct; worstCat = cat; }
  }
  if (bestCat) recs.push(`\uD83C\uDFC6 Voc\u00ea se destaca em: ${bestCat} (${bestPct}%)`);

  // Closest achievement
  const closest = achievements.filter(a => !a.unlocked && a.total > 0).sort((a, b) => (b.progress / b.total) - (a.progress / a.total))[0];
  if (closest) {
    const remaining = closest.total - closest.progress;
    recs.push(`\uD83C\uDFAF Quase l\u00e1: ${closest.name} \u2014 faltam ${remaining}!`);
  }

  // Unexplored
  if (worstCat && !skills[worstCat].played) {
    recs.push(`\uD83E\uDDED Experimente: ${worstCat}`);
  }

  return recs;
}

export function hideAchievementsScreen() {
  const el = document.getElementById("achievements-screen");
  if (el) el.style.display = "none";
}
