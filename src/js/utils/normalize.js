export function normalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.slice(0, 100).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function makeHint(name) {
  let hint = "", first = true;
  for (let i = 0; i < name.length; i++) {
    const ch = name[i];
    if (ch === " " || ch === "-") { hint += "  "; first = true; }
    else if (first) { hint += ch; first = false; }
    else { hint += " _"; }
  }
  return hint;
}
