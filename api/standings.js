import { jsonResponse, errorResponse } from "../utils/cache.js";
import {
  getConstructorStandings,
  getDriverStandings,
  getLatestQualifying,
  getLatestRaceResults,
  getSchedule,
  parseSeason,
} from "../utils/jolpica.js";
import {
  getLatestCompletedRaceSession,
  getStints,
  getWeather,
} from "../utils/openf1.js";

function normalizeRaceStints(results = [], stints = []) {
  if (!Array.isArray(results) || !results.length) return null;
  if (!Array.isArray(stints) || !stints.length) return null;

  const podium = results
    .slice(0, 3)
    .filter((result) => result?.number != null)
    .map((result) => ({
      code: result.code || result.short_name || "---",
      num: result.number,
      driver: result.driver || result.short_name || "---",
      stints: [],
    }));

  const byDriverNumber = new Map(
    podium.map((driver) => [Number(driver.num), driver]),
  );
  let totalLaps = 0;

  stints.forEach((stint) => {
    const driverNumber = Number(stint?.driver_number);
    const target = byDriverNumber.get(driverNumber);
    if (!target) return;

    const lapStart = Number(stint?.lap_start || 0);
    const lapEnd = Number(stint?.lap_end || 0);
    if (
      !Number.isFinite(lapStart) ||
      !Number.isFinite(lapEnd) ||
      lapEnd < lapStart
    )
      return;

    const lapCount = lapEnd - lapStart + 1;
    totalLaps = Math.max(totalLaps, lapEnd);
    target.stints.push({
      compound: String(stint?.compound || "").toLowerCase() || null,
      lap_start: lapStart,
      lap_end: lapEnd,
      laps: lapCount,
    });
  });

  const drivers = podium
    .map((driver) => ({
      ...driver,
      stints: driver.stints.sort((a, b) => a.lap_start - b.lap_start),
    }))
    .filter((driver) => driver.stints.length);

  return drivers.length ? { total_laps: totalLaps || 1, drivers } : null;
}

export async function GET(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const season = url.searchParams.get("season") || "current";
    const cleanSeason = parseSeason(season);

    const [drivers, constructors, scheduleData] = await Promise.all([
      getDriverStandings(cleanSeason),
      getConstructorStandings(cleanSeason),
      getSchedule(cleanSeason),
    ]);

    // Find next race and last race from schedule
    const schedule = scheduleData.schedule || [];
    const nextRace = schedule.find((r) => r.status === "upcoming") || null;
    const lastScheduledRace =
      [...schedule].reverse().find((r) => r.status === "done") || null;

    const seasonForRound = scheduleData.season || cleanSeason;
    const lastRace = lastScheduledRace
      ? await getLatestRaceResults(seasonForRound, lastScheduledRace.round)
      : null;

    if (lastRace) {
      const [qualifying, latestCompletedSession] = await Promise.all([
        getLatestQualifying(seasonForRound, lastRace.round),
        getLatestCompletedRaceSession(seasonForRound),
      ]);

      lastRace.qualifying = qualifying;

      if (latestCompletedSession?.session_key != null) {
        const [weatherResponse, stintsResponse] = await Promise.all([
          getWeather(latestCompletedSession.session_key),
          getStints(latestCompletedSession.session_key),
        ]);

        lastRace.weather = weatherResponse?.weather || null;
        lastRace.stints = normalizeRaceStints(
          lastRace.results,
          stintsResponse?.stints || [],
        );
      }
    }

    return jsonResponse(
      {
        season: drivers.season,
        drivers: drivers.drivers,
        constructors: constructors,
        schedule: schedule,
        next_race: nextRace,
        last_race: lastRace,
        source: "Jolpica F1",
        updatedAt: new Date().toISOString(),
      },
      { maxAgeSeconds: 60 }, // short cache for race-sensitive standings
    );
  } catch (error) {
    return errorResponse(error.message || "Unable to fetch standings", 502);
  }
}
