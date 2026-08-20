import { getJolpicaUrl } from "./constants.js";

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Jolpica request failed: ${response.status}`);
  }
  return response.json();
}

// Parse season parameter - accepts 'current' or year like '2026'
export function parseSeason(seasonParam) {
  if (!seasonParam || seasonParam === "current") return "current";
  const year = parseInt(seasonParam, 10);
  if (isNaN(year) || year < 1950 || year > 2100) return "current";
  return String(year);
}

// Map Jolpica constructor names to team IDs for styling
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
    Cadillac: "cadillac",
  };
  return (
    map[constructorName] || constructorName.toLowerCase().replace(/\s+/g, "_")
  );
}

function getDriverDisplayName(driver) {
  return `${driver?.givenName || ""} ${driver?.familyName || ""}`.trim();
}

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
    team_name: constructor.name || "—",
    nationality: driver.nationality || "—",
    gap: idx === 0 ? null : leaderPoints - points,
    pts: points,
    wins: parseInt(entry?.wins || 0, 10),
  };
}

function raceStartUtc(race) {
  if (!race?.date) return null;
  const time = String(race.time || "00:00:00Z");
  const iso = /Z$/.test(time)
    ? `${race.date}T${time}`
    : `${race.date}T${time}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeRaceSchedule(race) {
  const startUtc = raceStartUtc(race);
  const isDone = startUtc ? Date.parse(startUtc) < Date.now() : false;

  return {
    round: parseInt(race.round || 0, 10),
    short_name: race.raceName?.replace(" Grand Prix", "")?.slice(0, 20) || "—",
    name: race.raceName || "—",
    circuit_id: race.Circuit?.circuitId || "unknown",
    circuit: race.Circuit?.circuitName || "—",
    locality: race.Circuit?.Location?.locality || "—",
    country: race.Circuit?.Location?.country || "—",
    date: race.date || null,
    time: race.time || null,
    start_utc: startUtc,
    status: isDone ? "done" : "upcoming",
  };
}

function normalizePodium(results = []) {
  return results.slice(0, 3).map((result) => ({
    position: result.position || result.positionText || "—",
    driver:
      `${result?.Driver?.givenName || ""} ${result?.Driver?.familyName || ""}`.trim(),
    driver_short: result?.Driver?.code || result?.Driver?.driverId || "---",
    team: result?.Constructor?.name || "—",
    team_id: getTeamId(result?.Constructor?.name || ""),
    points: parseFloat(result?.points || 0),
    status: result?.status || "Finished",
    time: result?.Time?.time || result?.Time?.millis || null,
    fastest_lap: result?.FastestLap?.Time?.time || null,
  }));
}

function normalizeRaceResult(result, positionIndex = 0) {
  return {
    pos: parseInt(
      result?.position || result?.positionText || positionIndex + 1,
      10,
    ),
    code: result?.Driver?.code || result?.Driver?.driverId || "---",
    driverId: result?.Driver?.driverId || result?.Driver?.code || "---",
    number: result?.Driver?.permanentNumber || null,
    permanent_number: result?.Driver?.permanentNumber || null,
    short_name:
      result?.Driver?.code ||
      `${result?.Driver?.givenName || ""} ${result?.Driver?.familyName || ""}`.trim() ||
      "---",
    driver:
      `${result?.Driver?.givenName || ""} ${result?.Driver?.familyName || ""}`.trim(),
    team: result?.Constructor?.name || "—",
    team_name: result?.Constructor?.name || "—",
    team_id: getTeamId(result?.Constructor?.name || ""),
    nationality: result?.Driver?.nationality || "—",
    q1: result?.Q1 || null,
    q2: result?.Q2 || null,
    q3: result?.Q3 || null,
    best: result?.Q3 || result?.Q2 || result?.Q1 || null,
    grid: result?.grid || null,
    points: parseFloat(result?.points || 0),
    pts: parseFloat(result?.points || 0),
    status: result?.status || "Finished",
    time: result?.Time?.time || result?.Time?.millis || null,
    fastest_lap: result?.FastestLap?.Time?.time || null,
  };
}

function normalizeFastestLap(results = []) {
  const withFastest = results.find((result) => result?.FastestLap?.Time?.time);
  if (!withFastest) return null;
  return {
    driver:
      `${withFastest?.Driver?.givenName || ""} ${withFastest?.Driver?.familyName || ""}`.trim(),
    driver_short:
      withFastest?.Driver?.code || withFastest?.Driver?.driverId || "---",
    team: withFastest?.Constructor?.name || "—",
    team_id: getTeamId(withFastest?.Constructor?.name || ""),
    time: withFastest?.FastestLap?.Time?.time || null,
  };
}

function normalizeQualifyingRace(race) {
  const results = (race?.QualifyingResults || []).map((entry) => ({
    pos: parseInt(entry?.position || 0, 10),
    driver_short: entry?.Driver?.code || entry?.Driver?.driverId || "---",
    driver:
      `${entry?.Driver?.givenName || ""} ${entry?.Driver?.familyName || ""}`.trim(),
    team: entry?.Constructor?.name || "—",
    team_id: getTeamId(entry?.Constructor?.name || ""),
    q1: entry?.Q1 || null,
    q2: entry?.Q2 || null,
    q3: entry?.Q3 || null,
    best: entry?.Q3 || entry?.Q2 || entry?.Q1 || null,
  }));

  return {
    round: parseInt(race?.round || 0, 10),
    raceName: race?.raceName || "—",
    pole: results[0]
      ? {
          driver: results[0].driver,
          driver_short: results[0].driver_short,
          team: results[0].team,
          team_id: results[0].team_id,
          time: results[0].best,
          year: parseInt(race?.season || parseSeason("current"), 10),
        }
      : null,
    results,
  };
}

function selectRaceByRound(races, targetRound) {
  if (!Array.isArray(races) || !races.length) return null;

  if (targetRound != null) {
    const round = Number.parseInt(targetRound, 10);
    if (Number.isFinite(round)) {
      const exact = races.find(
        (race) => parseInt(race?.round || 0, 10) === round,
      );
      if (exact) return exact;

      const eligible = races
        .filter((race) => parseInt(race?.round || 0, 10) <= round)
        .sort(
          (a, b) => parseInt(a?.round || 0, 10) - parseInt(b?.round || 0, 10),
        );
      if (eligible.length) return eligible[eligible.length - 1];
    }
  }

  return races[races.length - 1] || null;
}

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
      10,
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

export async function getDriverStandings(season = "current") {
  const cleanSeason = parseSeason(season);
  const payload = await fetchJson(
    `${getJolpicaUrl(cleanSeason)}/driverstandings.json`,
  );
  const list = payload?.MRData?.StandingsTable?.StandingsLists?.[0];
  const standings = list?.DriverStandings || [];
  const leaderPts = parseInt(standings[0]?.points || 0, 10);
  return {
    season: list?.season || cleanSeason,
    drivers: standings.map((entry, idx) =>
      normalizeDriverStanding(entry, idx, leaderPts),
    ),
  };
}

export async function getConstructorStandings(season = "current") {
  const cleanSeason = parseSeason(season);
  const payload = await fetchJson(
    `${getJolpicaUrl(cleanSeason)}/constructorstandings.json`,
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
      name: constructor.name || "—",
      nationality: constructor.nationality || "—",
      pts: points,
      pct: leaderPoints > 0 ? Math.round((points / leaderPoints) * 100) : 0,
    };
  });
}

export async function getDriverByCode(code, season = "current") {
  const clean = String(code || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!clean) {
    throw new Error("Driver code is required");
  }

  const cleanSeason = parseSeason(season);
  const payload = await fetchJson(`${getJolpicaUrl(cleanSeason)}/drivers.json`);
  const drivers = payload?.MRData?.DriverTable?.Drivers || [];
  const entry = drivers.find(
    (driver) =>
      String(driver.driverId || "").toLowerCase() === clean ||
      String(driver.code || "").toLowerCase() === clean,
  );

  if (!entry) {
    throw new Error(`No driver found for ${clean}`);
  }

  const driverId = entry.driverId || clean;
  const displayName = getDriverDisplayName(entry);

  const [
    seasonResultsResponse,
    allTimeResultsResponse,
    allTimeQualifyingResponse,
  ] = await Promise.allSettled([
    fetchJson(`${getJolpicaUrl(cleanSeason)}/drivers/${driverId}/results.json`),
    fetchAllRaces(
      `https://api.jolpi.ca/ergast/f1/drivers/${driverId}/results.json`,
    ),
    fetchAllRaces(
      `https://api.jolpi.ca/ergast/f1/drivers/${driverId}/qualifying.json`,
    ),
  ]);

  const seasonResultRaces =
    seasonResultsResponse.status === "fulfilled"
      ? seasonResultsResponse.value?.MRData?.RaceTable?.Races || []
      : [];
  const allTimeResultRaces =
    allTimeResultsResponse.status === "fulfilled"
      ? allTimeResultsResponse.value || []
      : [];
  const allTimeQualifyingRaces =
    allTimeQualifyingResponse.status === "fulfilled"
      ? allTimeQualifyingResponse.value || []
      : [];

  const seasonResults = seasonResultRaces
    .map((race) => {
      const result = race?.Results?.[0] || {};
      return {
        round: parseInt(race?.round || 0, 10),
        short_name: race?.raceName?.replace(" Grand Prix", "") || "Race",
        pos: result?.position || result?.positionText || "—",
        status: result?.status || "Finished",
        points: parseFloat(result?.points || 0),
      };
    })
    .sort((a, b) => b.round - a.round)
    .slice(0, 5);

  const careerWins = allTimeResultRaces.reduce((count, race) => {
    const results = race?.Results || [];
    return (
      count +
      results.filter(
        (result) =>
          String(result?.position || result?.positionText || "") === "1",
      ).length
    );
  }, 0);

  const careerPoles = allTimeQualifyingRaces.reduce((count, race) => {
    const qualifyingResults = race?.QualifyingResults || [];
    return (
      count +
      qualifyingResults.filter((qual) => String(qual?.position || "") === "1")
        .length
    );
  }, 0);

  const currentTeam =
    seasonResultRaces[0]?.Results?.[0]?.Constructor?.name ||
    entry?.Constructor?.name ||
    "—";

  return {
    driverId,
    code: entry.code || "---",
    name: displayName || entry.code || "---",
    given_name: entry.givenName || "",
    family_name: entry.familyName || "",
    permanent_number: entry.permanentNumber || null,
    number: entry.permanentNumber || "—",
    nationality: entry.nationality || "—",
    dateOfBirth: entry.dateOfBirth || null,
    team_id: getTeamId(currentTeam || ""),
    team_name: currentTeam || "—",
    career: {
      wins: careerWins,
      poles: careerPoles,
    },
    season_results: seasonResults,
    source: "Jolpica F1",
    updatedAt: new Date().toISOString(),
  };
}

export async function getSchedule(season = "current") {
  const cleanSeason = parseSeason(season);
  const payload = await fetchJson(`${getJolpicaUrl(cleanSeason)}/races.json`);
  const races = payload?.MRData?.RaceTable?.Races || [];

  return {
    season: payload?.MRData?.RaceTable?.season || cleanSeason,
    schedule: races.map(normalizeRaceSchedule),
    source: "Jolpica F1",
    updatedAt: new Date().toISOString(),
  };
}

export async function getLatestRaceResults(season = "current", round = null) {
  const cleanSeason = parseSeason(season);
  const payload =
    round != null
      ? await fetchJson(`${getJolpicaUrl(cleanSeason)}/${round}/results.json`)
      : await fetchJson(`${getJolpicaUrl(cleanSeason)}/results.json`);
  const races = payload?.MRData?.RaceTable?.Races || [];
  const race =
    round != null ? races[0] || null : selectRaceByRound(races, round);
  if (!race) return null;

  const results = race?.Results || [];
  return {
    round: parseInt(race.round || 0, 10),
    season: race.season || cleanSeason,
    short_name: race.raceName?.replace(" Grand Prix", "") || "—",
    name: race.raceName || "—",
    circuit_id: race.Circuit?.circuitId || "unknown",
    circuit: race.Circuit?.circuitName || "—",
    locality: race.Circuit?.Location?.locality || "—",
    country: race.Circuit?.Location?.country || "—",
    date: race.date || null,
    time: race.time || null,
    start_utc: raceStartUtc(race),
    status: "done",
    results: results.map(normalizeRaceResult),
    podium: normalizePodium(results),
    fastest_lap: normalizeFastestLap(results),
  };
}

export async function getLatestQualifying(season = "current", round = null) {
  const cleanSeason = parseSeason(season);
  const payload =
    round != null
      ? await fetchJson(
          `${getJolpicaUrl(cleanSeason)}/${round}/qualifying.json`,
        )
      : await fetchJson(`${getJolpicaUrl(cleanSeason)}/qualifying.json`);
  const races = payload?.MRData?.RaceTable?.Races || [];
  const race =
    round != null ? races[0] || null : selectRaceByRound(races, round);
  return race ? normalizeQualifyingRace(race) : null;
}
