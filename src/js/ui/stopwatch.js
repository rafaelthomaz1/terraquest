let interval = null;
let seconds = 0;
let el = null;

function getEl() {
  if (!el) el = document.getElementById("stopwatch");
  return el;
}

function format(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

export function startStopwatch() {
  stopStopwatch();
  seconds = 0;
  const sw = getEl();
  if (sw) {
    sw.textContent = "00:00";
    sw.style.display = "block";
  }
  interval = setInterval(() => {
    seconds++;
    const sw = getEl();
    if (sw) sw.textContent = format(seconds);
  }, 1000);
}

export function stopStopwatch() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

export function resetStopwatch() {
  stopStopwatch();
  seconds = 0;
  const sw = getEl();
  if (sw) {
    sw.textContent = "00:00";
    sw.style.display = "none";
  }
}

export function getElapsedSeconds() {
  return seconds;
}
