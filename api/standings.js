import { jsonResponse, errorResponse } from "../utils/cache.js";
import {
  getConstructorStandings,
  getDriverStandings,
  getLatestQualifying,
  getLatestRaceResults,
  getSchedule,
  parseSeason,
} from "../utils/jolpica.js";

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
      lastRace.qualifying = await getLatestQualifying(
        seasonForRound,
        lastRace.round,
      );
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
      { maxAgeSeconds: 300 }, // 5 minutes cache for standings
    );
  } catch (error) {
    return errorResponse(error.message || "Unable to fetch standings", 502);
  }
}
