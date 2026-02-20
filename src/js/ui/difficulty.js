import { game } from '../state.js';
import { safeGetItem, safeSetItem } from '../utils/storage.js';

const modes = ["easy", "hard", "learning"];
const labels = { easy: "\uD83D\uDFE2 Modo F\u00e1cil", hard: "\uD83D\uDD34 Modo Dif\u00edcil", learning: "\uD83D\uDCD6 Aprendizado" };

export function initDifficulty() {
  const btn = document.getElementById("difficulty-toggle");
  const label = document.getElementById("difficulty-label");

  const saved = safeGetItem("quiz-difficulty");
  if (saved && modes.includes(saved)) {
    game.difficulty = saved;
    label.textContent = labels[saved];
  }

  btn.addEventListener("click", () => {
    const idx = (modes.indexOf(game.difficulty) + 1) % modes.length;
    game.difficulty = modes[idx];
    label.textContent = labels[game.difficulty];
    safeSetItem("quiz-difficulty", game.difficulty);
  });
}
