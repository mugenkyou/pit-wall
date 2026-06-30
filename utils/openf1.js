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

function parseSeason(seasonParam) {
  if (!seasonParam || seasonParam === "current") return "current";
  const year = parseInt(seasonParam, 10);
  if (isNaN(year) || year < 1950 || year > 2100) return "current";
  return String(year);
}

function normalizeWeather(latest) {
  if (!latest) return null;
  return {
    air_temp:
      latest.air_temperature != null ? Number(latest.air_temperature) : null,
    track_temp:
      latest.track_temperature != null
        ? Number(latest.track_temperature)
        : null,
    humidity: latest.humidity != null ? Number(latest.humidity) : null,
    rain_pct:
      latest.rainfall != null
        ? Number(latest.rainfall) <= 1
          ? Number(latest.rainfall) * 100
          : Number(latest.rainfall)
        : null,
    wind_speed: latest.wind_speed != null ? Number(latest.wind_speed) : null,
    wind_direction:
      latest.wind_direction != null ? Number(latest.wind_direction) : null,
  };
}

async function getSessionList(year, sessionName) {
  const query = new URLSearchParams();
  if (year) query.set("year", String(year));
  if (sessionName) query.set("session_name", sessionName);
  const url = `${OPENF1_BASE}/sessions${query.toString() ? `?${query.toString()}` : ""}`;
  const sessions = await fetchJson(url);
  return Array.isArray(sessions) ? sessions : [];
}

async function resolveSessionKeyForLatest(season = "current") {
  const liveSession = await getLiveSession("latest");
  const status = String(liveSession?.status || "").toLowerCase();
  if (
    liveSession?.sessionKey &&
    ["live", "race", "practice", "qualifying"].includes(status)
  ) {
    return liveSession.sessionKey;
  }

  const latestCompleted = await getLatestCompletedRaceSession(season);
  return latestCompleted?.session_key || "latest";
}

export async function getLatestCompletedRaceSession(season = "current") {
  const parsedSeason = parseSeason(season);
  const year =
    parsedSeason === "current"
      ? new Date().getUTCFullYear()
      : parseInt(parsedSeason, 10);
  const sessions = await getSessionList(year, "Race");
  if (!sessions.length) return null;

  const completed = sessions
    .filter((session) => {
      const endAt = Date.parse(session?.date_end || "");
      return (
        Number.isFinite(endAt) &&
        endAt <= Date.now() &&
        session?.is_cancelled !== true
      );
    })
    .sort((a, b) => Date.parse(a.date_end) - Date.parse(b.date_end));

  const session =
    completed[completed.length - 1] || sessions[sessions.length - 1] || null;
  if (!session) return null;

  return {
    session_key: session.session_key || null,
    meeting_key: session.meeting_key || null,
    meeting_name: session.meeting_name || null,
    session_name: session.session_name || null,
    session_type: session.session_type || null,
    year: session.year || year,
    date_start: session.date_start || null,
    date_end: session.date_end || null,
  };
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
      status: String(session?.session_type || "unknown").toLowerCase(),
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
    let resolvedSessionKey = sessionKey;
    if (!resolvedSessionKey || resolvedSessionKey === "latest") {
      resolvedSessionKey = await resolveSessionKeyForLatest();
    }

    const weather = await fetchJson(
      `${OPENF1_BASE}/weather?session_key=${resolvedSessionKey}`,
    );
    const latest = Array.isArray(weather) ? weather[0] : null;

    return {
      source: "OpenF1",
      updatedAt: new Date().toISOString(),
      weather: normalizeWeather(latest),
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
    let resolvedSessionKey = params.session_key || "latest";
    if (!resolvedSessionKey || resolvedSessionKey === "latest") {
      resolvedSessionKey = await resolveSessionKeyForLatest();
    }

    const queryStr = buildQueryString({
      session_key: resolvedSessionKey,
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

export async function getStints(sessionKey = "latest") {
  try {
    let resolvedSessionKey = sessionKey;
    if (!resolvedSessionKey || resolvedSessionKey === "latest") {
      resolvedSessionKey = await resolveSessionKeyForLatest();
    }

    const stints = await fetchJson(
      `${OPENF1_BASE}/stints?session_key=${resolvedSessionKey}`,
    );

    return {
      source: "OpenF1",
      updatedAt: new Date().toISOString(),
      stints: Array.isArray(stints) ? stints : [],
    };
  } catch (error) {
    return {
      source: "OpenF1",
      updatedAt: new Date().toISOString(),
      stints: [],
      error: error.message,
    };
  }
}
