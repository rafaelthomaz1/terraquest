import { safeGetItem, safeSetItem } from '../utils/storage.js';

export function initTheme() {
  const themeBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeLabel = document.getElementById("theme-label");

  const savedTheme = safeGetItem("quiz-theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeIcon.textContent = "\u2600\uFE0F";
    themeLabel.textContent = "Light Mode";
  }

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    themeIcon.textContent = isLight ? "\u2600\uFE0F" : "\uD83C\uDF19";
    themeLabel.textContent = isLight ? "Light Mode" : "Dark Mode";
    safeSetItem("quiz-theme", isLight ? "light" : "dark");
  });
}
