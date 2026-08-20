import { jsonResponse } from "../utils/cache.js";
import { getLiveSession, getWeather, getLivePositions, getRaceControl } from "../utils/openf1.js";

const DRIVERS_MAP = {
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
  27: { code: "HUL", name: "Nico Hülkenberg", team_id: "sauber", team_name: "Audi", team_color: "#52e252" },
  5: { code: "BOR", name: "Gabriel Bortoleto", team_id: "sauber", team_name: "Audi", team_color: "#52e252" },
  18: { code: "STR", name: "Lance Stroll", team_id: "aston_martin", team_name: "Aston Martin", team_color: "#229977" },
  14: { code: "ALO", name: "Fernando Alonso", team_id: "aston_martin", team_name: "Aston Martin", team_color: "#229977" },
  11: { code: "PER", name: "Sergio Pérez", team_id: "cadillac", team_name: "Cadillac", team_color: "#c0c0c0" },
  77: { code: "BOT", name: "Valtteri Bottas", team_id: "cadillac", team_name: "Cadillac", team_color: "#c0c0c0" },
};

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const sessionKey = url.searchParams.get("session_key") || "latest";

    const [session, weather] = await Promise.all([
      getLiveSession(sessionKey),
      getWeather(sessionKey),
    ]);

    // Check if there's an active session
    const status = String(session?.status || "").toLowerCase();
    const isLive =
      status.includes("live") ||
      status.includes("race") ||
      status.includes("practice") ||
      status.includes("qualifying") ||
      status.includes("sprint");

    let grid = [];
    let raceControl = [];

    if (isLive && session?.sessionKey) {
      const [posData, rcData] = await Promise.all([
        getLivePositions(session.sessionKey),
        getRaceControl(session.sessionKey),
      ]);

      // Process positions to get the latest position for each driver
      const latestPositions = new Map();
      posData.forEach((pos) => {
        const num = Number(pos.driver_number);
        const current = latestPositions.get(num);
        if (!current || new Date(pos.date) > new Date(current.date)) {
          latestPositions.set(num, pos);
        }
      });

      grid = Array.from(latestPositions.values())
        .map((pos) => {
          const num = Number(pos.driver_number);
          const info = DRIVERS_MAP[num] || {
            code: `DRV${num}`,
            name: `Driver ${num}`,
            team_id: "unknown",
            team_name: "Unknown Team",
            team_color: "#888",
          };
          return {
            pos: pos.position,
            driver_number: num,
            code: info.code,
            driver: info.name,
            team_id: info.team_id,
            team: info.team_name,
            team_color: info.team_color,
          };
        })
        .sort((a, b) => a.pos - b.pos);

      // Sort race control messages descending by date
      raceControl = rcData
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((msg) => ({
          flag: msg.flag || msg.category || "rc",
          category: msg.category || null,
          message: msg.message || "",
          date: msg.date,
        }));
    }

    return jsonResponse(
      {
        live: isLive,
        session: isLive
          ? {
              type: session?.session || session?.status || "session",
              country: session?.meeting || "Unknown",
              circuit: session?.meeting || "Unknown",
              status: session?.status || null,
            }
          : null,
        grid,
        race_control: raceControl,
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
