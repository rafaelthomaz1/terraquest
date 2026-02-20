export function parsePopulation(str) {
  if (!str) return 0;
  const clean = str.replace(/\s/g, "").replace(",", ".");
  if (clean.endsWith("B")) return Math.round(parseFloat(clean) * 1e9);
  if (clean.endsWith("M")) return Math.round(parseFloat(clean) * 1e6);
  if (clean.endsWith("K")) return Math.round(parseFloat(clean) * 1e3);
  return parseInt(clean, 10) || 0;
}
