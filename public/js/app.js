/* ================================================================
   THE PIT WALL · live edition
   Hosted at pitwalllive.vercel.app · data via the pit-wall Worker.
   ================================================================ */

const API_URL = (function () {
  const m = document.querySelector('meta[name="pit-wall-api"]');
  if (m && m.content) return m.content;
  return "/api/standings";
})();
const STORAGE_KEY = "pit-wall:v1";
const POLL_MS = 10 * 60 * 1000;
const COUNTRY_FALLBACK = "🏁";

/* country -> flag emoji */
const FLAGS = {
  Australia: "🇦🇺",
  China: "🇨🇳",
  Japan: "🇯🇵",
  USA: "🇺🇸",
  "United States": "🇺🇸",
  UAE: "🇦🇪",
  "United Arab Emirates": "🇦🇪",
  Bahrain: "🇧🇭",
  "Saudi Arabia": "🇸🇦",
  Canada: "🇨🇦",
  Spain: "🇪🇸",
  Monaco: "🇲🇨",
  Azerbaijan: "🇦🇿",
  Hungary: "🇭🇺",
  Belgium: "🇧🇪",
  Netherlands: "🇳🇱",
  Italy: "🇮🇹",
  Singapore: "🇸🇬",
  Mexico: "🇲🇽",
  Brazil: "🇧🇷",
  Qatar: "🇶🇦",
  Austria: "🇦🇹",
  UK: "🇬🇧",
  "United Kingdom": "🇬🇧",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Argentina: "🇦🇷",
};

/* nationality -> 3-letter code */
const NAT3 = {
  Italian: "ITA",
  British: "GBR",
  German: "DEU",
  Spanish: "ESP",
  French: "FRA",
  Dutch: "NED",
  Belgian: "BEL",
  Monegasque: "MON",
  Mexican: "MEX",
  Australian: "AUS",
  Japanese: "JPN",
  Canadian: "CAN",
  American: "USA",
  Brazilian: "BRA",
  Finnish: "FIN",
  Swiss: "SUI",
  Danish: "DEN",
  Polish: "POL",
  Chinese: "CHN",
  Thai: "THA",
  "New Zealander": "NZL",
  Argentine: "ARG",
  Russian: "RUS",
  Austrian: "AUT",
  Swedish: "SWE",
};

/* constructorId (Jolpica) -> CSS team color token */
const TEAM_COLOR = {
  mercedes: "var(--mercedes)",
  ferrari: "var(--ferrari)",
  mclaren: "var(--mclaren)",
  red_bull: "var(--redbull)",
  williams: "var(--williams)",
  haas: "var(--haas)",
  alpine: "var(--alpine)",
  sauber: "var(--audi)",
  audi: "var(--audi)",
  rb: "var(--racingbulls)",
  racing_bulls: "var(--racingbulls)",
  alphatauri: "var(--racingbulls)",
  rb_f1_team: "var(--racingbulls)",
  visa_cash_app_rb: "var(--racingbulls)",
  aston_martin: "var(--aston)",
  cadillac: "var(--cadillac)",
};
const TEAM_DARK = {
  mercedes: true,
  haas: true,
  williams: true,
  racing_bulls: true,
  rb: true,
};
const TEAM_DISPLAY = {
  mercedes: "Mercedes-AMG",
  ferrari: "Scuderia Ferrari",
  mclaren: "McLaren",
  red_bull: "Red Bull Racing",
  williams: "Williams",
  haas: "Haas F1",
  alpine: "Alpine",
  sauber: "Audi",
  audi: "Audi",
  rb: "Racing Bulls",
  racing_bulls: "Racing Bulls",
  alphatauri: "Racing Bulls",
  rb_f1_team: "Racing Bulls",
  visa_cash_app_rb: "Racing Bulls",
  aston_martin: "Aston Martin",
  cadillac: "Cadillac",
};
const TEAM_ENGINE = {
  mercedes: "Mercedes PU",
  ferrari: "Ferrari PU",
  mclaren: "Mercedes PU",
  red_bull: "Red Bull Ford",
  williams: "Mercedes PU",
  haas: "Ferrari PU",
  alpine: "Mercedes PU",
  sauber: "Audi PU",
  audi: "Audi PU",
  rb: "Red Bull Ford",
  racing_bulls: "Red Bull Ford",
  alphatauri: "Red Bull Ford",
  rb_f1_team: "Red Bull Ford",
  visa_cash_app_rb: "Red Bull Ford",
  aston_martin: "Honda PU",
  cadillac: "Ferrari PU",
};

/* fallback driver list for onboarding before first fetch · [code, name, team_id, permanent_number] */
const DEFAULT_DRIVERS = [
  ["ANT", "Andrea Kimi Antonelli", "mercedes", 12],
  ["RUS", "George Russell", "mercedes", 63],
  ["LEC", "Charles Leclerc", "ferrari", 16],
  ["HAM", "Lewis Hamilton", "ferrari", 44],
  ["NOR", "Lando Norris", "mclaren", 1],
  ["PIA", "Oscar Piastri", "mclaren", 81],
  ["VER", "Max Verstappen", "red_bull", 3],
  ["HAD", "Isack Hadjar", "red_bull", 6],
  ["LAW", "Liam Lawson", "racing_bulls", 30],
  ["LIN", "Arvid Lindblad", "racing_bulls", 41],
  ["GAS", "Pierre Gasly", "alpine", 10],
  ["COL", "Franco Colapinto", "alpine", 43],
  ["ALB", "Alex Albon", "williams", 23],
  ["SAI", "Carlos Sainz", "williams", 55],
  ["BEA", "Oliver Bearman", "haas", 87],
  ["OCO", "Esteban Ocon", "haas", 31],
  ["HUL", "Nico Hülkenberg", "sauber", 27],
  ["BOR", "Gabriel Bortoleto", "sauber", 5],
  ["STR", "Lance Stroll", "aston_martin", 18],
  ["ALO", "Fernando Alonso", "aston_martin", 14],
  ["PER", "Sergio Pérez", "cadillac", 11],
  ["BOT", "Valtteri Bottas", "cadillac", 77],
];

/* short team line that shows on driver hover/select in onboarding */
const TEAM_NOTE = {
  mercedes: "Mercedes-AMG · Brackley. Silver Arrows.",
  ferrari: "Scuderia Ferrari · Maranello since 1929.",
  mclaren: "McLaren · Woking. Papaya orange.",
  red_bull: "Red Bull Racing · Milton Keynes. Energy drink dynasty.",
  williams: "Williams · Grove. The garage built on grit.",
  haas: "Haas F1 · Kannapolis. America's grid seat.",
  alpine: "Alpine · Enstone. The French connection.",
  sauber: "Audi · Hinwil. Four rings, big plans.",
  audi: "Audi · Hinwil. Four rings, big plans.",
  rb: "Racing Bulls · Faenza. Red Bull's junior team.",
  racing_bulls: "Racing Bulls · Faenza. Red Bull's junior team.",
  alphatauri: "Racing Bulls · Faenza. Red Bull's junior team.",
  aston_martin: "Aston Martin · Silverstone. The green army.",
  cadillac: "Cadillac · Fishers, Indiana / Silverstone. New for 2026.",
};

/* CIRCUITS · static trivia keyed by Jolpica circuit_id */
const CIRCUITS = {
  albert_park: {
    laps: 58,
    length_km: 5.278,
    lap_record: "1:19.813",
    lap_record_holder: "C. Leclerc · 2024",
    pole_last: "L. Norris · 2025",
  },
  shanghai: {
    laps: 56,
    length_km: 5.451,
    lap_record: "1:32.238",
    lap_record_holder: "M. Schumacher · 2004",
    pole_last: "O. Piastri · 2025",
  },
  suzuka: {
    laps: 53,
    length_km: 5.807,
    lap_record: "1:30.965",
    lap_record_holder: "K. Antonelli · 2025",
    pole_last: "M. Verstappen · 2025",
  },
  miami: {
    laps: 57,
    length_km: 5.412,
    lap_record: "1:29.708",
    lap_record_holder: "M. Verstappen · 2023",
    pole_last: "M. Verstappen · 2025",
  },
  villeneuve: {
    laps: 70,
    length_km: 4.361,
    lap_record: "1:13.078",
    lap_record_holder: "V. Bottas · 2019",
    pole_last: "G. Russell · 2025",
  },
  monaco: {
    laps: 78,
    length_km: 3.337,
    lap_record: "1:12.909",
    lap_record_holder: "L. Hamilton · 2021",
    pole_last: "L. Norris · 2025",
  },
  catalunya: {
    laps: 66,
    length_km: 4.657,
    lap_record: "1:15.743",
    lap_record_holder: "O. Piastri · 2025",
    pole_last: "O. Piastri · 2025",
  },
  red_bull_ring: {
    laps: 71,
    length_km: 4.318,
    lap_record: "1:05.619",
    lap_record_holder: "C. Sainz · 2020",
    pole_last: "L. Norris · 2025",
  },
  silverstone: {
    laps: 52,
    length_km: 5.891,
    lap_record: "1:27.097",
    lap_record_holder: "M. Verstappen · 2020",
    pole_last: "M. Verstappen · 2025",
  },
  spa: {
    laps: 44,
    length_km: 7.004,
    lap_record: "1:44.701",
    lap_record_holder: "S. Pérez · 2024",
    pole_last: "L. Norris · 2025",
  },
  hungaroring: {
    laps: 70,
    length_km: 4.381,
    lap_record: "1:16.627",
    lap_record_holder: "L. Hamilton · 2020",
    pole_last: "C. Leclerc · 2025",
  },
  zandvoort: {
    laps: 72,
    length_km: 4.259,
    lap_record: "1:11.097",
    lap_record_holder: "L. Hamilton · 2021",
    pole_last: "O. Piastri · 2025",
  },
  monza: {
    laps: 53,
    length_km: 5.793,
    lap_record: "1:20.901",
    lap_record_holder: "L. Norris · 2025",
    pole_last: "L. Norris · 2025",
  },
  madring: {
    laps: 57,
    length_km: 5.474,
    lap_record: "—",
    lap_record_holder: "Inaugural race",
    pole_last: "inaugural · 2026",
  },
  baku: {
    laps: 51,
    length_km: 6.003,
    lap_record: "1:43.009",
    lap_record_holder: "C. Leclerc · 2019",
    pole_last: "M. Verstappen · 2025",
  },
  marina_bay: {
    laps: 62,
    length_km: 4.94,
    lap_record: "1:33.808",
    lap_record_holder: "L. Hamilton · 2025",
    pole_last: "G. Russell · 2025",
  },
  americas: {
    laps: 56,
    length_km: 5.513,
    lap_record: "1:36.169",
    lap_record_holder: "C. Leclerc · 2019",
    pole_last: "M. Verstappen · 2025",
  },
  rodriguez: {
    laps: 71,
    length_km: 4.304,
    lap_record: "1:17.774",
    lap_record_holder: "V. Bottas · 2021",
    pole_last: "L. Norris · 2025",
  },
  interlagos: {
    laps: 71,
    length_km: 4.309,
    lap_record: "1:10.540",
    lap_record_holder: "V. Bottas · 2018",
    pole_last: "L. Norris · 2025",
  },
  vegas: {
    laps: 50,
    length_km: 6.201,
    lap_record: "1:33.365",
    lap_record_holder: "M. Verstappen · 2025",
    pole_last: "L. Norris · 2025",
  },
  losail: {
    laps: 57,
    length_km: 5.419,
    lap_record: "1:22.384",
    lap_record_holder: "L. Norris · 2024",
    pole_last: "O. Piastri · 2025",
  },
  yas_marina: {
    laps: 58,
    length_km: 5.281,
    lap_record: "1:25.637",
    lap_record_holder: "K. Magnussen · 2024",
    pole_last: "M. Verstappen · 2025",
  },
};

/* ----- storage ----- */
function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}
function saveConfig(c) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

/* ----- utils ----- */
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");
const titleCase = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);
const firstName = (s = "") =>
  String(s || "")
    .trim()
    .split(/\s+/)[0] || "";
const ord = (n) => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
function shortName(given, family) {
  return `${(given || "").charAt(0)}. ${family || ""}`.trim();
}
function driverFormalName(d) {
  if (!d) return "—";
  if (d.given_name || d.family_name)
    return shortName(d.given_name, d.family_name);
  const full = (d.name || d.driver || "").trim();
  if (full) {
    const parts = full.split(/\s+/);
    if (parts.length >= 2) return shortName(parts[0], parts.slice(1).join(" "));
    return full;
  }
  return d.code || d.short_name || "—";
}
function flagOf(country) {
  return FLAGS[country] || FLAGS[titleCase(country || "")] || COUNTRY_FALLBACK;
}
function teamColor(id) {
  return TEAM_COLOR[id] || "#888";
}
function teamIsDark(id) {
  return TEAM_DARK[id] === true;
}
function teamDisplayName(id, fallback) {
  return TEAM_DISPLAY[id] || fallback || "";
}
function teamEngine(id) {
  return TEAM_ENGINE[id] || "";
}

function fmtDateRange(startUtc) {
  const d = new Date(startUtc);
  if (isNaN(d)) return "—";
  const start = new Date(d);
  start.setUTCDate(start.getUTCDate() - 2);
  const M = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const m1 = M[start.getUTCMonth()],
    d1 = start.getUTCDate();
  const m2 = M[d.getUTCMonth()],
    d2 = d.getUTCDate();
  return m1 === m2
    ? `${m1} ${pad(d1)}–${pad(d2)}`
    : `${m1} ${pad(d1)} – ${m2} ${pad(d2)}`;
}
function shortRaceDate(startUtc) {
  const d = new Date(startUtc);
  if (isNaN(d)) return "—";
  const M = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return `${M[d.getUTCMonth()]} ${pad(d.getUTCDate())}`;
}

/* ================================================================
   GREETING + DATELINE
   ================================================================ */
function paintHeader(cfg) {
  const now = new Date();
  const h = now.getHours();
  const greet =
    h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const name = firstName(cfg && cfg.name);
  $("greeting").textContent = name ? `${greet}, ${name}` : greet;
  const D = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const M = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  $("dateline").textContent =
    `${D[now.getDay()]} · ${pad(now.getDate())} ${M[now.getMonth()]} · ${now.getFullYear()}`;
  $("heroLine1").textContent = name ? `${name}'s` : "Your";
  $("fNote").textContent = name
    ? `For ${name} · Lights out and away we go`
    : "Lights out and away we go";
  document.title = `${name ? `${name}'s ` : ""}Pit Wall · Live F1 2026 Dashboard`;
}

/* ================================================================
   COUNTDOWN
   ================================================================ */
let countdownTimer = null;
function startCountdown(targetUtc) {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  const target = Date.parse(targetUtc);
  if (!Number.isFinite(target)) {
    ["cd-d", "cd-h", "cd-m", "cd-s"].forEach(
      (id) => ($(id).textContent = "--"),
    );
    return;
  }
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      $("cd-d").textContent = "GO";
      $("cd-h").textContent = "!";
      $("cd-m").textContent = "!";
      $("cd-s").textContent = "!";
      return;
    }
    $("cd-d").textContent = pad(Math.floor(diff / 86400000));
    $("cd-h").textContent = pad(Math.floor((diff % 86400000) / 3600000));
    $("cd-m").textContent = pad(Math.floor((diff % 3600000) / 60000));
    $("cd-s").textContent = pad(Math.floor((diff % 60000) / 1000));
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

/* ================================================================
   RACE HERO
   ================================================================ */
function renderRaceHero(data) {
  const r = data.next_race;
  if (!r) {
    $("raceRound").textContent = "◆ Season complete";
    $("raceName").innerHTML = "See you in <em>2027</em>";
    $("raceCircuit").textContent = "";
    $("raceRoundInfo").textContent = "";
    return;
  }
  const isLive = r.status === "live";
  $("raceRound").textContent =
    `◆ Round ${pad(r.round)} · ${isLive ? "LIVE NOW" : "Up Next"}`;
  $("raceFlag").textContent = flagOf(r.country);
  $("raceName").innerHTML =
    `${r.short_name.replace(/ GP$/, "")} <em>Grand Prix</em>`;
  $("raceCircuit").innerHTML =
    `<strong>${r.circuit || ""}</strong>${r.locality ? ` · ${r.locality}` : ""}`;
  const total = (data.schedule || []).length;
  const trivia = CIRCUITS[r.circuit_id] || {};
  $("raceRoundInfo").textContent = total
    ? `Round ${r.round} of ${total}${trivia.laps ? ` · ${trivia.laps} laps · ${trivia.length_km} km` : ""}`
    : "";
  $("rsLapRecord").textContent = trivia.lap_record || "—";
  if (trivia.lap_record_holder)
    $("rsLapRecord").setAttribute("title", trivia.lap_record_holder);
  const livePole = r.last_pole;
  $("rsPole").textContent =
    (livePole && livePole.driver_short) || trivia.pole_last || "—";
  $("rsPoleLabel").textContent =
    livePole && livePole.year ? `Pole ${livePole.year}` : "Last pole";
  $("rsDates").textContent = fmtDateRange(r.start_utc);
  startCountdown(r.start_utc);
}

/* ================================================================
   CALENDAR STRIP
   ================================================================ */
function renderCalendar(data) {
  const strip = $("calStrip");
  const races = data.schedule || [];
  if (!races.length) {
    strip.innerHTML = "";
    return;
  }
  const doneCount = races.filter((r) => r.status === "done").length;
  const pct = Math.round((doneCount / races.length) * 100);
  $("calProgress").style.width = `${pct}%`;
  $("calMeta").textContent =
    `${races.length} Rounds · ${races[0].date.slice(0, 4)} · ${doneCount} done`;

  const winners = buildWinnersMap(data);
  const calBase = window.__firstRender ? 0.25 : 0;
  const calStep = window.__firstRender ? 0.045 : 0;
  const html = races
    .map((r, i) => {
      const cls = ["cal-round"];
      if (r.status === "done") cls.push("done");
      if (
        r.status === "live" ||
        (r.status === "upcoming" && r === data.next_race)
      )
        cls.push("next");
      const label =
        r.status === "live"
          ? `R${pad(r.round)} · LIVE`
          : r === data.next_race && r.status !== "done"
            ? `R${pad(r.round)} · NEXT`
            : `R${pad(r.round)}`;
      const winner = winners[r.round]
        ? `<div class="cal-winner">${winners[r.round]}</div>`
        : "";
      return `<div class="${cls.join(" ")}" style="--cal-delay:${(calBase + calStep * i).toFixed(2)}s;">
      <div class="cal-rnum">${label}<span class="cal-status-dot"></span></div>
      <div class="cal-flag-emoji">${flagOf(r.country)}</div>
      <div class="cal-country">${r.country || ""}</div>
      <div class="cal-flag-name">${r.locality || r.circuit || ""}</div>
      <div class="cal-date">${shortRaceDate(r.start_utc)}</div>
      ${winner}
    </div>`;
    })
    .join("");
  strip.innerHTML = html;

  setTimeout(() => {
    const next =
      strip.querySelector(".cal-round.next") ||
      strip.querySelector(".cal-round.done:last-of-type");
    if (next)
      strip.scrollTo({ left: next.offsetLeft - 60, behavior: "smooth" });
  }, 200);
}

function setupCalendarDrag() {
  const strip = $("calStrip");
  if (!strip || strip.dataset.dragReady) return;
  strip.dataset.dragReady = "1";
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  strip.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    isDown = true;
    strip.classList.add("is-dragging");
    startX = e.pageX;
    scrollLeft = strip.scrollLeft;
  });
  strip.addEventListener("mouseleave", () => {
    isDown = false;
    strip.classList.remove("is-dragging");
  });
  strip.addEventListener("mouseup", () => {
    isDown = false;
    strip.classList.remove("is-dragging");
  });
  strip.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    strip.scrollLeft = scrollLeft - (e.pageX - startX);
  });
}

function buildWinnersMap(data) {
  const m = {};
  if (data.last_race && data.last_race.podium && data.last_race.podium[0]) {
    m[data.last_race.round] =
      data.last_race.podium[0].driver_short || data.last_race.podium[0].driver;
  }
  return m;
}

/* ================================================================
   DRIVERS LIST
   ================================================================ */
function renderDrivers(data, cfg) {
  const list = $("driversList");
  const drivers = (data.drivers || []).slice(0, 10);
  if (!drivers.length) {
    list.innerHTML = "";
    return;
  }
  $("driversSub").textContent =
    `Top ${drivers.length} · ${(data.schedule || []).filter((r) => r.status === "done").length} rounds in`;
  const base = window.__firstRender ? 0.4 : 0;
  const step = window.__firstRender ? 0.13 : 0;
  list.innerHTML = drivers
    .map((d, i) => {
      const colour = teamColor(d.team_id);
      const dark = teamIsDark(d.team_id) ? "color:#000;" : "";
      const isFav = cfg && cfg.driverCode && d.code === cfg.driverCode;
      const leader = i === 0 ? " leader" : "";
      const fav = isFav ? " is-fav" : "";
      const teamDisp = teamDisplayName(d.team_id, d.team_name || d.team);
      const nat =
        NAT3[d.nationality] || (d.nationality || "").slice(0, 3).toUpperCase();
      const pts = d.pts ?? d.points ?? 0;
      const gapVal = d.gap;
      const gap =
        gapVal == null || gapVal === 0
          ? ""
          : ` · <span class="gap">${gapVal > 0 ? "+" : ""}${gapVal}</span>`;
      return `<div class="driver-row${leader}${fav}" style="--team-color: ${colour}; animation-delay:${(base + step * i).toFixed(2)}s;">
      <div class="driver-pos">${pad(d.pos)}</div>
      <div class="driver-info">
        <div class="driver-line"><span class="driver-name">${driverFormalName(d)}</span><span class="driver-code" style="background:${colour};${dark}">${d.code || ""}</span></div>
        <div class="driver-team">${teamDisp} · ${nat}${gap}</div>
      </div>
      <div class="driver-pts-wrap"><div class="driver-pts">${pts}</div><div class="driver-pts-sub">pts</div></div>
    </div>`;
    })
    .join("");
}

/* ================================================================
   CONSTRUCTORS LIST
   ================================================================ */
function renderConstructors(data) {
  const list = $("constructorsList");
  const cons = data.constructors || [];
  if (!cons.length) {
    list.innerHTML = "";
    return;
  }
  $("constructorsSub").textContent = `All ${cons.length} teams · 2026`;
  const base = window.__firstRender ? 0.55 : 0;
  const step = window.__firstRender ? 0.12 : 0;
  list.innerHTML = cons
    .map((c, i) => {
      const colour = teamColor(c.id);
      const disp = teamDisplayName(c.id, c.name);
      const engine = teamEngine(c.id);
      const nat =
        NAT3[c.nationality] || (c.nationality || "").slice(0, 3).toUpperCase();
      return `<div class="con-row" style="--team-color: ${colour}; animation-delay:${(base + step * i).toFixed(2)}s;">
      <div class="con-top">
        <div class="con-pos">${pad(c.pos)}</div>
        <div><div class="con-name">${disp}</div><div class="con-engine">${engine}${nat ? " · " + nat : ""}</div>${heritageLine(c.id)}</div>
        <div class="con-pts">${c.pts}</div>
      </div>
      <div class="con-bar"><div class="con-bar-fill" style="width:${c.pct || 0}%; animation-delay:${(base + step * i + 0.5).toFixed(2)}s;"></div></div>
    </div>`;
    })
    .join("");
}

/* ================================================================
   PODIUM (last race)
   ================================================================ */
function renderPodium(data) {
  const lr = data.last_race;
  if (!lr || !lr.podium || !lr.podium.length) {
    $("podiumHead").textContent = "Season opens soon — no race results yet";
    $("podiumList").innerHTML = "";
    return;
  }
  $("podiumHead").textContent =
    `${lr.short_name} · ${lr.circuit || lr.country} · Result`;
  const podBase = window.__firstRender ? 1.1 : 0;
  const podStep = window.__firstRender ? 0.18 : 0;
  $("podiumList").innerHTML = lr.podium
    .map((p, i) => {
      const pcls = ["p1", "p2", "p3"][i] || "p3";
      const num = p.number ? `· #${p.number}` : "";
      return `<div class="pod-row ${pcls}" style="--pod-delay:${(podBase + podStep * i).toFixed(2)}s;">
      <div class="pod-badge">P${i + 1}</div>
      <div><div class="pod-driver-name">${p.driver}</div><div class="pod-driver-team">${teamDisplayName(p.team_id, p.team)} ${num}</div></div>
      <div class="pod-time">${p.time || ""}</div>
    </div>`;
    })
    .join("");
}

/* ================================================================
   NEWS / INTEL · derived facts from data
   ================================================================ */
function renderNews(data) {
  const items = [];
  const lr = data.last_race;
  const drivers = data.drivers || [];
  const cons = data.constructors || [];

  if (lr && lr.podium && lr.podium[0]) {
    const w = lr.podium[0];
    items.push({
      kicker: "Last Race",
      title: `${w.driver} wins ${lr.short_name}`,
      body:
        lr.podium.length >= 3
          ? `${w.driver} (${teamDisplayName(w.team_id, w.team)}) led ${lr.podium[1].driver_short || lr.podium[1].driver} and ${lr.podium[2].driver_short || lr.podium[2].driver} home at ${lr.circuit || lr.country}.`
          : `${w.driver} took the top step at ${lr.circuit || lr.country}.`,
    });
  }
  if (lr && lr.fastest_lap && lr.fastest_lap.time) {
    items.push({
      kicker: "Fastest Lap",
      title: `${lr.fastest_lap.driver} sets ${lr.fastest_lap.time} at ${lr.short_name}`,
      body: `Fastest tour of the race on lap ${lr.fastest_lap.lap || "—"}. Worth a point if they finished in the top ten.`,
    });
  }
  if (drivers.length >= 2) {
    const lead = drivers[0],
      p2 = drivers[1];
    const gap = lead.pts - p2.pts;
    items.push({
      kicker: "Championship",
      title: `${driverFormalName(lead)} leads ${driverFormalName(p2)} by ${gap} ${gap === 1 ? "point" : "points"}`,
      body: `${teamDisplayName(lead.team_id, lead.team_name)} versus ${teamDisplayName(p2.team_id, p2.team_name)} at the front of the order, ${lead.wins} win${lead.wins === 1 ? "" : "s"} this year.`,
    });
  }
  if (cons.length >= 2) {
    const t1 = cons[0],
      t2 = cons[1];
    items.push({
      kicker: "Constructors",
      title: `${teamDisplayName(t1.id, t1.name)} top, ${teamDisplayName(t2.id, t2.name)} chasing`,
      body: `${t1.pts} to ${t2.pts}. ${t1.wins} race${t1.wins === 1 ? "" : "s"} on the wall for ${teamDisplayName(t1.id, t1.name)} this season.`,
    });
  }

  const block = $("newsBlock");
  const newsBase = window.__firstRender ? 1.5 : 0;
  const newsStep = window.__firstRender ? 0.18 : 0;
  block.innerHTML = items
    .slice(0, 4)
    .map((it, i) => {
      const cls =
        i === 0 ? "news-item lead" : "news-item" + (i === 3 ? "" : " neutral");
      return `<article class="${cls}" style="--news-delay:${(newsBase + newsStep * i).toFixed(2)}s;">
      <div class="news-meta"><span class="news-kicker">${it.kicker}</span><span class="news-num">${pad(i + 1)}</span></div>
      <h3 class="news-headline">${it.title}</h3>
      <p class="news-body">${it.body}</p>
    </article>`;
    })
    .join("");
}

/* ================================================================
   ON TRACK · virtual circuit with animated cars
   ================================================================ */
function renderOnTrack(data, cfg) {
  const carsG = $("ontrackCars");
  const legend = $("ontrackLegend");
  const status = $("ontrackStatus");
  const pathEl = $("raceLine");
  const glowEl = $("raceLineGlow");
  if (!carsG || !legend || !pathEl) return;

  const drivers = (data.drivers || []).slice(0, 10);
  if (!drivers.length) {
    carsG.innerHTML = "";
    legend.innerHTML = "";
    return;
  }

  // Swap circuit path for the next race
  const circuitId = data.next_race && data.next_race.circuit_id;
  const pathD = pathForCircuit(circuitId);
  pathEl.setAttribute("d", pathD);
  if (glowEl) glowEl.setAttribute("d", pathD);

  // Reposition T1 mark roughly at the path's first peak (approx visual top of curve)
  const t1 = $("trackMarkT1");
  if (t1) t1.setAttribute("x", String(Math.round(700 + Math.random() * 0)));

  const favCode = cfg && cfg.driverCode;
  const isLive = data.next_race && data.next_race.status === "live";
  status.textContent = data.last_race
    ? `latest race · ${data.last_race.short_name}`
    : isLive
      ? "session live"
      : "paddock laps";

  // Cars: render as SVG groups inside the SVG so they scale with the viewBox.
  // Use animateMotion+mpath so they follow the same path the circuit uses.
  carsG.innerHTML = drivers
    .map((d, i) => {
      const col = teamColor(d.team_id);
      const dur = (8.5 + i * 0.42).toFixed(2);
      const delay = (-i * 1.05).toFixed(2);
      const fav = favCode && d.code === favCode;
      const bodyAttrs = fav
        ? 'x="-15" y="-6" width="30" height="12" rx="6"'
        : 'x="-12" y="-5" width="24" height="10" rx="5"';
      const stroke = fav
        ? 'stroke="#d4a017" stroke-width="2"'
        : 'stroke="rgba(10,10,10,0.55)" stroke-width="0.6"';
      const fang = fav
        ? '<rect x="11" y="-7" width="5" height="14" rx="2" fill="' +
          col +
          '" stroke="#d4a017" stroke-width="1.5"/>'
        : '<rect x="11" y="-6" width="4" height="12" rx="1.5" fill="' +
          col +
          '" stroke="rgba(10,10,10,0.55)" stroke-width="0.5"/>';
      return `<g class="ot-car-g">
      ${fang}
      <rect ${bodyAttrs} fill="${col}" ${stroke}/>
      <line x1="-5" y1="0" x2="5" y2="0" stroke="rgba(255,255,255,0.85)" stroke-width="1.4" stroke-linecap="round"/>
      <animateMotion dur="${dur}s" repeatCount="indefinite" rotate="auto" begin="${delay}s"><mpath href="#raceLine"/></animateMotion>
    </g>`;
    })
    .join("");

  // Legend: show top 3 + favorite if outside top 3
  const shown = [];
  drivers.slice(0, 3).forEach((d) => shown.push(d));
  if (favCode) {
    const fav = drivers.find((d) => d.code === favCode);
    if (fav && !shown.includes(fav)) shown.push(fav);
  }
  legend.innerHTML = shown
    .map((d) => {
      const col = teamColor(d.team_id);
      const isFav = favCode && d.code === favCode;
      return `<span class="lg-item${isFav ? " lg-fav" : ""}"><span class="lg-dot" style="--lg-color:${col};"></span>${d.code} &middot; ${driverFormalName(d)}${isFav ? " &middot; yours" : ""}</span>`;
    })
    .join("");
}

/* circuit-specific path styles · 1400x110 viewBox, stylised not literal */
const CIRCUIT_PATH_STYLES = {
  street_tight:
    "M 60 90 L 180 70 Q 220 55, 260 90 L 340 80 Q 380 50, 440 80 L 580 90 Q 640 60, 720 88 L 920 92 Q 980 55, 1040 88 L 1340 82",
  sweeping_fast: "M 60 95 C 250 18, 500 110, 720 56 S 1100 130, 1340 50",
  long_straights:
    "M 60 90 L 380 85 Q 460 55, 540 92 L 940 80 Q 1040 50, 1120 92 L 1340 82",
  technical:
    "M 60 92 C 200 30, 360 35, 540 78 S 880 130, 1060 68 S 1200 38, 1340 88",
  figure_8:
    "M 60 95 C 220 22, 400 110, 560 65 S 900 130, 1060 60 S 1200 22, 1340 85",
  modern_flow: "M 60 92 Q 200 60, 360 70 T 600 90 Q 760 50, 920 80 T 1340 70",
  default:
    "M 60 90 C 200 20, 360 20, 540 70 S 880 130, 1060 70 S 1200 30, 1340 80",
};
const CIRCUIT_TO_STYLE = {
  monaco: "street_tight",
  baku: "street_tight",
  marina_bay: "street_tight",
  vegas: "long_straights",
  spa: "sweeping_fast",
  silverstone: "sweeping_fast",
  americas: "sweeping_fast",
  zandvoort: "sweeping_fast",
  suzuka: "figure_8",
  monza: "long_straights",
  villeneuve: "long_straights",
  shanghai: "long_straights",
  catalunya: "technical",
  hungaroring: "technical",
  red_bull_ring: "technical",
  interlagos: "technical",
  yas_marina: "modern_flow",
  losail: "modern_flow",
  rodriguez: "modern_flow",
  albert_park: "modern_flow",
  miami: "modern_flow",
  madring: "technical",
};
function pathForCircuit(circuitId) {
  const key = CIRCUIT_TO_STYLE[circuitId] || "default";
  return CIRCUIT_PATH_STYLES[key] || CIRCUIT_PATH_STYLES.default;
}

/* ================================================================
   STATS RIBBON
   ================================================================ */
function renderStatsRibbon(data, cfg) {
  const drivers = data.drivers || [];
  const lr = data.last_race;

  if (drivers.length >= 2) {
    const gap = drivers[0].pts - drivers[1].pts;
    $("statLeadBig").innerHTML = `<em>+${gap}</em> pts`;
    $("statLeadSub").textContent =
      `${driverFormalName(drivers[0])} over ${driverFormalName(drivers[1])}`;
  } else {
    $("statLeadBig").innerHTML = `<em>—</em>`;
    $("statLeadSub").textContent = "Season opens soon";
  }

  if (lr && lr.fastest_lap && lr.fastest_lap.time) {
    $("statFLBig").textContent = lr.fastest_lap.time;
    $("statFLSub").textContent =
      `${driverFormalName({ driver: lr.fastest_lap.driver, name: lr.fastest_lap.driver })} · ${lr.short_name}`;
  } else {
    $("statFLBig").textContent = "—";
    $("statFLSub").textContent = "—";
  }

  if (lr && lr.podium && lr.podium[0]) {
    const w = lr.podium[0];
    $("statWinnerBig").textContent = driverFormalName(w);
    $("statWinnerSub").textContent =
      `${teamDisplayName(w.team_id, w.team)} · ${lr.short_name}`;
  } else {
    $("statWinnerBig").textContent = "—";
    $("statWinnerSub").textContent = "—";
  }

  if (cfg && cfg.driverCode) {
    const fav = drivers.find((d) => d.code === cfg.driverCode);
    if (fav) {
      $("statFavBig").innerHTML = `P${fav.pos} <em>·</em> ${fav.pts} pts`;
      $("statFavSub").textContent =
        `${driverFormalName(fav)} · ${teamDisplayName(fav.team_id, fav.team_name)}`;
    } else {
      $("statFavBig").innerHTML = `<em>${cfg.driverCode}</em>`;
      $("statFavSub").textContent = "No data yet";
    }
  } else {
    $("statFavBig").innerHTML = `<em>—</em>`;
    $("statFavSub").textContent = "Pick a driver";
  }
}

/* ================================================================
   TICKER
   ================================================================ */
function renderTicker(data, cfg) {
  const items = [];
  const drv = (data.drivers || [])[0];
  const con = (data.constructors || [])[0];
  const lr = data.last_race;
  const next = data.next_race;

  if (drv)
    items.push({
      sym: "WDC",
      val: drv.short_name.toUpperCase(),
      pts: `${drv.pts} pts`,
    });
  if (con)
    items.push({
      sym: "WCC",
      val: teamDisplayName(con.id, con.name).toUpperCase(),
      pts: `${con.pts} pts`,
    });
  if (next)
    items.push({
      sym: "NEXT",
      val: (next.short_name || "").toUpperCase(),
      pts: shortRaceDate(next.start_utc),
    });
  if (lr && lr.podium && lr.podium[0])
    items.push({
      sym: "WINNER",
      val: (lr.podium[0].driver_short || lr.podium[0].driver).toUpperCase(),
      pts: (lr.short_name || "").toUpperCase(),
    });
  if (lr && lr.fastest_lap && lr.fastest_lap.time)
    items.push({
      sym: "FL",
      val: lr.fastest_lap.driver.toUpperCase(),
      pts: lr.fastest_lap.time,
    });
  if (cfg && cfg.driverCode) {
    const fav = (data.drivers || []).find((d) => d.code === cfg.driverCode);
    if (fav)
      items.push({
        sym: cfg.driverCode,
        val: `P${fav.pos}`,
        pts: `${fav.pts} pts`,
      });
  }
  if (data._stale)
    items.push({ sym: "CACHE", val: "SHOWING LAST SNAPSHOT", pts: "" });

  if (!items.length) items.push({ sym: "LIVE", val: "LOADING", pts: "" });
  const mk = (it) =>
    `<span class="tick"><span class="sym">${it.sym}</span> <span class="val">${it.val}</span>${it.pts ? ` <span class="pts">${it.pts}</span>` : ""}</span><span class="tick tick-dot">◆</span>`;
  const half = items.map(mk).join("");
  $("tkTrack").innerHTML = half + half;
}

/* ================================================================
   LIVE INDICATOR
   ================================================================ */
function paintLiveIndicator(data, errored) {
  const el = $("liveIndicator");
  el.classList.remove("stale", "error");
  if (errored) {
    el.classList.add("error");
    $("liTime").textContent = "offline";
  } else if (data && data._stale) {
    el.classList.add("stale");
    $("liTime").textContent = relTime(new Date(data._stale_since_utc));
  } else if (data && data._fetched_at_utc) {
    $("liTime").textContent = relTime(new Date(data._fetched_at_utc));
  } else {
    $("liTime").textContent = "just now";
  }
  el.classList.add("ready");
}
function relTime(d) {
  const sec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.round(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)} hr ago`;
  return `${Math.round(sec / 86400)} d ago`;
}

/* ================================================================
   ONBOARDING · cinematic
   ================================================================ */
function showOnboarding(prefill) {
  const root = $("onbRoot");
  const step1 = $("onbStep1");
  const step2 = $("onbStep2");
  const nameInput = $("onbName");
  const next1 = $("onbNext1");
  const next2 = $("onbNext2");
  const back2 = $("onbBack2");
  const grid = $("onbDrivers");
  const callout = $("onbCallout");
  const calloutText = $("onbCalloutText");

  // Hard reset for replay of CSS animations.
  root.classList.remove("hidden", "fading", "flashing");
  root.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  // toggle display to retrigger animations on second open
  root.style.display = "none";
  void root.offsetWidth;
  root.style.display = "";

  // Reset stages
  step1.classList.remove("hidden", "slide-out");
  step1.classList.add("slide-in");
  step2.classList.add("hidden");
  step2.classList.remove("slide-out", "slide-in");

  let chosenName = (prefill && prefill.name) || "";
  let chosenCode = (prefill && prefill.driverCode) || "";

  nameInput.value = chosenName;
  next1.disabled = !chosenName.trim();
  setTimeout(() => nameInput.focus(), 800);

  nameInput.oninput = () => {
    chosenName = nameInput.value.trim();
    next1.disabled = !chosenName;
  };
  nameInput.onkeydown = (e) => {
    if (e.key === "Enter" && !next1.disabled) next1.click();
  };

  next1.onclick = () => {
    step1.classList.remove("slide-in");
    step1.classList.add("slide-out");
    setTimeout(() => {
      step1.classList.add("hidden");
      step2.classList.remove("hidden");
      step2.classList.add("slide-in");
      paintDriverGrid();
    }, 480);
  };
  back2.onclick = () => {
    step2.classList.remove("slide-in");
    step2.classList.add("slide-out");
    setTimeout(() => {
      step2.classList.add("hidden");
      step1.classList.remove("hidden", "slide-out");
      step1.classList.add("slide-in");
      nameInput.focus();
    }, 380);
  };

  function paintDriverGrid() {
    const drivers =
      window.__latestData &&
      window.__latestData.drivers &&
      window.__latestData.drivers.length
        ? window.__latestData.drivers.map((d) => [
            d.code,
            `${d.given_name} ${d.family_name}`,
            d.team_id,
            d.permanent_number,
          ])
        : DEFAULT_DRIVERS;
    grid.innerHTML = drivers
      .map(
        ([code, name, team, num], i) => `
      <button type="button" class="onb-drv${code === chosenCode ? " selected" : ""}"
              data-code="${code}" data-team="${team}"
              style="--drv-color:${teamColor(team)}; --drv-delay:${(0.05 + i * 0.035).toFixed(2)}s;"
              role="option" aria-selected="${code === chosenCode}">
        <span class="drv-num">${num || ""}</span>
        <span class="drv-code">${code}</span>
        <span class="drv-name">${name}</span>
        <span class="drv-team">${teamDisplayName(team, "")}</span>
      </button>
    `,
      )
      .join("");

    grid.querySelectorAll(".onb-drv").forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        const team = btn.getAttribute("data-team");
        updateCallout(team, btn.querySelector(".drv-name").textContent);
      });
      btn.addEventListener("mouseleave", () => {
        if (!chosenCode) {
          calloutText.textContent = "scroll · tap a card to lock your colour";
          callout.classList.remove("show");
        } else {
          // restore selected callout
          const sel = grid.querySelector(".onb-drv.selected");
          if (sel)
            updateCallout(
              sel.getAttribute("data-team"),
              sel.querySelector(".drv-name").textContent,
            );
        }
      });
      btn.addEventListener("click", (ev) => {
        grid.querySelectorAll(".onb-drv.selected").forEach((b) => {
          b.classList.remove("selected");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("selected");
        btn.setAttribute("aria-selected", "true");
        chosenCode = btn.getAttribute("data-code");
        const team = btn.getAttribute("data-team");
        next2.disabled = false;
        updateCallout(team, btn.querySelector(".drv-name").textContent);
        // briefly bounce the selected card
        btn.animate(
          [
            { transform: "translateY(-1px) scale(1)" },
            { transform: "translateY(-4px) scale(1.02)" },
            { transform: "translateY(-1px) scale(1)" },
          ],
          { duration: 320, easing: "cubic-bezier(.2,.9,.25,1)" },
        );
        spawnParticles(btn, teamColor(team));
        // briefly shift root --accent so callout colour previews the team
        document.documentElement.style.setProperty(
          "--accent",
          rawTeamHex(team) || "#e10600",
        );
      });
    });

    next2.disabled = !chosenCode;
    if (chosenCode) {
      const sel = grid.querySelector(".onb-drv.selected");
      if (sel)
        updateCallout(
          sel.getAttribute("data-team"),
          sel.querySelector(".drv-name").textContent,
        );
    } else {
      calloutText.textContent = "scroll · tap a card to lock your colour";
    }
  }

  function updateCallout(teamId, driverName) {
    const note = TEAM_NOTE[teamId] || teamDisplayName(teamId, "");
    calloutText.innerHTML = `<strong>${driverName.toUpperCase()}</strong> &middot; ${note}`;
    callout.classList.add("show");
  }

  next2.onclick = () => {
    const cfg = {
      name: chosenName,
      driverCode: chosenCode,
      savedAt: new Date().toISOString(),
    };
    saveConfig(cfg);
    const selBtn = grid.querySelector(".onb-drv.selected");
    if (selBtn) {
      const col =
        getComputedStyle(selBtn).getPropertyValue("--drv-color").trim() ||
        "#e10600";
      root.style.setProperty("--drv-color", col);
      // bigger particle burst from the centre on confirm
      spawnParticles(next2, col, 36);
    }
    root.classList.add("flashing");
    setTimeout(() => closeOnboarding(cfg), 620);
  };
}

function spawnParticles(originEl, colour, count = 18) {
  const layer = $("onbParticles");
  if (!layer) return;
  const rect = originEl.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const cx = rect.left + rect.width / 2 - layerRect.left;
  const cy = rect.top + rect.height / 2 - layerRect.top;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "onb-particle";
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 70 + Math.random() * 110;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const size = 5 + Math.random() * 7;
    p.style.left = cx - size / 2 + "px";
    p.style.top = cy - size / 2 + "px";
    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.setProperty("--particle-color", colour);
    p.style.setProperty("--px", dx + "px");
    p.style.setProperty("--py", dy + "px");
    p.style.animationDuration = 700 + Math.random() * 400 + "ms";
    layer.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

function closeOnboarding(cfg) {
  const root = $("onbRoot");
  root.classList.add("fading");
  setTimeout(() => {
    root.classList.add("hidden");
    root.classList.remove("flashing");
    root.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    applyConfig(cfg);
  }, 560);
}

/* ================================================================
   COLOPHON modal (kept from template)
   ================================================================ */
(function () {
  const modal = document.getElementById("colophon-modal");
  const openBtn = document.getElementById("openColophon");
  if (!modal || !openBtn) return;
  const closeBtn = modal.querySelector(".colo-close");
  const backdrop = modal.querySelector(".colo-backdrop");
  function open() {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("open"));
    document.body.classList.add("colo-open");
    if (closeBtn) closeBtn.focus();
  }
  function close() {
    modal.classList.remove("open");
    document.body.classList.remove("colo-open");
    setTimeout(() => {
      modal.hidden = true;
    }, 300);
  }
  openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (backdrop) backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
})();

/* ================================================================
   DATA FETCH + POLL
   ================================================================ */
let pollTimer = null;
async function fetchAndRender(cfg) {
  try {
    const r = await fetch(API_URL, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!r.ok) throw new Error("http " + r.status);
    const data = await r.json();
    window.__latestData = data;
    renderAll(data, cfg);
    paintLiveIndicator(data, false);
  } catch (e) {
    console.warn("fetch failed", e);
    paintLiveIndicator(null, true);
    if (!window.__latestData) {
      // first paint failed entirely. Leave skeleton state but show indicator error.
      $("podiumHead").textContent = "Data offline — refresh in a minute";
    }
  }
}
function renderAll(data, cfg) {
  applyTheme(cfg, data);
  paintHeader(cfg);
  renderLiveBanner(data);
  renderTicker(data, cfg);
  renderRaceHero(data);
  renderOnTrack(data, cfg);
  renderNextRaces(data);
  renderCalendar(data);
  renderDrivers(data, cfg);
  renderConstructors(data);
  renderPodium(data);
  renderNews(data);
  renderWeather(data);
  renderStints(data);
  renderSpotlight(data, cfg);
  renderQualifying(data);
  renderStatsRibbon(data, cfg);
  fetchTelemetry(cfg);
  hideSplash();
  if (window.__firstRender) {
    setTimeout(() => {
      window.__firstRender = false;
    }, 3500);
  }
}

/* ================================================================
   LIVE SESSION · poll /api/live every 30 s while a session is live
   ================================================================ */
let liveTimer = null;
async function fetchLive() {
  try {
    const r = await fetch("/api/live");
    if (!r.ok) return;
    const data = await r.json();
    const sec = $("livegridSection");
    if (!sec) return;
    if (data.live) {
      sec.style.display = "block";
      updateNavLiveItems(true);
      const lbl = $("livegridLabel");
      const meta = $("livegridMeta");
      if (lbl)
        lbl.textContent = `${data.session.type} · ${data.session.country}`;
      if (meta)
        meta.textContent = `${data.session.circuit || ""} · refreshing every 30s`;
      const body = $("livegridBody");
      if (body && Array.isArray(data.grid)) {
        body.innerHTML = data.grid
          .map(
            (g) => `
          <div class="lg-row" style="--lg-color:${g.team_color || "#888"};">
            <div class="lg-pos">${g.pos}</div>
            <div class="lg-stripe"></div>
            <div><div class="lg-name">${driverFormalName(g)}</div><div class="lg-team">${g.team || ""}</div></div>
          </div>
        `,
          )
          .join("");
      }
      const rc = $("livegridRc");
      if (rc && Array.isArray(data.race_control) && data.race_control.length) {
        rc.innerHTML = data.race_control
          .slice(0, 4)
          .map(
            (m) =>
              `<div class="rc-line"><strong>${m.flag || m.category || "rc"}</strong> · ${escapeHtml(m.message || "").slice(0, 200)}</div>`,
          )
          .join("");
      } else if (rc) rc.innerHTML = "";
    } else {
      sec.style.display = "none";
      updateNavLiveItems(false);
    }
  } catch {}
}
function startLivePoll() {
  if (liveTimer) clearInterval(liveTimer);
  fetchLive();
  liveTimer = setInterval(fetchLive, 30 * 1000);
}

/* ================================================================
   LIVE BANNER · sticky top strip when a race is actively running
   ================================================================ */
function renderLiveBanner(data) {
  const el = $("liveBanner");
  const text = $("liveBannerText");
  if (!el) return;
  const r = data && data.next_race;
  if (r && r.status === "live") {
    text.innerHTML = `live now &middot; <em>${r.short_name || r.name}</em> &middot; ${r.country || ""} &middot; lights are out`;
    el.classList.add("show");
  } else {
    el.classList.remove("show");
  }
}

/* ================================================================
   LOADING SPLASH · hide on first data
   ================================================================ */
let splashHidden = false;
function hideSplash() {
  if (splashHidden) return;
  splashHidden = true;
  const sp = $("splash");
  if (!sp) return;
  setTimeout(() => {
    sp.classList.add("gone");
    setTimeout(() => sp.remove(), 700);
  }, 250);
}

/* ================================================================
   WEATHER (OpenF1) for last race
   ================================================================ */
function renderWeather(data) {
  const stats = $("weatherStats");
  const when = $("weatherWhen");
  if (!stats) return;
  const w = data && data.last_race && data.last_race.weather;
  if (!w) {
    stats.innerHTML = `<div class="weather-stat"><div class="ws-label">Air Temp</div><div class="ws-value">—</div></div>
      <div class="weather-stat"><div class="ws-label">Track Temp</div><div class="ws-value">—</div></div>
      <div class="weather-stat"><div class="ws-label">Humidity</div><div class="ws-value">—</div></div>
      <div class="weather-stat"><div class="ws-label">Rain</div><div class="ws-value">—</div></div>`;
    if (when)
      when.textContent = data.last_race
        ? data.last_race.short_name || "—"
        : "no data";
    return;
  }
  stats.innerHTML = `
    <div class="weather-stat"><div class="ws-label">Air Temp</div><div class="ws-value">${w.air_temp != null ? w.air_temp.toFixed(1) : "—"}<small>°C</small></div></div>
    <div class="weather-stat"><div class="ws-label">Track Temp</div><div class="ws-value">${w.track_temp != null ? w.track_temp.toFixed(1) : "—"}<small>°C</small></div></div>
    <div class="weather-stat"><div class="ws-label">Humidity</div><div class="ws-value">${w.humidity != null ? Math.round(w.humidity) : "—"}<small>%</small></div></div>
    <div class="weather-stat"><div class="ws-label">Rain</div><div class="ws-value">${w.rain_pct != null ? w.rain_pct : "—"}<small>%</small></div></div>
  `;
  if (when) when.textContent = data.last_race ? data.last_race.short_name : "—";
}

/* ================================================================
   TIRE STINTS (OpenF1) for top finishers of last race
   ================================================================ */
function renderStints(data) {
  const body = $("stintsBody");
  if (!body) return;
  const s = data && data.last_race && data.last_race.stints;
  if (!s || !s.drivers || !s.drivers.length) {
    body.innerHTML =
      '<div style="color:var(--ink-3); font-size:12px; letter-spacing:.14em; text-transform:uppercase; padding:8px 0;">tire data not available yet</div>';
    return;
  }
  const total = s.total_laps || 1;
  body.innerHTML = s.drivers
    .map((d) => {
      const segs = d.stints
        .map((st) => {
          const compoundClass = [
            "soft",
            "medium",
            "hard",
            "intermediate",
            "wet",
          ].includes(st.compound)
            ? st.compound
            : "unknown";
          const w = (st.laps / total) * 100;
          const label = st.compound ? st.compound.charAt(0).toUpperCase() : "?";
          return `<div class="stint-seg ${compoundClass}" style="flex: ${st.laps};" title="${st.compound || "unknown"} · laps ${st.lap_start}-${st.lap_end} (${st.laps})">${st.laps >= 3 ? label : ""}</div>`;
        })
        .join("");
      return `<div class="stint-row">
      <div class="sr-driver">${d.code || "#" + d.num}<small>${d.driver}</small></div>
      <div class="stint-track">${segs}</div>
    </div>`;
    })
    .join("");
}

/* ================================================================
   PWA · service worker register + install prompt + iOS hint
   ================================================================ */
let __deferredPrompt = null;
function setupPWA() {
  // register sw
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
  // beforeinstallprompt (Chromium)
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    __deferredPrompt = e;
    if (localStorage.getItem("pit-wall:install-dismissed")) return;
    setTimeout(() => {
      const chip = $("pwaChip");
      if (chip) chip.classList.add("show");
    }, 8000);
  });
  // installed → hide chip
  window.addEventListener("appinstalled", () => {
    const chip = $("pwaChip");
    if (chip) chip.classList.remove("show");
    localStorage.setItem("pit-wall:install-dismissed", String(Date.now()));
  });
  const chip = $("pwaChip");
  if (chip) {
    chip.addEventListener("click", async () => {
      if (__deferredPrompt) {
        __deferredPrompt.prompt();
        const r = await __deferredPrompt.userChoice;
        if (r && r.outcome === "accepted") {
          localStorage.setItem(
            "pit-wall:install-dismissed",
            String(Date.now()),
          );
        }
        __deferredPrompt = null;
        chip.classList.remove("show");
      }
    });
  }
  // iOS Safari fallback (no beforeinstallprompt)
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  if (
    isIos &&
    !isStandalone &&
    !localStorage.getItem("pit-wall:install-dismissed")
  ) {
    setTimeout(() => {
      const ios = $("pwaIos");
      if (ios) ios.classList.add("show");
    }, 14000);
    const close = $("pwaIosClose");
    if (close)
      close.addEventListener("click", () => {
        $("pwaIos").classList.remove("show");
        localStorage.setItem("pit-wall:install-dismissed", String(Date.now()));
      });
  }
}

/* ================================================================
   TIP CHIP · opens colophon (which has tip jar)
   ================================================================ */
function setupTipChip() {
  const chip = $("tipChip");
  if (!chip) return;
  chip.addEventListener("click", () => {
    const openBtn = $("openColophon");
    if (openBtn) openBtn.click();
  });
}

/* ================================================================
   THANKS POPUP · 90s dwell + moment-of-value gating
   Per project playbook: never mid-flow. Only appears once the visitor has
   accumulated 90s of dwell on this origin. Dwell ticks every 5s.
   ================================================================ */
function setupThanksPopup() {
  const pop = $("thanksPop");
  if (!pop) return;
  const close = $("tpClose");
  const skip = $("tpSkip");
  const thanksBtn = $("tpThanks");
  const coffee = $("tpCoffee");
  // UPI-first for IN audiences · same pattern as Pavilion + Quiz Battle
  (function indianAudienceUPI() {
    if (!coffee) return;
    let isIN = false;
    try {
      const tz = (
        Intl.DateTimeFormat().resolvedOptions().timeZone || ""
      ).toLowerCase();
      if (tz.includes("kolkata") || tz.includes("calcutta")) isIN = true;
    } catch {}
    const lang = (navigator.language || "").toLowerCase();
    if (
      lang.endsWith("-in") ||
      lang === "hi" ||
      lang === "bn" ||
      lang === "ta" ||
      lang === "te" ||
      lang === "mr"
    )
      isIN = true;
    if (!isIN) return;
    coffee.textContent = "tip via UPI";
    coffee.href =
      "upi://pay?pa=sachinpate13748-1@okhdfcbank&pn=Sachin%20Patel&cu=INR";
    coffee.removeAttribute("target");
    coffee.removeAttribute("rel");
    coffee.addEventListener("click", (e) => {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isMobile) {
        e.preventDefault();
        if (navigator.clipboard) {
          navigator.clipboard
            .writeText("sachinpate13748-1@okhdfcbank")
            .then(() => {
              coffee.textContent =
                "UPI ID copied · sachinpate13748-1@okhdfcbank";
              setTimeout(() => {
                coffee.textContent = "tip via UPI";
              }, 2800);
            })
            .catch(() => {
              coffee.textContent = "sachinpate13748-1@okhdfcbank";
            });
        } else {
          coffee.textContent = "sachinpate13748-1@okhdfcbank";
        }
      }
    });
  })();

  const DWELL_KEY = "pit-wall:cumulativeDwellMs";
  const LAST_TICK_KEY = "pit-wall:lastDwellTickAt";
  const MIN_DWELL_MS = 90 * 1000;
  const TICK_MS = 5 * 1000;
  function tickDwell() {
    if (document.hidden) return;
    const now = Date.now();
    const last = Number(localStorage.getItem(LAST_TICK_KEY) || 0);
    const gap = last && now - last < TICK_MS * 2 ? now - last : TICK_MS;
    const cur = Number(localStorage.getItem(DWELL_KEY) || 0) + gap;
    try {
      localStorage.setItem(DWELL_KEY, String(cur));
      localStorage.setItem(LAST_TICK_KEY, String(now));
    } catch {}
  }
  setInterval(tickDwell, TICK_MS);
  try {
    localStorage.setItem(LAST_TICK_KEY, String(Date.now()));
  } catch {}

  function eligibleNow() {
    const dismissed = Number(
      localStorage.getItem("pit-wall:thanks-dismissed") || 0,
    );
    const sent = Number(localStorage.getItem("pit-wall:thanks-sent") || 0);
    if (sent) return false; // already thanked → never again
    if (dismissed && Date.now() - dismissed < 7 * 24 * 3600 * 1000)
      return false;
    if (Number(localStorage.getItem(DWELL_KEY) || 0) < MIN_DWELL_MS)
      return false;
    return true;
  }

  function show() {
    if (!eligibleNow()) return;
    const cfg = loadConfig();
    const tpTitle = $("tpTitle");
    const tpBody = $("tpBody");
    if (cfg && cfg.name) {
      tpTitle.innerHTML = `Hey <em>${escapeHtml(cfg.name)}</em>${cfg.driverCode ? ", enjoying your wall?" : ", enjoying the pit wall?"}`;
      tpBody.textContent =
        "No ads, no subscriptions, no accounts. One tap says it was worth building.";
    } else {
      tpTitle.innerHTML = `Enjoying the <em>pit wall?</em>`;
    }
    pop.classList.add("show");
  }
  function hide(reason) {
    pop.classList.add("fading");
    setTimeout(() => {
      pop.classList.remove("show", "fading");
    }, 380);
    if (reason === "skip" || reason === "close") {
      localStorage.setItem("pit-wall:thanks-dismissed", String(Date.now()));
    }
  }

  if (close) close.addEventListener("click", () => hide("close"));
  if (skip) skip.addEventListener("click", () => hide("skip"));
  if (thanksBtn)
    thanksBtn.addEventListener("click", async () => {
      thanksBtn.disabled = true;
      thanksBtn.textContent = "sending…";
      const cfg = loadConfig() || {};
      const msgEl = $("tpMessage");
      const message = msgEl ? (msgEl.value || "").trim() : "";
      try {
        await fetch("/api/thanks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            project: "pit-wall",
            name: cfg.name || "",
            driver: cfg.driverCode || "",
            message,
          }),
        });
      } catch {}
      localStorage.setItem("pit-wall:thanks-sent", String(Date.now()));
      pop.classList.add("is-done");
      setTimeout(() => hide("done"), 2800);
    });
  if (coffee)
    coffee.addEventListener("click", () => {
      // Mark dismissed so it doesn't re-show, but don't mark as thanked.
      localStorage.setItem("pit-wall:thanks-dismissed", String(Date.now()));
    });

  // Poll every 5s after the visitor has been here long enough to be eligible.
  // We don't show before 90s of dwell to avoid interrupting a fresh session.
  let shown = false;
  const popPoll = setInterval(() => {
    if (shown) return clearInterval(popPoll);
    if (eligibleNow()) {
      shown = true;
      show();
      clearInterval(popPoll);
    }
  }, 5 * 1000);
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

/* ================================================================
   CHANGELOG · backdated, written like a human ship log
   ================================================================ */
const CHANGELOG = [
  {
    date: "2026-06-21",
    text: "Full season-data audit · rebuilt the 2026 driver grid (Pérez and Bottas at Cadillac, plus Lindblad and Colapinto, correct car numbers) · fixed 8 lap records (the 21-year Monza mark finally fell to Norris) and 10 stale pole-sitters · McLaren now shown on 10 constructors' titles · every fact web-verified against the calendar through round 22 · pole-sitters now pull live from Jolpica so they never go stale again.",
  },
  {
    date: "2026-05-16",
    text: "Mobile responsive pass · real circuit shapes per race · constructor heritage line · sticky live-now banner · share card + push opt-in wired.",
  },
  {
    date: "2026-05-13",
    text: "PWA install prompt with iOS fallback · 30-second thank-you popup · loading splash · OpenF1 weather + tire-strategy panels for the last race.",
  },
  {
    date: "2026-05-10",
    text: "Driver Spotlight (§05) with career wins, poles, last-5 form · Qualifying Recap (§06) with Q1/Q2/Q3 + gap to pole · animated <em>On Track</em> strip.",
  },
  {
    date: "2026-05-07",
    text: "Switched from the static template to a live Worker · Jolpica F1 primary, OpenF1 fallback, KV stale-cache fallback · deployed to <strong>pitwalllive.vercel.app</strong>.",
  },
  {
    date: "2026-05-04",
    text: "Cinematic onboarding · word-by-word headline reveal · name + driver picker · team-colour flood and particle burst on confirm.",
  },
  {
    date: "2026-04-30",
    text: "Colophon modal with the tip jar · UPI podium tiers (P10/P3/P1) · Ko-fi for international · SEO + Open Graph + structured data pass.",
  },
  {
    date: "2026-04-27",
    text: "Driver standings with leader stripe · Constructor cup with team-colour bars · Last-race podium block · Paddock Intel news cards.",
  },
  {
    date: "2026-04-23",
    text: "Calendar strip with all 23 rounds · Race-hero block with live countdown · Lap record + pole-sitter trivia per circuit.",
  },
  {
    date: "2026-04-19",
    text: "Editorial type system locked in · Playfair Display for headlines · Inter for body · JetBrains Mono for meta and eyebrows · carbon / paper / racing-red / gold palette.",
  },
  {
    date: "2026-04-16",
    text: "First sketch · a single-file F1 dashboard for a friend who watches every race. Idea: editorial magazine × broadcast graphics × yours forever.",
  },
];
function renderChangelog() {
  const el = $("cfChangelog");
  if (!el) return;
  el.innerHTML = CHANGELOG.map(
    (c) =>
      `<li><div class="cl-date">${c.date}</div><div class="cl-text">${c.text}</div></li>`,
  ).join("");
}

/* ================================================================
   SHARE CARD · canvas-based, 1080x1080 PNG, ready for stories
   ================================================================ */
async function buildShareCard() {
  const cfg = loadConfig();
  const data = window.__latestData;
  if (!cfg || !data) return null;
  const drv = (data.drivers || []).find((d) => d.code === cfg.driverCode);
  const fallback = DEFAULT_DRIVERS.find(([c]) => c === cfg.driverCode);
  const teamId = drv ? drv.team_id : fallback ? fallback[2] : null;
  const accent = (teamId && rawTeamHex(teamId)) || "#e10600";

  const W = 1080,
    H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);
  // accent glow
  const g = ctx.createRadialGradient(
    W * 0.18,
    H * 0.22,
    50,
    W * 0.18,
    H * 0.22,
    720,
  );
  g.addColorStop(0, accent + "55");
  g.addColorStop(1, "#0a0a0a00");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // gold glow
  const g2 = ctx.createRadialGradient(
    W * 0.85,
    H * 0.85,
    50,
    W * 0.85,
    H * 0.85,
    800,
  );
  g2.addColorStop(0, "#d4a01744");
  g2.addColorStop(1, "#0a0a0a00");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);
  // bottom accent bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, H - 14, W, 14);
  // corner crop marks
  ctx.strokeStyle = "#f2ece0aa";
  ctx.lineWidth = 3;
  const cm = 64;
  const draw = (x, y, dx, dy) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + dy);
    ctx.stroke();
  };
  draw(60, 60, 28, 0);
  draw(60, 60, 0, 28);
  draw(W - 60, 60, -28, 0);
  draw(W - 60, 60, 0, 28);
  draw(60, H - 60, 28, 0);
  draw(60, H - 60, 0, -28);
  draw(W - 60, H - 60, -28, 0);
  draw(W - 60, H - 60, 0, -28);

  // eyebrow
  ctx.fillStyle = "#f2ece099";
  ctx.font = '500 22px "JetBrains Mono", monospace';
  ctx.textAlign = "center";
  ctx.fillText("F1 2026  ·  THE PIT WALL", W / 2, 130);

  // greeting
  ctx.fillStyle = accent;
  ctx.font = '700 italic 38px "Playfair Display", Georgia, serif';
  ctx.textAlign = "center";
  const fname = (cfg.name || "fan").split(/\s+/)[0];
  ctx.fillText(`Hello, ${fname}.`, W / 2, 220);

  // driver name large
  ctx.fillStyle = "#f2ece0";
  const dispName = drv
    ? `${drv.given_name} ${drv.family_name}`
    : fallback
      ? fallback[1]
      : cfg.driverCode || "—";
  ctx.font = '700 italic 110px "Playfair Display", Georgia, serif';
  ctx.fillText(dispName, W / 2, 410);

  // driver code + team
  ctx.fillStyle = accent;
  ctx.font = '700 28px "JetBrains Mono", monospace';
  ctx.fillText(cfg.driverCode || "", W / 2, 470);

  ctx.fillStyle = "#f2ece099";
  ctx.font = '500 24px "JetBrains Mono", monospace';
  ctx.fillText(
    teamDisplayName(teamId, drv && drv.team_name).toUpperCase(),
    W / 2,
    510,
  );

  // big stats
  const pos = drv ? drv.pos : "—";
  const pts = drv ? drv.pts : "—";
  const seasonWins = drv ? drv.wins : 0;
  ctx.fillStyle = "#f2ece0";
  ctx.font = '700 italic 90px "Playfair Display", Georgia, serif';
  ctx.fillText(`P${pos}  ·  ${pts} pts`, W / 2, 650);

  // form line
  const nextRace = data.next_race;
  if (nextRace) {
    ctx.fillStyle = "#f2ece088";
    ctx.font = '500 22px "JetBrains Mono", monospace';
    ctx.fillText(
      `NEXT  ·  ${nextRace.short_name.toUpperCase()}  ·  ${shortRaceDate(nextRace.start_utc)}`,
      W / 2,
      720,
    );
  }

  // url + handle
  ctx.fillStyle = accent;
  ctx.font = '700 24px "JetBrains Mono", monospace';
  ctx.fillText("pitwalllive.vercel.app", W / 2, H - 110);
  ctx.fillStyle = "#f2ece088";
  ctx.font = '500 18px "JetBrains Mono", monospace';
  ctx.fillText("built by @mugenkyou  ·  yours forever", W / 2, H - 75);

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png", 0.95),
  );
}

async function shareMyCard() {
  const blob = await buildShareCard();
  if (!blob) return alert("pick a driver first");
  const file = new File([blob], "pit-wall-card.png", { type: "image/png" });
  if (
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "My Pit Wall",
        text: "F1 2026 dashboard · pit wall · pitwalllive.vercel.app",
      });
      return;
    } catch {}
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pit-wall-card.png";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/* ================================================================
   PUSH NOTIFICATIONS opt-in
   ================================================================ */
const VAPID_PUBLIC_KEY =
  "BG1sUUkmT2u-r3okvCqf0cjefKfsV6c04bKPXiu9t0Mnu1ypabsOtq8H2sOPK859aFksCBZOexrgre28gfiIFc8";
function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "browser does not support push" };
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "permission denied" };
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const cfg = loadConfig() || {};
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subscription: sub,
        name: cfg.name || "",
        driver: cfg.driverCode || "",
      }),
    });
    localStorage.setItem("pit-wall:push-subscribed", String(Date.now()));
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String((e && e.message) || e) };
  }
}

/* ================================================================
   THEME · accent colour shifts to the user's team
   ================================================================ */
function applyTheme(cfg, data) {
  let teamId = null;
  if (cfg && cfg.driverCode) {
    if (data && data.drivers) {
      const d = data.drivers.find((x) => x.code === cfg.driverCode);
      if (d) teamId = d.team_id;
    }
    if (!teamId) {
      const fallback = DEFAULT_DRIVERS.find(
        ([code]) => code === cfg.driverCode,
      );
      if (fallback) teamId = fallback[2];
    }
  }
  const accent = teamId ? rawTeamHex(teamId) : null;
  const root = document.documentElement;
  if (accent) {
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-2", accent);
  } else {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-2");
  }
}

const TEAM_HEX = {
  mercedes: "#27F4D2",
  ferrari: "#E8002D",
  mclaren: "#FF8000",
  red_bull: "#3671C6",
  williams: "#64C4FF",
  haas: "#B6BABD",
  alpine: "#0093CC",
  sauber: "#00877C",
  audi: "#00877C",
  rb: "#6692FF",
  racing_bulls: "#6692FF",
  alphatauri: "#6692FF",
  aston_martin: "#229971",
  cadillac: "#8A9099",
};
function rawTeamHex(id) {
  return TEAM_HEX[id] || null;
}

/* constructor heritage · static. Lineage years (earliest precursor) and championships. */
const CONSTRUCTOR_HISTORY = {
  ferrari: { since: 1929, titles: 16, last: 2008, lineage: "Scuderia Ferrari" },
  mercedes: {
    since: 1954,
    titles: 8,
    last: 2021,
    lineage: "Mercedes (W196 → W15)",
  },
  mclaren: { since: 1966, titles: 10, last: 2025, lineage: "Bruce McLaren" },
  red_bull: {
    since: 2005,
    titles: 6,
    last: 2023,
    lineage: "ex Jaguar / Stewart",
  },
  williams: {
    since: 1977,
    titles: 9,
    last: 1997,
    lineage: "Williams Grand Prix",
  },
  haas: { since: 2016, titles: 0, last: null, lineage: "Kannapolis · USA" },
  alpine: {
    since: 1977,
    titles: 2,
    last: 2006,
    lineage: "ex Renault · Toleman",
  },
  sauber: { since: 1993, titles: 0, last: null, lineage: "becomes Audi 2026" },
  audi: {
    since: 1993,
    titles: 0,
    last: null,
    lineage: "ex Sauber · works Audi",
  },
  rb: {
    since: 1985,
    titles: 0,
    last: null,
    lineage: "ex Minardi · Toro Rosso",
  },
  racing_bulls: {
    since: 1985,
    titles: 0,
    last: null,
    lineage: "ex Minardi · Toro Rosso",
  },
  alphatauri: {
    since: 1985,
    titles: 0,
    last: null,
    lineage: "ex Minardi · Toro Rosso",
  },
  aston_martin: {
    since: 1991,
    titles: 0,
    last: null,
    lineage: "ex Jordan · Force India",
  },
  cadillac: { since: 2026, titles: 0, last: null, lineage: "GM works entry" },
};
function heritageLine(teamId) {
  const h = CONSTRUCTOR_HISTORY[teamId];
  if (!h) return "";
  if (h.titles > 0) {
    return `<span class="con-heritage">× ${h.titles} title${h.titles === 1 ? "" : "s"} · since ${h.since}${h.last ? ` · last ${h.last}` : ""}</span>`;
  }
  return `<span class="con-heritage">${h.lineage} · since ${h.since}</span>`;
}

/* ================================================================
   NEXT 3 RACES · live mini countdowns
   ================================================================ */
let next3Timer = null;
function renderNextRaces(data) {
  const grid = $("next3Grid");
  if (!grid) return;
  const sched = data.schedule || [];
  const idx = sched.findIndex(
    (r) => r.status === "live" || r.status === "upcoming",
  );
  const slice = idx < 0 ? [] : sched.slice(idx, idx + 3);
  if (!slice.length) {
    grid.innerHTML =
      '<div style="color:var(--ink-3); font-family:JetBrains Mono,monospace; font-size:12px; letter-spacing:.2em; text-transform:uppercase;">season closed · see you in 2027</div>';
    return;
  }
  grid.innerHTML = slice
    .map(
      (r, i) => `
    <div class="next3-card${i === 0 ? " is-next" : ""}" data-start="${r.start_utc}">
      <div class="n3-eyebrow">${i === 0 ? "next race" : "round " + pad(r.round)} &middot; ${shortRaceDate(r.start_utc)}</div>
      <div class="n3-name">${r.short_name.replace(/ GP$/, "")} <em>GP</em></div>
      <div class="n3-flag-emoji">${flagOf(r.country)}</div>
      <div class="n3-flag-name">${r.country || ""}${r.locality ? " &middot; " + r.locality : ""}</div>
      <div class="n3-cdt" data-cdt="${r.start_utc}">—</div>
    </div>
  `,
    )
    .join("");
  tickNext3();
  if (next3Timer) clearInterval(next3Timer);
  next3Timer = setInterval(tickNext3, 1000);
}
function tickNext3() {
  document.querySelectorAll("[data-cdt]").forEach((el) => {
    const target = Date.parse(el.getAttribute("data-cdt"));
    if (!Number.isFinite(target)) {
      el.textContent = "—";
      return;
    }
    const diff = target - Date.now();
    if (diff <= 0) {
      el.innerHTML = "lights out <small>now</small>";
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = `${pad(d)}<small>d</small> ${pad(h)}<small>h</small> ${pad(m)}<small>m</small> ${pad(s)}<small>s</small>`;
  });
}

/* ================================================================
   DRIVER SPOTLIGHT · the fav driver's career + form
   ================================================================ */
let __spotlightDriver = null;
let __spotlightCache = null;
let __spotlightCacheAt = 0;
let __spotlightDataStamp = null;
let __spotlightFetch = null;
const SPOTLIGHT_CACHE_MS = 5 * 60 * 1000;

function applySpotlightExtras(info) {
  const cwEl = document.querySelector("#ssCareerWins .ss-value");
  const cpEl = document.querySelector("#ssCareerPoles .ss-value");
  if (cwEl)
    cwEl.innerHTML = `${info.career && info.career.wins != null ? info.career.wins : "—"}<small>all-time</small>`;
  if (cpEl)
    cpEl.innerHTML = `${info.career && info.career.poles != null ? info.career.poles : "—"}<small>all-time</small>`;

  const row = document.getElementById("spotFormRow");
  if (!row) return;
  if (info.season_results && info.season_results.length) {
    row.innerHTML = info.season_results
      .map((rr) => {
        const pStr = rr.pos || "—";
        const isDnf =
          rr.status &&
          rr.status !== "Finished" &&
          !/^\+\d/.test(rr.status) &&
          !/Lap/i.test(rr.status);
        const cls = ["sl-form-pill"];
        if (["1", "2", "3"].includes(String(pStr))) cls.push("is-podium");
        if (isDnf) cls.push("is-dnf");
        const posLabel = isDnf ? "DNF" : `P${pStr}`;
        return `<div class="${cls.join(" ")}">
        <div class="fp-pos">${posLabel}</div>
        <div class="fp-name">${rr.short_name.toUpperCase()}</div>
        <div class="fp-pts">${rr.points} pts</div>
      </div>`;
      })
      .join("");
  } else {
    row.innerHTML =
      '<div class="sl-form-pill"><div class="fp-pos">—</div><div class="fp-name">no rounds yet</div></div>';
  }
}

function updateSpotlightLiveStats(data, cfg) {
  const code = cfg.driverCode;
  const drv = (data.drivers || []).find((d) => d.code === code);
  if (!drv) return;
  const posEl = document.querySelector(
    ".sl-stats .sl-stat:first-child .ss-value",
  );
  const winsEl = document.querySelector(
    ".sl-stats .sl-stat:nth-child(2) .ss-value",
  );
  if (posEl) posEl.innerHTML = `P${drv.pos}<small>${drv.pts} pts</small>`;
  if (winsEl) {
    const rounds = (data.schedule || []).filter(
      (r) => r.status === "done",
    ).length;
    winsEl.innerHTML = `${drv.wins != null ? drv.wins : "—"}<small>${rounds} rounds</small>`;
  }
}

async function fetchSpotlightExtras(code) {
  if (__spotlightFetch) return __spotlightFetch;
  __spotlightFetch = (async () => {
    try {
      const r = await fetch(`/api/driver/${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error("http " + r.status);
      const info = await r.json();
      __spotlightCache = { code, info };
      __spotlightCacheAt = Date.now();
      if (__spotlightDriver === code) applySpotlightExtras(info);
    } catch {
      /* leave placeholders */
    } finally {
      __spotlightFetch = null;
    }
  })();
  return __spotlightFetch;
}

function wireSpotlightActions() {
  const shareBtn = document.getElementById("spotShare");
  if (shareBtn) shareBtn.onclick = shareMyCard;
  const bellBtn = document.getElementById("spotBell");
  const bellLabel = document.getElementById("spotBellLabel");
  const alreadySubbed = !!localStorage.getItem("pit-wall:push-subscribed");
  if (alreadySubbed && bellLabel) bellLabel.textContent = "you're subscribed";
  if (bellBtn) {
    bellBtn.onclick = async () => {
      bellBtn.disabled = true;
      if (bellLabel) bellLabel.textContent = "asking permission…";
      const r = await subscribeToPush();
      if (r.ok) {
        if (bellLabel) bellLabel.textContent = "you're subscribed";
      } else {
        if (bellLabel) bellLabel.textContent = r.reason || "failed · try again";
        setTimeout(() => {
          if (bellLabel) bellLabel.textContent = "race-day reminders";
          bellBtn.disabled = false;
        }, 2200);
      }
    };
  }
}

async function renderSpotlight(data, cfg) {
  const body = $("spotlightBody");
  const meta = $("spotlightMeta");
  if (!body) return;
  if (!cfg || !cfg.driverCode) {
    __spotlightDriver = null;
    body.innerHTML =
      '<div class="sl-empty"><p>No driver picked yet. <button type="button" class="sl-cta" id="spotlightCta">choose one →</button></p></div>';
    const cta = document.getElementById("spotlightCta");
    if (cta) cta.addEventListener("click", () => showOnboarding(loadConfig()));
    if (meta) meta.textContent = "pick a driver to unlock";
    return;
  }

  const code = cfg.driverCode;
  if (__spotlightDriver === code && body.querySelector(".sl-driver-block")) {
    updateSpotlightLiveStats(data, cfg);
    if (meta) {
      const drv = (data.drivers || []).find((d) => d.code === code);
      const teamDisp = teamDisplayName(
        drv && drv.team_id,
        drv && drv.team_name,
      );
      meta.textContent = `${teamDisp.toUpperCase()} · live season + career numbers`;
    }
    if (data.updatedAt && data.updatedAt !== __spotlightDataStamp) {
      __spotlightDataStamp = data.updatedAt;
      __spotlightCache = null;
      __spotlightCacheAt = 0;
      fetchSpotlightExtras(code);
    }
    return;
  }

  __spotlightDriver = code;
  const drv = (data.drivers || []).find((d) => d.code === code);
  const fallback = DEFAULT_DRIVERS.find(([c]) => c === code) || null;
  const num = drv ? drv.permanent_number : fallback ? fallback[3] : "";
  const name = drv
    ? `${drv.given_name} ${drv.family_name}`
    : fallback
      ? fallback[1]
      : code;
  const teamId = drv ? drv.team_id : fallback ? fallback[2] : null;
  const teamDisp = teamDisplayName(teamId, drv && drv.team_name);
  const nat = drv ? NAT3[drv.nationality] || drv.nationality : "—";
  const pts = drv ? drv.pts : "—";
  const pos = drv ? drv.pos : "—";
  const wins = drv ? drv.wins : "—";
  const rounds = (data.schedule || []).filter(
    (r) => r.status === "done",
  ).length;

  body.innerHTML = `
    <div class="sl-left">
      <div class="sl-driver-block">
        <div class="sl-num-large">${num || ""}</div>
        <div class="sl-name-block">
          <span class="sl-code">${code}</span>
          <h2 class="sl-name">${name.replace(/(\w+) (.+)/, "$1 <em>$2</em>")}</h2>
          <div class="sl-meta-row"><strong>${teamDisp}</strong> &middot; ${nat}</div>
        </div>
      </div>
      <div class="sl-form" id="spotForm">
        <div class="sl-form-title">recent form &middot; this season</div>
        <div class="sl-form-row" id="spotFormRow"><div class="sl-form-pill"><div class="fp-pos">—</div><div class="fp-name">loading</div></div></div>
      </div>
      <div class="sl-actions">
        <button type="button" class="sl-action sl-share" id="spotShare">
          <span class="sa-icon">↗</span><span>share my card</span>
        </button>
        <button type="button" class="sl-action sl-bell" id="spotBell">
          <span class="sa-icon">◔</span><span id="spotBellLabel">race-day reminders</span>
        </button>
      </div>
    </div>
    <div class="sl-right">
      <div class="sl-stats">
        <div class="sl-stat"><div class="ss-label">Standing</div><div class="ss-value">P${pos}<small>${pts} pts</small></div></div>
        <div class="sl-stat"><div class="ss-label">Season Wins</div><div class="ss-value">${wins}<small>${rounds} rounds</small></div></div>
        <div class="sl-stat" id="ssCareerWins"><div class="ss-label">Career Wins</div><div class="ss-value">—</div></div>
        <div class="sl-stat" id="ssCareerPoles"><div class="ss-label">Career Poles</div><div class="ss-value">—</div></div>
      </div>
    </div>
  `;
  wireSpotlightActions();
  if (meta)
    meta.textContent = `${teamDisp.toUpperCase()} · live season + career numbers`;
  __spotlightDataStamp = data.updatedAt || null;

  if (
    __spotlightCache &&
    __spotlightCache.code === code &&
    Date.now() - __spotlightCacheAt < SPOTLIGHT_CACHE_MS
  ) {
    applySpotlightExtras(__spotlightCache.info);
    return;
  }
  fetchSpotlightExtras(code);
}

/* ================================================================
   QUALIFYING RECAP
   ================================================================ */
function renderQualifying(data) {
  const body = $("qualiBody");
  const title = $("qualiTitle");
  const meta = $("qualiMeta");
  if (!body) return;
  const q = data.last_race && data.last_race.qualifying;
  if (!q || !q.results || !q.results.length) {
    body.innerHTML =
      '<div style="grid-column: 1 / -1; padding: 12px 0; color: var(--ink-3); font-size: 12px; letter-spacing:.14em; text-transform: uppercase;">qualifying data not available yet</div>';
    return;
  }
  if (title) title.textContent = `${data.last_race.short_name} Qualifying`;
  if (meta)
    meta.textContent = q.pole
      ? `pole · ${q.pole.driver_short} · ${q.pole.time || ""}`.toLowerCase()
      : "pole · best Q3";

  const poleTime = q.pole && q.pole.time ? toMs(q.pole.time) : null;
  body.innerHTML = `
    <div class="qh qh-driver">Driver</div>
    <div class="qh qh-q1">Q1</div>
    <div class="qh qh-q2">Q2</div>
    <div class="qh qh-q3">Q3</div>
    <div class="qh qh-time">Gap</div>
    ${q.results
      .map((r, i) => {
        const col = teamColor(r.team_id);
        const best = r.best || "—";
        let gap = "—";
        if (poleTime && r.best) {
          const ms = toMs(r.best);
          if (ms != null) {
            if (i === 0) gap = best;
            else {
              const d = (ms - poleTime) / 1000;
              gap = `+${d.toFixed(3)}`;
            }
          }
        }
        return `<div class="qr-row${i === 0 ? " is-pole" : ""}">
        <div class="qr-cell qr-driver">
          <span class="qr-pos">${pad(r.pos)}</span>
          <span class="qr-team-stripe" style="--qr-color:${col};"></span>
          <span class="qr-name">${r.driver_short}<small>${teamDisplayName(r.team_id, r.team)}</small></span>
        </div>
        <div class="qr-cell qr-q1">${r.q1 || "—"}</div>
        <div class="qr-cell qr-q2">${r.q2 || "—"}</div>
        <div class="qr-cell qr-q3">${r.q3 || "—"}</div>
        <div class="qr-cell qr-time">${gap}</div>
      </div>`;
      })
      .join("")}
  `;
}
function toMs(t) {
  if (!t) return null;
  const m = String(t).match(/^(?:(\d+):)?(\d+)\.(\d+)$/);
  if (!m) return null;
  const mins = Number(m[1] || 0),
    secs = Number(m[2]),
    ms = Number(m[3].padEnd(3, "0"));
  return mins * 60000 + secs * 1000 + ms;
}
function applyConfig(cfg) {
  if (cfg && cfg.driverCode !== __spotlightDriver) {
    __spotlightCache = null;
    __spotlightCacheAt = 0;
  }
  paintHeader(cfg);
  if (window.__latestData) renderAll(window.__latestData, cfg);
}

function updateNavLiveItems(show) {
  document.querySelectorAll("[data-nav-live-item]").forEach((li) => {
    li.hidden = !show;
  });
}

/* ================================================================
   TELEMETRY · OpenF1 car data for favourite driver
   ================================================================ */
let telemetryTimer = null;

function driverNumberFromConfig(cfg) {
  if (!cfg || !cfg.driverCode) return null;
  const row = DEFAULT_DRIVERS.find(([code]) => code === cfg.driverCode);
  return row ? row[3] : null;
}

function telemetryUnavailable(body, meta) {
  if (body) {
    body.innerHTML =
      '<p class="telemetry-empty">Telemetry is unavailable for the current session.</p>';
  }
  if (meta) meta.textContent = "no active session";
}

async function fetchTelemetry(cfg) {
  const body = $("telemetryBody");
  const meta = $("telemetryMeta");
  if (!body) return;

  try {
    const num = driverNumberFromConfig(cfg);
    const qs = num ? `?driver_number=${encodeURIComponent(num)}` : "";
    const r = await fetch(`/api/telemetry${qs}`);
    if (!r.ok) throw new Error("unavailable");
    const data = await r.json();
    const rows = data && Array.isArray(data.telemetry) ? data.telemetry : null;
    if (!rows || !rows.length) {
      telemetryUnavailable(body, meta);
      return;
    }
    const latest = rows[rows.length - 1];
    const label =
      num && cfg && cfg.driverCode
        ? `#${num} · ${cfg.driverCode}`
        : "latest sample";
    if (meta) meta.textContent = label;

    const speed = latest.speed != null ? Math.round(latest.speed) : "—";
    const rpm = latest.rpm != null ? Math.round(latest.rpm) : "—";
    const gear = latest.n_gear != null ? latest.n_gear : "—";
    const throttle =
      latest.throttle != null ? Math.round(latest.throttle) : "—";
    const brake =
      latest.brake != null ? (latest.brake > 0 ? "ON" : "OFF") : "—";
    const drs =
      latest.drs != null ? (latest.drs >= 10 ? "OPEN" : "CLOSED") : "—";

    body.innerHTML = `
      <div class="telemetry-stats">
        <div class="telemetry-stat"><div class="ts-label">Speed</div><div class="ts-value">${speed}<small>km/h</small></div></div>
        <div class="telemetry-stat"><div class="ts-label">RPM</div><div class="ts-value">${rpm}<small>rpm</small></div></div>
        <div class="telemetry-stat"><div class="ts-label">Gear</div><div class="ts-value">${gear}</div></div>
        <div class="telemetry-stat"><div class="ts-label">Throttle</div><div class="ts-value">${throttle}<small>%</small></div></div>
        <div class="telemetry-stat"><div class="ts-label">Brake</div><div class="ts-value">${brake}</div></div>
        <div class="telemetry-stat"><div class="ts-label">DRS</div><div class="ts-value">${drs}</div></div>
      </div>`;
  } catch {
    telemetryUnavailable(body, meta);
  }
}

function startTelemetryPoll(cfg) {
  if (telemetryTimer) clearInterval(telemetryTimer);
  fetchTelemetry(cfg);
  telemetryTimer = setInterval(() => fetchTelemetry(loadConfig()), 15 * 1000);
}

/* ================================================================
   NAVIGATION DRAWER
   ================================================================ */
function setupNavDrawer() {
  const toggle = $("navToggle");
  const drawer = $("navDrawer");
  const backdrop = $("navBackdrop");
  if (!toggle || !drawer || !backdrop) return;

  const MOBILE_BP = 1024;
  const navItems = drawer.querySelectorAll(".nav-item");
  const sectionIds = Array.from(drawer.querySelectorAll("[data-nav]"))
    .map((el) => el.getAttribute("data-nav"))
    .filter(Boolean);
  let releaseFocus = null;
  let lockedScrollY = 0;

  function isMobile() {
    return window.innerWidth < MOBILE_BP;
  }

  function getScrollOffset() {
    let offset = 12;
    const ticker = document.querySelector(".ticker-wrap");
    if (ticker) offset += ticker.offsetHeight;
    const banner = $("liveBanner");
    if (banner && banner.classList.contains("show"))
      offset += banner.offsetHeight;
    return offset;
  }

  function lockPageScroll() {
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.classList.add("nav-scroll-lock");
    document.body.style.top = `-${lockedScrollY}px`;
  }

  function unlockPageScroll() {
    document.body.classList.remove("nav-scroll-lock");
    document.body.style.top = "";
    window.scrollTo(0, lockedScrollY);
  }

  function setActive(id) {
    navItems.forEach((item) => {
      const target = item.getAttribute("data-nav");
      item.classList.toggle("is-active", !!target && target === id);
    });
  }

  function openDrawer() {
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation");
    drawer.hidden = false;
    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
    lockPageScroll();
    requestAnimationFrame(() => {
      document.body.classList.add("nav-open");
      const first =
        drawer.querySelector("li:not([hidden]) .nav-item") ||
        drawer.querySelector(".nav-item");
      if (first) first.focus();
      releaseFocus = trapFocus(drawer);
    });
  }

  function closeDrawer() {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    document.body.classList.remove("nav-open");
    if (releaseFocus) {
      releaseFocus();
      releaseFocus = null;
    }
    unlockPageScroll();
    toggle.focus({ preventScroll: true });
    setTimeout(
      () => {
        if (!document.body.classList.contains("nav-open")) {
          drawer.hidden = true;
          backdrop.hidden = true;
          backdrop.setAttribute("aria-hidden", "true");
        }
      },
      isMobile() ? 300 : 250,
    );
  }

  function trapFocus(container) {
    const focusable = Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.closest("li[hidden]"));
    if (!focusable.length) return () => {};
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function onKeyDown(e) {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }

  function scrollToSection(id) {
    let el = document.getElementById(id);
    if (id === "livegridRc" || id === "livegridSection") {
      const sec = $("livegridSection");
      if (sec && sec.style.display === "none") {
        el = $("navHome");
        id = el ? el.id : id;
      } else if (id === "livegridRc" && (!el || !el.offsetHeight)) {
        el = sec || el;
        id = el ? el.id : id;
      }
    }
    if (!el) return;
    const top =
      el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    setActive(id);
  }

  toggle.addEventListener("click", () => {
    if (document.body.classList.contains("nav-open")) closeDrawer();
    else openDrawer();
  });

  backdrop.addEventListener("click", closeDrawer);

  drawer.addEventListener("click", (e) => {
    const item = e.target.closest(".nav-item");
    if (!item) return;
    const action = item.getAttribute("data-action");
    if (action === "credits") {
      e.preventDefault();
      closeDrawer();
      const openBtn = $("openColophon");
      if (openBtn) openBtn.click();
      return;
    }
    const navId = item.getAttribute("data-nav");
    if (navId) {
      e.preventDefault();
      closeDrawer();
      requestAnimationFrame(() => scrollToSection(navId));
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      e.preventDefault();
      closeDrawer();
    }
  });

  const sections = sectionIds
    .map((sid) => document.getElementById(sid))
    .filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    const ratios = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          ratios.set(entry.target.id, entry.intersectionRatio),
        );
        let bestId = null;
        let bestRatio = 0;
        ratios.forEach((ratio, sid) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = sid;
          }
        });
        if (bestId && bestRatio > 0) setActive(bestId);
      },
      {
        rootMargin: "-18% 0px -58% 0px",
        threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
      },
    );
    sections.forEach((sec) => observer.observe(sec));
  }
}

function setupAIChat() {
  const toggle = $("aiChatToggle");
  const panel = $("aiChatPanel");
  const close = $("aiChatClose");
  const input = $("aiChatInput");
  const send = $("aiChatSend");
  const body = $("aiChatBody");
  
  if (!toggle || !panel) return;
  
  const history = [
    { role: "assistant", content: "Pit Wall AI Race Engineer online. Systems nominal. Standing by for telemetry or strategy queries." }
  ];
  
  // Toggle Chat Panel
  toggle.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) {
      input.focus();
      body.scrollTop = body.scrollHeight;
    }
  });
  
  if (close) {
    close.addEventListener("click", () => {
      panel.classList.add("hidden");
    });
  }
  
  // Send Message function
  async function sendMessage(text) {
    const cleanText = text.trim();
    if (!cleanText) return;
    
    // Add user message to UI & history
    appendMessage("user", cleanText);
    history.push({ role: "user", content: cleanText });
    input.value = "";
    
    // Add loading indicator
    const loadingId = appendLoading();
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-10) }) // send last 10 messages for context
      });
      
      removeLoading(loadingId);
      
      if (!response.ok) throw new Error("Connection failed");
      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content || "Understood. telemetries received, but no response could be generated.";
      
      appendMessage("assistant", reply);
      history.push({ role: "assistant", content: reply });
    } catch (e) {
      removeLoading(loadingId);
      appendMessage("assistant", "Negative. Lost connection to telemetry link. Please retry.");
    }
  }
  
  // Suggestion buttons
  document.querySelectorAll(".ai-suggest-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      sendMessage(btn.textContent.replace("?", ""));
    });
  });
  
  // Event listeners for sending
  if (send) {
    send.addEventListener("click", () => sendMessage(input.value));
  }
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        sendMessage(input.value);
      }
    });
  }
  
  function appendMessage(sender, text) {
    const msgEl = document.createElement("div");
    msgEl.className = `ai-msg ai-msg-${sender}`;
    msgEl.innerHTML = `
      <div class="ai-msg-sender">${sender === "user" ? "YOU" : "ENGINEER"}</div>
      <div class="ai-msg-text">${escapeHtml(text)}</div>
    `;
    body.appendChild(msgEl);
    body.scrollTop = body.scrollHeight;
  }
  
  function appendLoading() {
    const id = "ai-loading-" + Date.now();
    const loadingEl = document.createElement("div");
    loadingEl.className = `ai-msg ai-msg-assistant`;
    loadingEl.id = id;
    loadingEl.innerHTML = `
      <div class="ai-msg-sender">ENGINEER</div>
      <div class="ai-msg-text">Calculating…</div>
    `;
    body.appendChild(loadingEl);
    body.scrollTop = body.scrollHeight;
    return id;
  }
  
  function removeLoading(id) {
    const el = $(id);
    if (el) el.remove();
  }
}

/* ================================================================
   BOOTSTRAP
   ================================================================ */
(function bootstrap() {
  window.__firstRender = true;
  const cfg = loadConfig();
  paintHeader(cfg);

  // Edit chip wires to reopen onboarding with prefill
  $("onbEdit").addEventListener("click", () => showOnboarding(loadConfig()));

  fetchAndRender(cfg);
  pollTimer = setInterval(() => fetchAndRender(loadConfig()), POLL_MS);

  // refresh "X min ago" every 20 s
  setInterval(() => {
    const data = window.__latestData;
    if (data && data._fetched_at_utc) paintLiveIndicator(data, false);
  }, 20 * 1000);

  // First-time onboarding
  if (!cfg || !cfg.name) {
    setTimeout(() => showOnboarding(null), 250);
  } else {
    // returning visitor → no onboarding, splash falls off on first data
    setTimeout(() => hideSplash(), 1800);
  }

  // PWA, tip chip, thanks popup, changelog, live session poll
  setupPWA();
  setupTipChip();
  setupThanksPopup();
  setupNavDrawer();
  setupCalendarDrag();
  renderChangelog();
  startLivePoll();
  startTelemetryPoll(cfg);
  setupAIChat();

  // safety: if fetch never returns, kill splash after 4 s
  setTimeout(() => hideSplash(), 4000);
})();
