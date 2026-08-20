var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api/standings.js
var standings_exports = {};
__export(standings_exports, {
  GET: () => GET
});

// utils/cache.js
function jsonHeaders(maxAgeSeconds = 300) {
  return {
    "cache-control": `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}`,
    "content-type": "application/json; charset=utf-8"
  };
}
__name(jsonHeaders, "jsonHeaders");
function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: init.status || 200,
    headers: {
      ...jsonHeaders(init.maxAgeSeconds),
      ...init.headers || {}
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, { status, maxAgeSeconds: 0 });
}
__name(errorResponse, "errorResponse");

// utils/constants.js
var JOLPICA_API = "https://api.jolpi.ca/ergast/f1";
var OPENF1_BASE = "https://api.openf1.org/v1";
function getJolpicaUrl(season = "current") {
  const path = season === "current" ? "current" : season;
  return `${JOLPICA_API}/${path}`;
}
__name(getJolpicaUrl, "getJolpicaUrl");

// utils/jolpica.js
async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`Jolpica request failed: ${response.status}`);
  }
  return response.json();
}
__name(fetchJson, "fetchJson");
function parseSeason(seasonParam) {
  if (!seasonParam || seasonParam === "current") return "current";
  const year = parseInt(seasonParam, 10);
  if (isNaN(year) || year < 1950 || year > 2100) return "current";
  return String(year);
}
__name(parseSeason, "parseSeason");
function getTeamId(constructorName) {
  const map = {
    Mercedes: "mercedes",
    Ferrari: "ferrari",
    McLaren: "mclaren",
    "Red Bull": "red_bull",
    Williams: "williams",
    "Haas F1 Team": "haas",
    "Alpine F1 Team": "alpine",
    Audi: "sauber",
    "Racing Bulls": "racing_bulls",
    RB: "racing_bulls",
    "RB F1 Team": "racing_bulls",
    "Visa Cash App RB": "racing_bulls",
    "Aston Martin": "aston_martin",
    Cadillac: "cadillac"
  };
  return map[constructorName] || constructorName.toLowerCase().replace(/\s+/g, "_");
}
__name(getTeamId, "getTeamId");
function getDriverDisplayName(driver) {
  return `${driver?.givenName || ""} ${driver?.familyName || ""}`.trim();
}
__name(getDriverDisplayName, "getDriverDisplayName");
function normalizeDriverStanding(entry, idx, leaderPoints = 0) {
  const driver = entry?.Driver || {};
  const constructor = entry?.Constructors?.[0] || {};
  const points = parseInt(entry?.points || 0, 10);
  return {
    pos: idx + 1,
    code: driver.code || driver.driverId || "---",
    driverId: driver.driverId || driver.code || "---",
    given_name: driver.givenName || "",
    family_name: driver.familyName || "",
    short_name: driver.code || getDriverDisplayName(driver) || "---",
    name: getDriverDisplayName(driver) || driver.code || "---",
    permanent_number: driver.permanentNumber || null,
    team_id: getTeamId(constructor.name || ""),
    team_name: constructor.name || "\u2014",
    nationality: driver.nationality || "\u2014",
    gap: idx === 0 ? null : leaderPoints - points,
    pts: points,
    wins: parseInt(entry?.wins || 0, 10)
  };
}
__name(normalizeDriverStanding, "normalizeDriverStanding");
function raceStartUtc(race) {
  if (!race?.date) return null;
  const time = String(race.time || "00:00:00Z");
  const iso = /Z$/.test(time) ? `${race.date}T${time}` : `${race.date}T${time}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
__name(raceStartUtc, "raceStartUtc");
function normalizeRaceSchedule(race) {
  const startUtc = raceStartUtc(race);
  const isDone = startUtc ? Date.parse(startUtc) < Date.now() : false;
  return {
    round: parseInt(race.round || 0, 10),
    short_name: race.raceName?.replace(" Grand Prix", "")?.slice(0, 20) || "\u2014",
    name: race.raceName || "\u2014",
    circuit_id: race.Circuit?.circuitId || "unknown",
    circuit: race.Circuit?.circuitName || "\u2014",
    locality: race.Circuit?.Location?.locality || "\u2014",
    country: race.Circuit?.Location?.country || "\u2014",
    date: race.date || null,
    time: race.time || null,
    start_utc: startUtc,
    status: isDone ? "done" : "upcoming"
  };
}
__name(normalizeRaceSchedule, "normalizeRaceSchedule");
function normalizePodium(results = []) {
  return results.slice(0, 3).map((result) => ({
    position: result.position || result.positionText || "\u2014",
    driver: `${result?.Driver?.givenName || ""} ${result?.Driver?.familyName || ""}`.trim(),
    driver_short: result?.Driver?.code || result?.Driver?.driverId || "---",
    team: result?.Constructor?.name || "\u2014",
    team_id: getTeamId(result?.Constructor?.name || ""),
    points: parseFloat(result?.points || 0),
    status: result?.status || "Finished",
    time: result?.Time?.time || result?.Time?.millis || null,
    fastest_lap: result?.FastestLap?.Time?.time || null
  }));
}
__name(normalizePodium, "normalizePodium");
function normalizeRaceResult(result, positionIndex = 0) {
  return {
    pos: parseInt(
      result?.position || result?.positionText || positionIndex + 1,
      10
    ),
    code: result?.Driver?.code || result?.Driver?.driverId || "---",
    driverId: result?.Driver?.driverId || result?.Driver?.code || "---",
    number: result?.Driver?.permanentNumber || null,
    permanent_number: result?.Driver?.permanentNumber || null,
    short_name: result?.Driver?.code || `${result?.Driver?.givenName || ""} ${result?.Driver?.familyName || ""}`.trim() || "---",
    driver: `${result?.Driver?.givenName || ""} ${result?.Driver?.familyName || ""}`.trim(),
    team: result?.Constructor?.name || "\u2014",
    team_name: result?.Constructor?.name || "\u2014",
    team_id: getTeamId(result?.Constructor?.name || ""),
    nationality: result?.Driver?.nationality || "\u2014",
    q1: result?.Q1 || null,
    q2: result?.Q2 || null,
    q3: result?.Q3 || null,
    best: result?.Q3 || result?.Q2 || result?.Q1 || null,
    grid: result?.grid || null,
    points: parseFloat(result?.points || 0),
    pts: parseFloat(result?.points || 0),
    status: result?.status || "Finished",
    time: result?.Time?.time || result?.Time?.millis || null,
    fastest_lap: result?.FastestLap?.Time?.time || null
  };
}
__name(normalizeRaceResult, "normalizeRaceResult");
function normalizeFastestLap(results = []) {
  const withFastest = results.find((result) => result?.FastestLap?.Time?.time);
  if (!withFastest) return null;
  return {
    driver: `${withFastest?.Driver?.givenName || ""} ${withFastest?.Driver?.familyName || ""}`.trim(),
    driver_short: withFastest?.Driver?.code || withFastest?.Driver?.driverId || "---",
    team: withFastest?.Constructor?.name || "\u2014",
    team_id: getTeamId(withFastest?.Constructor?.name || ""),
    time: withFastest?.FastestLap?.Time?.time || null
  };
}
__name(normalizeFastestLap, "normalizeFastestLap");
function normalizeQualifyingRace(race) {
  const results = (race?.QualifyingResults || []).map((entry) => ({
    pos: parseInt(entry?.position || 0, 10),
    driver_short: entry?.Driver?.code || entry?.Driver?.driverId || "---",
    driver: `${entry?.Driver?.givenName || ""} ${entry?.Driver?.familyName || ""}`.trim(),
    team: entry?.Constructor?.name || "\u2014",
    team_id: getTeamId(entry?.Constructor?.name || ""),
    q1: entry?.Q1 || null,
    q2: entry?.Q2 || null,
    q3: entry?.Q3 || null,
    best: entry?.Q3 || entry?.Q2 || entry?.Q1 || null
  }));
  return {
    round: parseInt(race?.round || 0, 10),
    raceName: race?.raceName || "\u2014",
    pole: results[0] ? {
      driver: results[0].driver,
      driver_short: results[0].driver_short,
      team: results[0].team,
      team_id: results[0].team_id,
      time: results[0].best,
      year: parseInt(race?.season || parseSeason("current"), 10)
    } : null,
    results
  };
}
__name(normalizeQualifyingRace, "normalizeQualifyingRace");
function selectRaceByRound(races, targetRound) {
  if (!Array.isArray(races) || !races.length) return null;
  if (targetRound != null) {
    const round = Number.parseInt(targetRound, 10);
    if (Number.isFinite(round)) {
      const exact = races.find(
        (race) => parseInt(race?.round || 0, 10) === round
      );
      if (exact) return exact;
      const eligible = races.filter((race) => parseInt(race?.round || 0, 10) <= round).sort(
        (a, b) => parseInt(a?.round || 0, 10) - parseInt(b?.round || 0, 10)
      );
      if (eligible.length) return eligible[eligible.length - 1];
    }
  }
  return races[races.length - 1] || null;
}
__name(selectRaceByRound, "selectRaceByRound");
async function fetchAllRaces(url) {
  const pageSize = 100;
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  const allRaces = [];
  while (offset < total) {
    const pageUrl = `${url}${url.includes("?") ? "&" : "?"}limit=${pageSize}&offset=${offset}`;
    const payload = await fetchJson(pageUrl);
    const races = payload?.MRData?.RaceTable?.Races || [];
    allRaces.push(...races);
    const pageTotal = Number.parseInt(
      payload?.MRData?.total || `${races.length}`,
      10
    );
    if (Number.isFinite(pageTotal)) {
      total = pageTotal;
    } else if (!races.length) {
      break;
    }
    if (!races.length) break;
    offset += races.length;
    if (races.length < pageSize) break;
  }
  return allRaces;
}
__name(fetchAllRaces, "fetchAllRaces");
async function getDriverStandings(season = "current") {
  const cleanSeason = parseSeason(season);
  const payload = await fetchJson(
    `${getJolpicaUrl(cleanSeason)}/driverstandings.json`
  );
  const list = payload?.MRData?.StandingsTable?.StandingsLists?.[0];
  const standings = list?.DriverStandings || [];
  const leaderPts = parseInt(standings[0]?.points || 0, 10);
  return {
    season: list?.season || cleanSeason,
    drivers: standings.map(
      (entry, idx) => normalizeDriverStanding(entry, idx, leaderPts)
    )
  };
}
__name(getDriverStandings, "getDriverStandings");
async function getConstructorStandings(season = "current") {
  const cleanSeason = parseSeason(season);
  const payload = await fetchJson(
    `${getJolpicaUrl(cleanSeason)}/constructorstandings.json`
  );
  const list = payload?.MRData?.StandingsTable?.StandingsLists?.[0];
  const standings = list?.ConstructorStandings || [];
  const leaderPoints = standings[0] ? parseInt(standings[0].points || 0, 10) : 0;
  return standings.map((entry, idx) => {
    const constructor = entry?.Constructor || {};
    const points = parseInt(entry?.points || 0, 10);
    return {
      pos: idx + 1,
      id: getTeamId(constructor.name || ""),
      name: constructor.name || "\u2014",
      nationality: constructor.nationality || "\u2014",
      pts: points,
      pct: leaderPoints > 0 ? Math.round(points / leaderPoints * 100) : 0
    };
  });
}
__name(getConstructorStandings, "getConstructorStandings");
async function getDriverByCode(code, season = "current") {
  const clean = String(code || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (!clean) {
    throw new Error("Driver code is required");
  }
  const cleanSeason = parseSeason(season);
  const payload = await fetchJson(`${getJolpicaUrl(cleanSeason)}/drivers.json`);
  const drivers = payload?.MRData?.DriverTable?.Drivers || [];
  const entry = drivers.find(
    (driver) => String(driver.driverId || "").toLowerCase() === clean || String(driver.code || "").toLowerCase() === clean
  );
  if (!entry) {
    throw new Error(`No driver found for ${clean}`);
  }
  const driverId = entry.driverId || clean;
  const displayName = getDriverDisplayName(entry);
  const [
    seasonResultsResponse,
    allTimeResultsResponse,
    allTimeQualifyingResponse
  ] = await Promise.allSettled([
    fetchJson(`${getJolpicaUrl(cleanSeason)}/drivers/${driverId}/results.json`),
    fetchAllRaces(
      `https://api.jolpi.ca/ergast/f1/drivers/${driverId}/results.json`
    ),
    fetchAllRaces(
      `https://api.jolpi.ca/ergast/f1/drivers/${driverId}/qualifying.json`
    )
  ]);
  const seasonResultRaces = seasonResultsResponse.status === "fulfilled" ? seasonResultsResponse.value?.MRData?.RaceTable?.Races || [] : [];
  const allTimeResultRaces = allTimeResultsResponse.status === "fulfilled" ? allTimeResultsResponse.value || [] : [];
  const allTimeQualifyingRaces = allTimeQualifyingResponse.status === "fulfilled" ? allTimeQualifyingResponse.value || [] : [];
  const seasonResults = seasonResultRaces.map((race) => {
    const result = race?.Results?.[0] || {};
    return {
      round: parseInt(race?.round || 0, 10),
      short_name: race?.raceName?.replace(" Grand Prix", "") || "Race",
      pos: result?.position || result?.positionText || "\u2014",
      status: result?.status || "Finished",
      points: parseFloat(result?.points || 0)
    };
  }).sort((a, b) => b.round - a.round).slice(0, 5);
  const careerWins = allTimeResultRaces.reduce((count, race) => {
    const results = race?.Results || [];
    return count + results.filter(
      (result) => String(result?.position || result?.positionText || "") === "1"
    ).length;
  }, 0);
  const careerPoles = allTimeQualifyingRaces.reduce((count, race) => {
    const qualifyingResults = race?.QualifyingResults || [];
    return count + qualifyingResults.filter((qual) => String(qual?.position || "") === "1").length;
  }, 0);
  const currentTeam = seasonResultRaces[0]?.Results?.[0]?.Constructor?.name || entry?.Constructor?.name || "\u2014";
  return {
    driverId,
    code: entry.code || "---",
    name: displayName || entry.code || "---",
    given_name: entry.givenName || "",
    family_name: entry.familyName || "",
    permanent_number: entry.permanentNumber || null,
    number: entry.permanentNumber || "\u2014",
    nationality: entry.nationality || "\u2014",
    dateOfBirth: entry.dateOfBirth || null,
    team_id: getTeamId(currentTeam || ""),
    team_name: currentTeam || "\u2014",
    career: {
      wins: careerWins,
      poles: careerPoles
    },
    season_results: seasonResults,
    source: "Jolpica F1",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(getDriverByCode, "getDriverByCode");
async function getSchedule(season = "current") {
  const cleanSeason = parseSeason(season);
  const payload = await fetchJson(`${getJolpicaUrl(cleanSeason)}/races.json`);
  const races = payload?.MRData?.RaceTable?.Races || [];
  return {
    season: payload?.MRData?.RaceTable?.season || cleanSeason,
    schedule: races.map(normalizeRaceSchedule),
    source: "Jolpica F1",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(getSchedule, "getSchedule");
async function getLatestRaceResults(season = "current", round = null) {
  const cleanSeason = parseSeason(season);
  const payload = round != null ? await fetchJson(`${getJolpicaUrl(cleanSeason)}/${round}/results.json`) : await fetchJson(`${getJolpicaUrl(cleanSeason)}/results.json`);
  const races = payload?.MRData?.RaceTable?.Races || [];
  const race = round != null ? races[0] || null : selectRaceByRound(races, round);
  if (!race) return null;
  const results = race?.Results || [];
  return {
    round: parseInt(race.round || 0, 10),
    season: race.season || cleanSeason,
    short_name: race.raceName?.replace(" Grand Prix", "") || "\u2014",
    name: race.raceName || "\u2014",
    circuit_id: race.Circuit?.circuitId || "unknown",
    circuit: race.Circuit?.circuitName || "\u2014",
    locality: race.Circuit?.Location?.locality || "\u2014",
    country: race.Circuit?.Location?.country || "\u2014",
    date: race.date || null,
    time: race.time || null,
    start_utc: raceStartUtc(race),
    status: "done",
    results: results.map(normalizeRaceResult),
    podium: normalizePodium(results),
    fastest_lap: normalizeFastestLap(results)
  };
}
__name(getLatestRaceResults, "getLatestRaceResults");
async function getLatestQualifying(season = "current", round = null) {
  const cleanSeason = parseSeason(season);
  const payload = round != null ? await fetchJson(
    `${getJolpicaUrl(cleanSeason)}/${round}/qualifying.json`
  ) : await fetchJson(`${getJolpicaUrl(cleanSeason)}/qualifying.json`);
  const races = payload?.MRData?.RaceTable?.Races || [];
  const race = round != null ? races[0] || null : selectRaceByRound(races, round);
  return race ? normalizeQualifyingRace(race) : null;
}
__name(getLatestQualifying, "getLatestQualifying");

// utils/openf1.js
async function fetchJson2(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`OpenF1 request failed: ${response.status}`);
  }
  return response.json();
}
__name(fetchJson2, "fetchJson");
function parseSeason2(seasonParam) {
  if (!seasonParam || seasonParam === "current") return "current";
  const year = parseInt(seasonParam, 10);
  if (isNaN(year) || year < 1950 || year > 2100) return "current";
  return String(year);
}
__name(parseSeason2, "parseSeason");
function normalizeWeather(latest) {
  if (!latest) return null;
  return {
    air_temp: latest.air_temperature != null ? Number(latest.air_temperature) : null,
    track_temp: latest.track_temperature != null ? Number(latest.track_temperature) : null,
    humidity: latest.humidity != null ? Number(latest.humidity) : null,
    rain_pct: latest.rainfall != null ? Number(latest.rainfall) <= 1 ? Number(latest.rainfall) * 100 : Number(latest.rainfall) : null,
    wind_speed: latest.wind_speed != null ? Number(latest.wind_speed) : null,
    wind_direction: latest.wind_direction != null ? Number(latest.wind_direction) : null
  };
}
__name(normalizeWeather, "normalizeWeather");
async function getSessionList(year, sessionName) {
  const query = new URLSearchParams();
  if (year) query.set("year", String(year));
  if (sessionName) query.set("session_name", sessionName);
  const url = `${OPENF1_BASE}/sessions${query.toString() ? `?${query.toString()}` : ""}`;
  const sessions = await fetchJson2(url);
  return Array.isArray(sessions) ? sessions : [];
}
__name(getSessionList, "getSessionList");
async function resolveSessionKeyForLatest(season = "current") {
  const liveSession = await getLiveSession("latest");
  const status = String(liveSession?.status || "").toLowerCase();
  if (liveSession?.sessionKey && ["live", "race", "practice", "qualifying"].includes(status)) {
    return liveSession.sessionKey;
  }
  const latestCompleted = await getLatestCompletedRaceSession(season);
  return latestCompleted?.session_key || "latest";
}
__name(resolveSessionKeyForLatest, "resolveSessionKeyForLatest");
async function getLatestCompletedRaceSession(season = "current") {
  const parsedSeason = parseSeason2(season);
  const year = parsedSeason === "current" ? (/* @__PURE__ */ new Date()).getUTCFullYear() : parseInt(parsedSeason, 10);
  const sessions = await getSessionList(year, "Race");
  if (!sessions.length) return null;
  const completed = sessions.filter((session2) => {
    const endAt = Date.parse(session2?.date_end || "");
    return Number.isFinite(endAt) && endAt <= Date.now() && session2?.is_cancelled !== true;
  }).sort((a, b) => Date.parse(a.date_end) - Date.parse(b.date_end));
  const session = completed[completed.length - 1] || sessions[sessions.length - 1] || null;
  if (!session) return null;
  return {
    session_key: session.session_key || null,
    meeting_key: session.meeting_key || null,
    meeting_name: session.meeting_name || null,
    session_name: session.session_name || null,
    session_type: session.session_type || null,
    year: session.year || year,
    date_start: session.date_start || null,
    date_end: session.date_end || null
  };
}
__name(getLatestCompletedRaceSession, "getLatestCompletedRaceSession");
function buildQueryString(params) {
  const query = new URLSearchParams();
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== void 0 && value !== "") {
        query.append(key, String(value));
      }
    });
  }
  const str = query.toString();
  return str ? `?${str}` : "";
}
__name(buildQueryString, "buildQueryString");
async function getLiveSession(sessionKey = "latest") {
  try {
    const sessions = await fetchJson2(
      `${OPENF1_BASE}/sessions?session_key=${sessionKey}`
    );
    const session = Array.isArray(sessions) ? sessions[0] : null;
    if (!session) {
      return {
        status: "no_session",
        meeting: null,
        session: null,
        message: "No active session",
        source: "OpenF1",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    return {
      status: String(session?.session_type || "unknown").toLowerCase(),
      meeting: session?.meeting_name || null,
      session: session?.session_name || null,
      sessionKey: session?.session_key || null,
      trackStatus: session?.track_status || null,
      source: "OpenF1",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (error) {
    return {
      status: "error",
      meeting: null,
      session: null,
      message: error.message,
      source: "OpenF1",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
}
__name(getLiveSession, "getLiveSession");
async function getWeather(sessionKey = "latest") {
  try {
    let resolvedSessionKey = sessionKey;
    if (!resolvedSessionKey || resolvedSessionKey === "latest") {
      resolvedSessionKey = await resolveSessionKeyForLatest();
    }
    const weather = await fetchJson2(
      `${OPENF1_BASE}/weather?session_key=${resolvedSessionKey}`
    );
    const latest = Array.isArray(weather) && weather.length > 0 ? weather[weather.length - 1] : null;
    return {
      source: "OpenF1",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      weather: normalizeWeather(latest)
    };
  } catch (error) {
    return {
      source: "OpenF1",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      weather: null,
      error: error.message
    };
  }
}
__name(getWeather, "getWeather");
async function getTelemetry(params = {}) {
  try {
    let resolvedSessionKey = params.session_key || "latest";
    if (!resolvedSessionKey || resolvedSessionKey === "latest") {
      resolvedSessionKey = await resolveSessionKeyForLatest();
    }
    const queryStr = buildQueryString({
      session_key: resolvedSessionKey,
      driver_number: params.driver_number || void 0
    });
    const data = await fetchJson2(`${OPENF1_BASE}/car_data${queryStr}`);
    if (!Array.isArray(data) || data.length === 0) {
      return {
        source: "OpenF1",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        telemetry: null,
        message: "No telemetry data available"
      };
    }
    return {
      source: "OpenF1",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      telemetry: data,
      count: data.length
    };
  } catch (error) {
    return {
      source: "OpenF1",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      telemetry: null,
      error: error.message
    };
  }
}
__name(getTelemetry, "getTelemetry");
async function getStints(sessionKey = "latest") {
  try {
    let resolvedSessionKey = sessionKey;
    if (!resolvedSessionKey || resolvedSessionKey === "latest") {
      resolvedSessionKey = await resolveSessionKeyForLatest();
    }
    const stints = await fetchJson2(
      `${OPENF1_BASE}/stints?session_key=${resolvedSessionKey}`
    );
    return {
      source: "OpenF1",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      stints: Array.isArray(stints) ? stints : []
    };
  } catch (error) {
    return {
      source: "OpenF1",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      stints: [],
      error: error.message
    };
  }
}
__name(getStints, "getStints");
async function getLivePositions(sessionKey) {
  try {
    const data = await fetchJson2(`${OPENF1_BASE}/position?session_key=${sessionKey}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
__name(getLivePositions, "getLivePositions");
async function getRaceControl(sessionKey) {
  try {
    const data = await fetchJson2(`${OPENF1_BASE}/race_control?session_key=${sessionKey}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
__name(getRaceControl, "getRaceControl");

// api/standings.js
function normalizeRaceStints(results = [], stints = []) {
  if (!Array.isArray(results) || !results.length) return null;
  if (!Array.isArray(stints) || !stints.length) return null;
  const podium = results.slice(0, 3).filter((result) => result?.number != null).map((result) => ({
    code: result.code || result.short_name || "---",
    num: result.number,
    driver: result.driver || result.short_name || "---",
    stints: []
  }));
  const byDriverNumber = new Map(
    podium.map((driver) => [Number(driver.num), driver])
  );
  let totalLaps = 0;
  stints.forEach((stint) => {
    const driverNumber = Number(stint?.driver_number);
    const target = byDriverNumber.get(driverNumber);
    if (!target) return;
    const lapStart = Number(stint?.lap_start || 0);
    const lapEnd = Number(stint?.lap_end || 0);
    if (!Number.isFinite(lapStart) || !Number.isFinite(lapEnd) || lapEnd < lapStart)
      return;
    const lapCount = lapEnd - lapStart + 1;
    totalLaps = Math.max(totalLaps, lapEnd);
    target.stints.push({
      compound: String(stint?.compound || "").toLowerCase() || null,
      lap_start: lapStart,
      lap_end: lapEnd,
      laps: lapCount
    });
  });
  const drivers = podium.map((driver) => ({
    ...driver,
    stints: driver.stints.sort((a, b) => a.lap_start - b.lap_start)
  })).filter((driver) => driver.stints.length);
  return drivers.length ? { total_laps: totalLaps || 1, drivers } : null;
}
__name(normalizeRaceStints, "normalizeRaceStints");
async function GET(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const season = url.searchParams.get("season") || "current";
    const cleanSeason = parseSeason(season);
    const [drivers, constructors, scheduleData] = await Promise.all([
      getDriverStandings(cleanSeason),
      getConstructorStandings(cleanSeason),
      getSchedule(cleanSeason)
    ]);
    const schedule = scheduleData.schedule || [];
    const nextRace = schedule.find((r) => r.status === "upcoming") || null;
    const lastScheduledRace = [...schedule].reverse().find((r) => r.status === "done") || null;
    const seasonForRound = scheduleData.season || cleanSeason;
    const lastRace = lastScheduledRace ? await getLatestRaceResults(seasonForRound, lastScheduledRace.round) : null;
    if (lastRace) {
      const [qualifying, latestCompletedSession] = await Promise.all([
        getLatestQualifying(seasonForRound, lastRace.round),
        getLatestCompletedRaceSession(seasonForRound)
      ]);
      lastRace.qualifying = qualifying;
      if (latestCompletedSession?.session_key != null) {
        const [weatherResponse, stintsResponse] = await Promise.all([
          getWeather(latestCompletedSession.session_key),
          getStints(latestCompletedSession.session_key)
        ]);
        lastRace.weather = weatherResponse?.weather || null;
        lastRace.stints = normalizeRaceStints(
          lastRace.results,
          stintsResponse?.stints || []
        );
      }
    }
    return jsonResponse(
      {
        season: drivers.season,
        drivers: drivers.drivers,
        constructors,
        schedule,
        next_race: nextRace,
        last_race: lastRace,
        source: "Jolpica F1",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      { maxAgeSeconds: 60 }
      // short cache for race-sensitive standings
    );
  } catch (error) {
    return errorResponse(error.message || "Unable to fetch standings", 502);
  }
}
__name(GET, "GET");

// api/live.js
var live_exports = {};
__export(live_exports, {
  GET: () => GET2
});
var DRIVERS_MAP = {
  12: { code: "ANT", name: "Andrea Kimi Antonelli", team_id: "mercedes", team_name: "Mercedes", team_color: "#27f4d2" },
  63: { code: "RUS", name: "George Russell", team_id: "mercedes", team_name: "Mercedes", team_color: "#27f4d2" },
  16: { code: "LEC", name: "Charles Leclerc", team_id: "ferrari", team_name: "Ferrari", team_color: "#e10600" },
  44: { code: "HAM", name: "Lewis Hamilton", team_id: "ferrari", team_name: "Ferrari", team_color: "#e10600" },
  1: { code: "NOR", name: "Lando Norris", team_id: "mclaren", team_name: "McLaren", team_color: "#ff8700" },
  81: { code: "PIA", name: "Oscar Piastri", team_id: "mclaren", team_name: "McLaren", team_color: "#ff8700" },
  3: { code: "VER", name: "Max Verstappen", team_id: "red_bull", team_name: "Red Bull Racing", team_color: "#3671c6" },
  6: { code: "HAD", name: "Isack Hadjar", team_id: "red_bull", team_name: "Red Bull Racing", team_color: "#3671c6" },
  30: { code: "LAW", name: "Liam Lawson", team_id: "racing_bulls", team_name: "Racing Bulls", team_color: "#6692ff" },
  41: { code: "LIN", name: "Arvid Lindblad", team_id: "racing_bulls", team_name: "Racing Bulls", team_color: "#6692ff" },
  10: { code: "GAS", name: "Pierre Gasly", team_id: "alpine", team_name: "Alpine", team_color: "#0093cc" },
  43: { code: "COL", name: "Franco Colapinto", team_id: "alpine", team_name: "Alpine", team_color: "#0093cc" },
  23: { code: "ALB", name: "Alex Albon", team_id: "williams", team_name: "Williams", team_color: "#64c4ff" },
  55: { code: "SAI", name: "Carlos Sainz", team_id: "williams", team_name: "Williams", team_color: "#64c4ff" },
  87: { code: "BEA", name: "Oliver Bearman", team_id: "haas", team_name: "Haas F1", team_color: "#b6babd" },
  31: { code: "OCO", name: "Esteban Ocon", team_id: "haas", team_name: "Haas F1", team_color: "#b6babd" },
  27: { code: "HUL", name: "Nico H\xFClkenberg", team_id: "sauber", team_name: "Audi", team_color: "#52e252" },
  5: { code: "BOR", name: "Gabriel Bortoleto", team_id: "sauber", team_name: "Audi", team_color: "#52e252" },
  18: { code: "STR", name: "Lance Stroll", team_id: "aston_martin", team_name: "Aston Martin", team_color: "#229977" },
  14: { code: "ALO", name: "Fernando Alonso", team_id: "aston_martin", team_name: "Aston Martin", team_color: "#229977" },
  11: { code: "PER", name: "Sergio P\xE9rez", team_id: "cadillac", team_name: "Cadillac", team_color: "#c0c0c0" },
  77: { code: "BOT", name: "Valtteri Bottas", team_id: "cadillac", team_name: "Cadillac", team_color: "#c0c0c0" }
};
async function GET2(request) {
  try {
    const url = new URL(request.url);
    const sessionKey = url.searchParams.get("session_key") || "latest";
    const [session, weather] = await Promise.all([
      getLiveSession(sessionKey),
      getWeather(sessionKey)
    ]);
    const status = String(session?.status || "").toLowerCase();
    const isLive = status.includes("live") || status.includes("race") || status.includes("practice") || status.includes("qualifying") || status.includes("sprint");
    let grid = [];
    let raceControl = [];
    if (isLive && session?.sessionKey) {
      const [posData, rcData] = await Promise.all([
        getLivePositions(session.sessionKey),
        getRaceControl(session.sessionKey)
      ]);
      const latestPositions = /* @__PURE__ */ new Map();
      posData.forEach((pos) => {
        const num = Number(pos.driver_number);
        const current = latestPositions.get(num);
        if (!current || new Date(pos.date) > new Date(current.date)) {
          latestPositions.set(num, pos);
        }
      });
      grid = Array.from(latestPositions.values()).map((pos) => {
        const num = Number(pos.driver_number);
        const info = DRIVERS_MAP[num] || {
          code: `DRV${num}`,
          name: `Driver ${num}`,
          team_id: "unknown",
          team_name: "Unknown Team",
          team_color: "#888"
        };
        return {
          pos: pos.position,
          driver_number: num,
          code: info.code,
          driver: info.name,
          team_id: info.team_id,
          team: info.team_name,
          team_color: info.team_color
        };
      }).sort((a, b) => a.pos - b.pos);
      raceControl = rcData.sort((a, b) => new Date(b.date) - new Date(a.date)).map((msg) => ({
        flag: msg.flag || msg.category || "rc",
        category: msg.category || null,
        message: msg.message || "",
        date: msg.date
      }));
    }
    return jsonResponse(
      {
        live: isLive,
        session: isLive ? {
          type: session?.session || session?.status || "session",
          country: session?.meeting || "Unknown",
          circuit: session?.meeting || "Unknown",
          status: session?.status || null
        } : null,
        grid,
        race_control: raceControl,
        weather: weather?.weather || null,
        source: "OpenF1",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      { maxAgeSeconds: 30 }
      // 30 seconds cache for live data
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
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      { maxAgeSeconds: 30 }
    );
  }
}
__name(GET2, "GET");

// api/driver.js
var driver_exports = {};
__export(driver_exports, {
  GET: () => GET3
});
async function GET3(request) {
  try {
    const url = new URL(request.url);
    let driverId = url.searchParams.get("driverId");
    if (!driverId) {
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
      { maxAgeSeconds: 60 }
      // short cache for race-sensitive driver info
    );
  } catch (error) {
    return errorResponse(
      error.message || "Driver not found",
      error.message?.includes("not found") ? 404 : 502
    );
  }
}
__name(GET3, "GET");

// api/weather.js
var weather_exports = {};
__export(weather_exports, {
  GET: () => GET4
});
async function GET4(request) {
  try {
    const url = new URL(request.url);
    const sessionKey = url.searchParams.get("session_key") || "latest";
    const weatherData = await getWeather(sessionKey);
    return jsonResponse(
      weatherData,
      { maxAgeSeconds: 60 }
      // weather is refreshed frequently but stays cacheable
    );
  } catch (error) {
    return errorResponse(error.message || "Unable to fetch weather", 502);
  }
}
__name(GET4, "GET");

// api/telemetry.js
var telemetry_exports = {};
__export(telemetry_exports, {
  GET: () => GET5
});
async function GET5(request) {
  try {
    const url = new URL(request.url);
    const params = {
      session_key: url.searchParams.get("session_key") || "latest",
      driver_number: url.searchParams.get("driver_number") || void 0
    };
    const telemetryData = await getTelemetry(params);
    return jsonResponse(
      telemetryData,
      { maxAgeSeconds: 10 }
      // 10 seconds cache for telemetry
    );
  } catch (error) {
    return errorResponse(error.message || "Unable to fetch telemetry", 502);
  }
}
__name(GET5, "GET");

// api/schedule.js
var schedule_exports = {};
__export(schedule_exports, {
  GET: () => GET6
});
async function GET6(request) {
  try {
    const url = new URL(request.url);
    const season = url.searchParams.get("season") || "current";
    const cleanSeason = parseSeason(season);
    return jsonResponse(
      await getSchedule(cleanSeason),
      { maxAgeSeconds: 3600 }
      // 1 hour cache for schedule
    );
  } catch (error) {
    return errorResponse(error.message || "Unable to fetch schedule", 502);
  }
}
__name(GET6, "GET");

// api/thanks.js
var thanks_exports = {};
__export(thanks_exports, {
  POST: () => POST
});
async function POST(request, env) {
  try {
    const data = await request.json();
    console.log("Thanks feedback received:", data);
    return jsonResponse({ success: true, message: "Thank you for supporting Pit Wall!" });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, { status: 400 });
  }
}
__name(POST, "POST");

// api/push.js
var push_exports = {};
__export(push_exports, {
  POST: () => POST2
});
async function POST2(request, env) {
  try {
    const data = await request.json();
    console.log("Push subscription received:", data);
    return jsonResponse({ success: true, message: "Successfully subscribed to push notifications!" });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, { status: 400 });
  }
}
__name(POST2, "POST");

// api/chat.js
var chat_exports = {};
__export(chat_exports, {
  POST: () => POST3
});
async function POST3(request, env) {
  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: "Invalid messages array" }, { status: 400 });
    }
    let context = {};
    try {
      const [driversData, constructorsData, scheduleData] = await Promise.all([
        getDriverStandings("current").catch(() => null),
        getConstructorStandings("current").catch(() => null),
        getSchedule("current").catch(() => null)
      ]);
      const schedule = scheduleData?.schedule || [];
      const nextRace = schedule.find((r) => r.status === "upcoming") || null;
      const lastScheduledRace = [...schedule].reverse().find((r) => r.status === "done") || null;
      const lastRace = lastScheduledRace ? await getLatestRaceResults(scheduleData?.season || "current", lastScheduledRace.round).catch(() => null) : null;
      context = {
        wdc: (driversData?.drivers || []).slice(0, 10).map((d) => `${d.pos}. ${d.name} (${d.team_name}) - ${d.pts} pts`),
        wcc: (constructorsData || []).slice(0, 10).map((c) => `${c.pos}. ${c.name} - ${c.pts} pts`),
        next_race: nextRace ? `${nextRace.name} at ${nextRace.circuit} (${nextRace.locality}, ${nextRace.country}) on ${nextRace.date}` : "Unknown",
        last_race: lastRace ? {
          name: lastRace.name,
          winner: lastRace.podium?.[0]?.driver || "Unknown",
          podium: (lastRace.podium || []).map((p) => `${p.position}. ${p.driver} (${p.team})`)
        } : null
      };
    } catch (e) {
      console.warn("Could not load F1 context for AI:", e);
    }
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      const userQuery = messages[messages.length - 1].content.toLowerCase();
      let reply = "Copy that. I am in local simulation mode. To enable my full capabilities, please configure my OPENAI_API_KEY in wrangler variables.";
      if (userQuery.includes("standings") || userQuery.includes("wdc") || userQuery.includes("wcc") || userQuery.includes("leader") || userQuery.includes("lead") || userQuery.includes("points")) {
        reply = `Copy. Current championship leader is ${context.wdc?.[0] || "unknown"}. Current top constructor standings: ${context.wcc?.[0] || "unknown"}.`;
      } else if (userQuery.includes("next") || userQuery.includes("calendar") || userQuery.includes("race") || userQuery.includes("schedule")) {
        reply = `Copy. The next round on the calendar is ${context.next_race || "unknown"}. Awaiting lights out.`;
      } else if (userQuery.includes("last") || userQuery.includes("winner") || userQuery.includes("podium") || userQuery.includes("won")) {
        if (context.last_race) {
          reply = `Copy. The last race was the ${context.last_race.name}, won by ${context.last_race.winner}. Podium: ${context.last_race.podium.join(", ")}.`;
        } else {
          reply = "Copy. Last race results are currently unavailable.";
        }
      } else if (/\b(hello|hi|hey)\b/.test(userQuery)) {
        reply = "Hello. Pit Wall AI Race Engineer online. Systems nominal. Standing by for telemetry and strategy queries.";
      }
      return jsonResponse({
        choices: [{
          message: {
            role: "assistant",
            content: reply
          }
        }]
      });
    }
    const systemPrompt = `You are "The Pit Wall" AI Race Engineer. You are speaking to an F1 fan.
Your personality is professional, data-driven, precise, and slightly dry, like a real F1 race engineer (e.g. using phrases like "Copy that", "Box box", "Understood", "Pushing now", "Confirmed").
Here is the current real-time context of the F1 season:
- Drivers Standings (Top 10): ${JSON.stringify(context.wdc || [])}
- Constructors Standings: ${JSON.stringify(context.wcc || [])}
- Next Round: ${context.next_race || "None"}
- Last Race: ${context.last_race ? `${context.last_race.name} won by ${context.last_race.winner}. Podium: ${JSON.stringify(context.last_race.podium)}` : "None"}

Use this context to answer user queries accurately. Keep responses concise, sports-focused, and formatted in clean markdown.`;
    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });
    if (!openAiResponse.ok) {
      const errText = await openAiResponse.text();
      throw new Error(`OpenAI API failed: ${errText}`);
    }
    const aiData = await openAiResponse.json();
    return jsonResponse(aiData);
  } catch (error) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}
__name(POST3, "POST");

// worker.js
var routeMap = /* @__PURE__ */ new Map([
  ["/api/standings", standings_exports],
  ["/api/live", live_exports],
  ["/api/weather", weather_exports],
  ["/api/telemetry", telemetry_exports],
  ["/api/schedule", schedule_exports],
  ["/api/thanks", thanks_exports],
  ["/api/push/subscribe", push_exports],
  ["/api/chat", chat_exports]
]);
function serveStatic(request, env) {
  if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
    return env.ASSETS.fetch(request);
  }
  return new Response("Static assets not configured.", { status: 500 });
}
__name(serveStatic, "serveStatic");
async function invokeRoute(mod, request, env, ctx) {
  const method = request.method;
  if (typeof mod[method] === "function") {
    return mod[method](request, env, ctx);
  }
  return new Response("Method not allowed.", { status: 405 });
}
__name(invokeRoute, "invokeRoute");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/driver/")) {
      return invokeRoute(driver_exports, request, env, ctx);
    }
    const moduleRef = routeMap.get(url.pathname);
    if (moduleRef) {
      return invokeRoute(moduleRef, request, env, ctx);
    }
    return serveStatic(request, env);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-jNSnSw/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-jNSnSw/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
