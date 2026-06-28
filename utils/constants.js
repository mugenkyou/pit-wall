export const JOLPICA_API = "https://api.jolpi.ca/ergast/f1";
export const OPENF1_BASE = "https://api.openf1.org/v1";
export const CACHE_TTL_SECONDS = 300;

// Helper to get Jolpica season URL
export function getJolpicaUrl(season = "current") {
  const path = season === "current" ? "current" : season;
  return `${JOLPICA_API}/${path}`;
}
