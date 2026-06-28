import { jsonResponse, errorResponse } from "../utils/cache.js";
import { getTelemetry } from "../utils/openf1.js";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const params = {
      session_key: url.searchParams.get("session_key") || "latest",
      driver_number: url.searchParams.get("driver_number") || undefined,
    };

    const telemetryData = await getTelemetry(params);

    return jsonResponse(
      telemetryData,
      { maxAgeSeconds: 10 }, // 10 seconds cache for telemetry
    );
  } catch (error) {
    return errorResponse(error.message || "Unable to fetch telemetry", 502);
  }
}
