export function deduplicateFeatures(features) {
  const map = new Map();
  for (const f of features) {
    const id = String(Number(f.id));
    const existing = map.get(id);
    if (!existing) {
      map.set(id, f);
      continue;
    }
    const existCoords = existing.geometry.type === "MultiPolygon"
      ? existing.geometry.coordinates
      : [existing.geometry.coordinates];
    const newCoords = f.geometry.type === "MultiPolygon"
      ? f.geometry.coordinates
      : [f.geometry.coordinates];
    existing.geometry = { type: "MultiPolygon", coordinates: [...existCoords, ...newCoords] };
  }
  return Array.from(map.values());
}
