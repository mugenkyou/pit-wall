import { OPENF1_BASE } from "./constants.js";

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`OpenF1 request failed: ${response.status}`);
  }
  return response.json();
}

// Build query string from object
function buildQueryString(params) {
  const query = new URLSearchParams();
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        query.append(key, String(value));
      }
    });
  }
  const str = query.toString();
  return str ? `?${str}` : "";
}

export async function getLiveSession(sessionKey = "latest") {
  try {
    const sessions = await fetchJson(
      `${OPENF1_BASE}/sessions?session_key=${sessionKey}`,
    );
    const session = Array.isArray(sessions) ? sessions[0] : null;

    if (!session) {
      return {
        status: "no_session",
        meeting: null,
        session: null,
        message: "No active session",
        source: "OpenF1",
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      status: session?.session_type || "unknown",
      meeting: session?.meeting_name || null,
      session: session?.session_name || null,
      sessionKey: session?.session_key || null,
      trackStatus: session?.track_status || null,
      source: "OpenF1",
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "error",
      meeting: null,
      session: null,
      message: error.message,
      source: "OpenF1",
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function getWeather(sessionKey = "latest") {
  try {
    const weather = await fetchJson(
      `${OPENF1_BASE}/weather?session_key=${sessionKey}`,
    );
    const latest = Array.isArray(weather) ? weather[0] : null;

    return {
      source: "OpenF1",
      updatedAt: new Date().toISOString(),
      weather: latest
        ? {
            air_temperature: latest.air_temperature ?? null,
            track_temperature: latest.track_temperature ?? null,
            humidity: latest.humidity ?? null,
            rainfall: latest.rainfall ?? null,
            wind_speed: latest.wind_speed ?? null,
            wind_direction: latest.wind_direction ?? null,
          }
        : null,
    };
  } catch (error) {
    return {
      source: "OpenF1",
      updatedAt: new Date().toISOString(),
      weather: null,
      error: error.message,
    };
  }
}

export async function getTelemetry(params = {}) {
  try {
    const queryStr = buildQueryString({
      session_key: params.session_key || "latest",
      driver_number: params.driver_number || undefined,
    });

    const data = await fetchJson(`${OPENF1_BASE}/car_data${queryStr}`);

    if (!Array.isArray(data) || data.length === 0) {
      return {
        source: "OpenF1",
        updatedAt: new Date().toISOString(),
        telemetry: null,
        message: "No telemetry data available",
      };
    }

    return {
      source: "OpenF1",
      updatedAt: new Date().toISOString(),
      telemetry: data,
      count: data.length,
    };
  } catch (error) {
    return {
      source: "OpenF1",
      updatedAt: new Date().toISOString(),
      telemetry: null,
      error: error.message,
    };
  }
}
