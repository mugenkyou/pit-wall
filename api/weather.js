import { jsonResponse, errorResponse } from "../utils/cache.js";
import { getWeather } from "../utils/openf1.js";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const sessionKey = url.searchParams.get("session_key") || "latest";

    const weatherData = await getWeather(sessionKey);

    return jsonResponse(
      weatherData,
      { maxAgeSeconds: 60 }, // weather is refreshed frequently but stays cacheable
    );
  } catch (error) {
    return errorResponse(error.message || "Unable to fetch weather", 502);
  }
}
