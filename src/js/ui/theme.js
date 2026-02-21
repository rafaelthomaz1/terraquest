import { safeGetItem, safeSetItem } from '../utils/storage.js';

export function initTheme() {
  const themeBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeLabel = document.getElementById("theme-label");

  const savedTheme = safeGetItem("quiz-theme");
  if (savedTheme === "dark") {
    document.body.classList.remove("light");
    themeIcon.textContent = "\uD83C\uDF19";
    themeLabel.textContent = "Modo Escuro";
  }

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    themeIcon.textContent = isLight ? "\u2600\uFE0F" : "\uD83C\uDF19";
    themeLabel.textContent = isLight ? "Modo Claro" : "Modo Escuro";
    safeSetItem("quiz-theme", isLight ? "light" : "dark");
  });
}
