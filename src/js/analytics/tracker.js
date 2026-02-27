let currentScreen = null;
let screenEnterTime = null;

function sendScreenTime(screen, duration) {
  if (!screen || duration < 2) return;
  const body = JSON.stringify({ screen, duration: Math.round(duration) });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/screentime', new Blob([body], { type: 'application/json' }));
  } else {
    fetch('/api/analytics/screentime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body,
      keepalive: true
    }).catch(() => {});
  }
}

export function trackPageView() {
  fetch('/api/analytics/pageview', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});
}

export function trackScreenEnter(screen) {
  if (currentScreen && screenEnterTime) {
    const duration = (Date.now() - screenEnterTime) / 1000;
    sendScreenTime(currentScreen, duration);
  }
  currentScreen = screen;
  screenEnterTime = Date.now();
}

window.addEventListener('beforeunload', () => {
  if (currentScreen && screenEnterTime) {
    const duration = (Date.now() - screenEnterTime) / 1000;
    sendScreenTime(currentScreen, duration);
  }
});
