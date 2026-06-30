import { jsonResponse, errorResponse } from "../utils/cache.js";
import { getDriverByCode, parseSeason } from "../utils/jolpica.js";

export async function GET(request) {
  try {
    const url = new URL(request.url);

    // Get driverId from query parameter or URL path
    let driverId = url.searchParams.get("driverId");
    if (!driverId) {
      // Try to extract from path: /api/driver/max_verstappen
      const pathParts = url.pathname.split("/");
      driverId = pathParts[pathParts.length - 1];
    }

    if (!driverId || driverId === "driver") {
      return errorResponse("Driver ID is required", 400);
    }

    const season = url.searchParams.get("season") || "current";
    const cleanSeason = parseSeason(season);

    return jsonResponse(
      await getDriverByCode(driverId, cleanSeason),
      { maxAgeSeconds: 60 }, // short cache for race-sensitive driver info
    );
  } catch (error) {
    return errorResponse(
      error.message || "Driver not found",
      error.message?.includes("not found") ? 404 : 502,
    );
  }
}
