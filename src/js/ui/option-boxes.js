import { createEl, clearChildren } from '../utils/dom.js';

export function generateOptions(correctId, pool, labelFn, shuffleFn) {
  const others = Object.keys(pool).filter(id => id !== correctId);
  shuffleFn(others);
  const picked = others.slice(0, 5);
  const options = picked.map(id => ({ id, label: labelFn(id) }));
  const correctIdx = Math.floor(Math.random() * 6);
  options.splice(correctIdx, 0, { id: correctId, label: labelFn(correctId) });
  return { options, correctIndex: correctIdx };
}

export function renderOptionBoxes(container, options, onSelect) {
  clearChildren(container);
  container.classList.add("option-boxes-container");
  let disabled = false;

  const boxes = options.map((opt, i) => {
    const box = createEl("button", "option-box", opt.label);
    box.addEventListener("click", () => {
      if (disabled) return;
      onSelect(i, opt);
    });
    container.appendChild(box);
    return box;
  });

  return {
    getBoxes() { return boxes; },
    disable() {
      disabled = true;
      boxes.forEach(b => b.classList.add("option-box--disabled"));
    },
    highlightCorrect(idx) {
      boxes[idx].classList.add("option-box--correct");
    },
    highlightWrong(idx) {
      boxes[idx].classList.add("option-box--wrong");
    },
    disableOne(idx) {
      boxes[idx].classList.add("option-box--disabled");
      boxes[idx].disabled = true;
    }
  };
}
