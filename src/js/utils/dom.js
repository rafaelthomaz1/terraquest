export function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function createTooltipContent(tooltip, nameText, rows) {
  clearChildren(tooltip);
  const nameDiv = createEl('div', 'tt-name', nameText);
  tooltip.appendChild(nameDiv);
  if (rows) {
    rows.forEach(([label, value]) => {
      const row = createEl('div', 'tt-row');
      row.appendChild(createEl('span', 'tt-label', label));
      row.appendChild(document.createTextNode(' ' + value));
      tooltip.appendChild(row);
    });
  }
}

export function createUnknownTooltip(tooltip) {
  clearChildren(tooltip);
  tooltip.appendChild(createEl('div', 'tt-unknown', '???'));
}

export function showFeedbackMsg(feedbackEl, msg, color) {
  feedbackEl.textContent = msg;
  feedbackEl.style.background = color === "green" ? "rgba(34,197,94,0.2)" :
                                color === "yellow" ? "rgba(234,179,8,0.2)" :
                                "rgba(239,68,68,0.2)";
  feedbackEl.style.color = color === "green" ? "#4ade80" :
                            color === "yellow" ? "#fbbf24" : "#f87171";
  feedbackEl.style.border = `1px solid ${color === "green" ? "rgba(34,197,94,0.3)" :
                              color === "yellow" ? "rgba(234,179,8,0.3)" :
                              "rgba(239,68,68,0.3)"}`;
  feedbackEl.style.opacity = 1;
  setTimeout(() => { feedbackEl.style.opacity = 0; }, 1800);
}

export function createBreakdownItem(dotColor, label, countText) {
  const item = createEl('div', 'go-cont-item');
  const dot = createEl('div', 'go-cont-dot');
  dot.style.background = dotColor;
  item.appendChild(dot);
  item.appendChild(document.createTextNode(label + ' '));
  const span = createEl('span', null, countText);
  span.style.color = '#e2e8f0';
  span.style.marginLeft = '4px';
  item.appendChild(span);
  return item;
}
