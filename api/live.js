import { jsonResponse, errorResponse } from "../utils/cache.js";
import { getLiveSession, getWeather } from "../utils/openf1.js";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const sessionKey = url.searchParams.get("session_key") || "latest";

    const [session, weather] = await Promise.all([
      getLiveSession(sessionKey),
      getWeather(sessionKey),
    ]);

    // Check if there's an active session
    const isLive =
      session?.status === "live" ||
      session?.status === "race" ||
      session?.status === "practice" ||
      session?.status === "qualifying";

    return jsonResponse(
      {
        live: isLive,
        session: isLive
          ? {
              type: session?.session_name || session?.status || "session",
              country: session?.meeting_name || "Unknown",
              circuit: session?.meeting_name || "Unknown",
              status: session?.status || null,
            }
          : null,
        grid: [],
        race_control: [],
        weather: weather?.weather || null,
        source: "OpenF1",
        updatedAt: new Date().toISOString(),
      },
      { maxAgeSeconds: 30 }, // 30 seconds cache for live data
    );
  } catch (error) {
    return jsonResponse(
      {
        live: false,
        session: null,
        grid: [],
        race_control: [],
        weather: null,
        error: error.message || "Unable to fetch live data",
        source: "OpenF1",
        updatedAt: new Date().toISOString(),
      },
      { maxAgeSeconds: 30 },
    );
  }
}
