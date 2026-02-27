import { game } from '../state.js';
import { safeGetItem, safeSetItem } from '../utils/storage.js';
import { createEl } from '../utils/dom.js';

const modes = ["learning", "easy", "hard"];
export const modeConfig = {
  learning: { icon: "\uD83E\uDDED", label: "Modo Desbravador", desc: "Sem eliminação — pratique sem pressão e aprenda no seu ritmo", color: "#3b82f6", borderColor: "rgba(59,130,246,0.4)", bgColor: "rgba(59,130,246,0.08)", multiplierLabel: "1x XP" },
  easy: { icon: "\uD83D\uDDFA\uFE0F", label: "Modo Explorador", desc: "Segunda chance nos erros — equilíbrio entre desafio e aprendizado", color: "#22c55e", borderColor: "rgba(34,197,94,0.4)", bgColor: "rgba(34,197,94,0.08)", multiplierLabel: "2x XP" },
  hard: { icon: "\u2694\uFE0F", label: "Modo Aventureiro", desc: "Sem segunda chance — erre e perde. Recompensa máxima!", color: "#f59e0b", borderColor: "rgba(245,158,11,0.4)", bgColor: "rgba(245,158,11,0.08)", multiplierLabel: "4x XP" }
};

export function loadDifficulty() {
  const saved = safeGetItem("quiz-difficulty");
  if (saved && modes.includes(saved)) {
    game.difficulty = saved;
  }
}

export function showDifficultyPopup() {
  return new Promise((resolve) => {
    const overlay = createEl("div", "mode-popup-overlay");
    const card = createEl("div", "difficulty-popup-card");

    const title = createEl("div", "mode-popup-title", "Escolha a Dificuldade");
    card.appendChild(title);

    const subtitle = createEl("div", "mode-popup-subtitle", "A dificuldade fica travada até a próxima partida");
    card.appendChild(subtitle);

    const btnsContainer = createEl("div", "mode-popup-btns");
    const lastChoice = game.difficulty;
    const skipPopup = game.currentGameMode === "world-where" || game.currentGameMode === "world-type";
    if (skipPopup) { resolve(); return; }
    const noEasy = game.currentGameMode === "world-population" || game.currentGameMode === "world-area-game";
    const available = noEasy ? modes.filter(m => m !== "easy") : modes;

    available.forEach((mode) => {
      const cfg = modeConfig[mode];
      const btn = createEl("div", "difficulty-popup-btn");
      if (mode === lastChoice) btn.classList.add("difficulty-popup-btn--active");
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
      btn.style.borderColor = cfg.borderColor;
      btn.style.background = cfg.bgColor;

      const iconEl = createEl("span", "mode-popup-btn-icon", cfg.icon);
      const textWrap = createEl("div", "mode-popup-btn-text");
      const labelEl = createEl("div", "mode-popup-btn-label", cfg.label);
      labelEl.style.color = cfg.color;
      const descEl = createEl("div", "mode-popup-btn-desc", cfg.desc);
      textWrap.appendChild(labelEl);
      textWrap.appendChild(descEl);

      const xpBadge = createEl("span", "difficulty-xp-badge", cfg.multiplierLabel);
      xpBadge.style.background = cfg.bgColor;
      xpBadge.style.color = cfg.color;
      xpBadge.style.borderColor = cfg.borderColor;

      btn.appendChild(iconEl);
      btn.appendChild(textWrap);
      btn.appendChild(xpBadge);

      btn.addEventListener("click", () => {
        game.difficulty = mode;
        safeSetItem("quiz-difficulty", mode);
        overlay.classList.remove("show");
        setTimeout(() => { overlay.remove(); resolve(); }, 300);
      });

      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          btn.click();
        }
      });

      btnsContainer.appendChild(btn);
    });

    card.appendChild(btnsContainer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add("show");
    });
  });
}

export function showDifficultyBadge() {
  const el = document.getElementById("difficulty-badge");
  if (!el) return;
  const diff = game.difficulty || "easy";
  const cfg = modeConfig[diff];
  el.textContent = "";
  el.appendChild(document.createTextNode(cfg.icon + " " + cfg.label));
  el.style.borderColor = cfg.borderColor;
  el.style.background = cfg.bgColor;
  el.style.color = cfg.color;
  el.style.display = "flex";
}

export function hideDifficultyBadge() {
  const el = document.getElementById("difficulty-badge");
  if (el) el.style.display = "none";
}
