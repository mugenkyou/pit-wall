import { jsonResponse, errorResponse } from "../utils/cache.js";
import { getSchedule, parseSeason } from "../utils/jolpica.js";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const season = url.searchParams.get("season") || "current";
    const cleanSeason = parseSeason(season);

    return jsonResponse(
      await getSchedule(cleanSeason),
      { maxAgeSeconds: 3600 }, // 1 hour cache for schedule
    );
  } catch (error) {
    return errorResponse(error.message || "Unable to fetch schedule", 502);
  }
}
