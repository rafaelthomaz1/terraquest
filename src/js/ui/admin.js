import { createEl, clearChildren } from '../utils/dom.js';
import { MODE_NAMES } from '../ui/achievements.js';
import { authState } from '../state.js';

let usersPage = 1;
let sessionsPage = 1;

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatTime(seconds) {
  if (!seconds) return '-';
  const s = Number(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

function formatNumber(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(num);
}

async function fetchAdmin(endpoint) {
  const res = await fetch(`/api/admin/${endpoint}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

export async function showAdminScreen() {
  if (!authState.isAdmin) {
    const nav = window.__adminNav;
    if (nav) nav.navigateTo('home');
    return;
  }
  const container = document.getElementById('admin-screen');
  if (!container) return;
  clearChildren(container);
  container.style.display = 'flex';

  const loading = createEl('div', 'admin-loading', 'Carregando dashboard...');
  container.appendChild(loading);

  try {
    const [overviewData, gamesData, screentimeData, geoData] = await Promise.all([
      fetchAdmin('overview'),
      fetchAdmin('games'),
      fetchAdmin('screentime'),
      fetchAdmin('geo'),
    ]);

    clearChildren(container);

    const backBtn = createEl('button', 'admin-back-btn', '\u2190 Voltar');
    backBtn.addEventListener('click', () => hideAdminScreen());
    container.appendChild(backBtn);

    const scroll = createEl('div', 'admin-scroll');

    scroll.appendChild(createEl('div', 'admin-title', 'Dashboard Administrativo'));

    // Overview cards
    buildOverviewCards(scroll, overviewData);

    // Activity chart (30 days)
    buildActivityChart(scroll, overviewData.activity);

    // Games ranking
    buildGamesTable(scroll, gamesData.games);

    // Screen time
    buildScreenTime(scroll, screentimeData.screentime);

    // Geo distribution
    buildGeoGrid(scroll, geoData.geo);

    // Users table (paginated)
    const usersSection = createEl('div', 'admin-section');
    usersSection.id = 'admin-users-section';
    scroll.appendChild(usersSection);
    await loadUsersPage(usersSection, 1);

    // Sessions table (paginated)
    const sessionsSection = createEl('div', 'admin-section');
    sessionsSection.id = 'admin-sessions-section';
    scroll.appendChild(sessionsSection);
    await loadSessionsPage(sessionsSection, 1);

    container.appendChild(scroll);
  } catch (err) {
    clearChildren(container);
    container.appendChild(createEl('div', 'admin-error', 'Erro ao carregar dashboard. Tente novamente.'));
    const backBtn = createEl('button', 'admin-back-btn', '\u2190 Voltar');
    backBtn.addEventListener('click', () => hideAdminScreen());
    container.appendChild(backBtn);
  }
}

export function hideAdminScreen() {
  const el = document.getElementById('admin-screen');
  if (el) el.style.display = 'none';

  const { navigateTo } = window.__adminNav || {};
  if (navigateTo) navigateTo('home');
}

function buildOverviewCards(parent, data) {
  const grid = createEl('div', 'admin-cards-grid');
  const cards = [
    { label: 'Total Usu\u00e1rios', value: formatNumber(data.totals.total_users), today: `+${data.today.users_today} hoje`, icon: '\uD83D\uDC65' },
    { label: 'Total Partidas', value: formatNumber(data.totals.total_games), today: `+${data.today.games_today} hoje`, icon: '\uD83C\uDFAE' },
    { label: 'Page Views', value: formatNumber(data.totals.total_pageviews), today: `+${data.today.pageviews_today} hoje`, icon: '\uD83D\uDC41\uFE0F' },
    { label: 'Logins', value: formatNumber(data.totals.total_logins), today: `+${data.today.logins_today} hoje`, icon: '\uD83D\uDD11' },
  ];
  for (const c of cards) {
    const card = createEl('div', 'admin-overview-card');
    const top = createEl('div', 'admin-card-top');
    top.appendChild(createEl('span', 'admin-card-icon', c.icon));
    top.appendChild(createEl('span', 'admin-card-label', c.label));
    card.appendChild(top);
    card.appendChild(createEl('div', 'admin-card-value', c.value));
    card.appendChild(createEl('div', 'admin-card-today', c.today));
    grid.appendChild(card);
  }
  parent.appendChild(grid);
}

function buildActivityChart(parent, activity) {
  parent.appendChild(createEl('div', 'admin-section-title', 'Atividade (30 dias)'));
  const chart = createEl('div', 'admin-chart');
  if (!activity || activity.length === 0) {
    chart.appendChild(createEl('div', 'admin-empty', 'Sem dados'));
    parent.appendChild(chart);
    return;
  }

  const maxVal = Math.max(...activity.map(d => Math.max(Number(d.pageviews), Number(d.logins), Number(d.games))), 1);

  for (const day of activity) {
    const col = createEl('div', 'admin-chart-col');
    col.title = `${new Date(day.day).toLocaleDateString('pt-BR')} - PV:${day.pageviews} L:${day.logins} G:${day.games}`;

    const bars = createEl('div', 'admin-chart-bars');
    const pvBar = createEl('div', 'admin-bar admin-bar-pv');
    pvBar.style.height = `${(Number(day.pageviews) / maxVal) * 100}%`;
    const lBar = createEl('div', 'admin-bar admin-bar-login');
    lBar.style.height = `${(Number(day.logins) / maxVal) * 100}%`;
    const gBar = createEl('div', 'admin-bar admin-bar-game');
    gBar.style.height = `${(Number(day.games) / maxVal) * 100}%`;
    bars.appendChild(pvBar);
    bars.appendChild(lBar);
    bars.appendChild(gBar);
    col.appendChild(bars);

    const dayLabel = new Date(day.day).getDate();
    if (dayLabel === 1 || dayLabel === 10 || dayLabel === 20) {
      col.appendChild(createEl('span', 'admin-chart-label', String(dayLabel)));
    }
    chart.appendChild(col);
  }

  const legend = createEl('div', 'admin-chart-legend');
  legend.appendChild(createLegendDot('admin-bar-pv', 'Page Views'));
  legend.appendChild(createLegendDot('admin-bar-login', 'Logins'));
  legend.appendChild(createLegendDot('admin-bar-game', 'Partidas'));
  parent.appendChild(chart);
  parent.appendChild(legend);
}

function createLegendDot(barClass, label) {
  const item = createEl('div', 'admin-legend-item');
  item.appendChild(createEl('div', `admin-legend-dot ${barClass}`));
  item.appendChild(createEl('span', null, label));
  return item;
}

function buildGamesTable(parent, games) {
  parent.appendChild(createEl('div', 'admin-section-title', 'Jogos Mais Jogados'));
  if (!games || games.length === 0) {
    parent.appendChild(createEl('div', 'admin-empty', 'Sem dados'));
    return;
  }

  const table = createEl('div', 'admin-table');
  const header = createEl('div', 'admin-table-row admin-table-header admin-6col');
  for (const h of ['Modo', 'Plays', 'Players', 'Avg Score', 'Avg Time', 'XP Total']) {
    header.appendChild(createEl('div', 'admin-table-cell', h));
  }
  table.appendChild(header);

  for (const g of games) {
    const row = createEl('div', 'admin-table-row admin-6col');
    row.appendChild(createEl('div', 'admin-table-cell admin-cell-mode', MODE_NAMES[g.game_mode] || g.game_mode));
    row.appendChild(createEl('div', 'admin-table-cell', String(g.total_plays)));
    row.appendChild(createEl('div', 'admin-table-cell', String(g.unique_players)));
    row.appendChild(createEl('div', 'admin-table-cell', `${g.avg_score_pct}%`));
    row.appendChild(createEl('div', 'admin-table-cell', formatTime(g.avg_time)));
    row.appendChild(createEl('div', 'admin-table-cell', formatNumber(g.total_xp)));
    table.appendChild(row);
  }
  parent.appendChild(table);
}

function buildScreenTime(parent, screentime) {
  parent.appendChild(createEl('div', 'admin-section-title', 'Tempo de Tela'));
  if (!screentime || screentime.length === 0) {
    parent.appendChild(createEl('div', 'admin-empty', 'Sem dados'));
    return;
  }

  const maxTotal = Math.max(...screentime.map(s => Number(s.total_seconds)), 1);
  const wrap = createEl('div', 'admin-screentime');

  for (const s of screentime) {
    const row = createEl('div', 'admin-st-row');
    row.appendChild(createEl('div', 'admin-st-name', s.screen_name));
    const barWrap = createEl('div', 'admin-st-bar-wrap');
    const bar = createEl('div', 'admin-st-bar');
    bar.style.width = `${(Number(s.total_seconds) / maxTotal) * 100}%`;
    barWrap.appendChild(bar);
    row.appendChild(barWrap);
    row.appendChild(createEl('div', 'admin-st-value', `${formatTime(s.total_seconds)} (avg ${formatTime(s.avg_seconds)})`));
    wrap.appendChild(row);
  }
  parent.appendChild(wrap);
}

function buildGeoGrid(parent, geo) {
  parent.appendChild(createEl('div', 'admin-section-title', 'Distribui\u00e7\u00e3o Geogr\u00e1fica'));
  if (!geo || geo.length === 0) {
    parent.appendChild(createEl('div', 'admin-empty', 'Sem dados'));
    return;
  }

  const grid = createEl('div', 'admin-geo-grid');
  for (const g of geo) {
    const card = createEl('div', 'admin-geo-card');
    card.appendChild(createEl('div', 'admin-geo-country', g.country || 'Desconhecido'));
    const info = createEl('div', 'admin-geo-info');
    info.appendChild(createEl('span', null, `\uD83D\uDC41 ${g.pageviews}`));
    info.appendChild(createEl('span', null, `\uD83D\uDD11 ${g.logins}`));
    card.appendChild(info);
    grid.appendChild(card);
  }
  parent.appendChild(grid);
}

async function loadUsersPage(section, page) {
  usersPage = page;
  clearChildren(section);
  section.appendChild(createEl('div', 'admin-section-title', 'Usu\u00e1rios Recentes'));

  try {
    const data = await fetchAdmin(`users?page=${page}&limit=10`);
    const table = createEl('div', 'admin-table');
    const header = createEl('div', 'admin-table-row admin-table-header admin-5col');
    for (const h of ['Nome', 'Email', 'XP', 'Partidas', '\u00daltimo Acesso']) {
      header.appendChild(createEl('div', 'admin-table-cell', h));
    }
    table.appendChild(header);

    for (const u of data.users) {
      const row = createEl('div', 'admin-table-row admin-5col');
      row.appendChild(createEl('div', 'admin-table-cell', u.name || '-'));
      row.appendChild(createEl('div', 'admin-table-cell admin-cell-email', u.email || '-'));
      row.appendChild(createEl('div', 'admin-table-cell', formatNumber(u.total_xp)));
      row.appendChild(createEl('div', 'admin-table-cell', String(u.games_played)));
      row.appendChild(createEl('div', 'admin-table-cell', formatDate(u.last_active)));
      table.appendChild(row);
    }
    section.appendChild(table);

    buildPagination(section, page, Math.ceil(data.total / data.limit), (p) => loadUsersPage(section, p));
  } catch {
    section.appendChild(createEl('div', 'admin-error', 'Erro ao carregar usu\u00e1rios'));
  }
}

async function loadSessionsPage(section, page) {
  sessionsPage = page;
  clearChildren(section);
  section.appendChild(createEl('div', 'admin-section-title', 'Hist\u00f3rico de Login'));

  try {
    const data = await fetchAdmin(`sessions?page=${page}&limit=10`);
    const table = createEl('div', 'admin-table');
    const header = createEl('div', 'admin-table-row admin-table-header admin-5col');
    for (const h of ['Nome', 'M\u00e9todo', 'Pa\u00eds', 'Cidade', 'Data']) {
      header.appendChild(createEl('div', 'admin-table-cell', h));
    }
    table.appendChild(header);

    const METHOD_COLORS = { email: '#3b82f6', google: '#ef4444', register: '#22c55e' };

    for (const s of data.sessions) {
      const row = createEl('div', 'admin-table-row admin-5col');
      row.appendChild(createEl('div', 'admin-table-cell', s.name || '-'));
      const methodCell = createEl('div', 'admin-table-cell');
      const badge = createEl('span', 'admin-method-badge', s.method || '-');
      badge.style.background = `${METHOD_COLORS[s.method] || '#6b7280'}22`;
      badge.style.color = METHOD_COLORS[s.method] || '#6b7280';
      badge.style.border = `1px solid ${METHOD_COLORS[s.method] || '#6b7280'}44`;
      methodCell.appendChild(badge);
      row.appendChild(methodCell);
      row.appendChild(createEl('div', 'admin-table-cell', s.country || '-'));
      row.appendChild(createEl('div', 'admin-table-cell', s.city || '-'));
      row.appendChild(createEl('div', 'admin-table-cell', formatDate(s.created_at)));
      table.appendChild(row);
    }
    section.appendChild(table);

    buildPagination(section, page, Math.ceil(data.total / data.limit), (p) => loadSessionsPage(section, p));
  } catch {
    section.appendChild(createEl('div', 'admin-error', 'Erro ao carregar sess\u00f5es'));
  }
}

function buildPagination(parent, current, totalPages, onPage) {
  if (totalPages <= 1) return;
  const nav = createEl('div', 'admin-pagination');

  if (current > 1) {
    const prev = createEl('button', 'admin-page-btn', '\u2190');
    prev.addEventListener('click', () => onPage(current - 1));
    nav.appendChild(prev);
  }

  nav.appendChild(createEl('span', 'admin-page-info', `${current} / ${totalPages}`));

  if (current < totalPages) {
    const next = createEl('button', 'admin-page-btn', '\u2192');
    next.addEventListener('click', () => onPage(current + 1));
    nav.appendChild(next);
  }

  parent.appendChild(nav);
}
