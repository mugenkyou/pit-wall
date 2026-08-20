import { jsonResponse } from "../utils/cache.js";
import { getDriverStandings, getConstructorStandings, getSchedule, getLatestRaceResults } from "../utils/jolpica.js";

export async function POST(request, env) {
  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: "Invalid messages array" }, { status: 400 });
    }

    // Get current standings and schedule context for the AI prompt
    let context = {};
    try {
      const [driversData, constructorsData, scheduleData] = await Promise.all([
        getDriverStandings("current").catch(() => null),
        getConstructorStandings("current").catch(() => null),
        getSchedule("current").catch(() => null),
      ]);

      const schedule = scheduleData?.schedule || [];
      const nextRace = schedule.find((r) => r.status === "upcoming") || null;
      const lastScheduledRace = [...schedule].reverse().find((r) => r.status === "done") || null;
      const lastRace = lastScheduledRace
        ? await getLatestRaceResults(scheduleData?.season || "current", lastScheduledRace.round).catch(() => null)
        : null;

      context = {
        wdc: (driversData?.drivers || []).slice(0, 10).map(d => `${d.pos}. ${d.name} (${d.team_name}) - ${d.pts} pts`),
        wcc: (constructorsData || []).slice(0, 10).map(c => `${c.pos}. ${c.name} - ${c.pts} pts`),
        next_race: nextRace ? `${nextRace.name} at ${nextRace.circuit} (${nextRace.locality}, ${nextRace.country}) on ${nextRace.date}` : "Unknown",
        last_race: lastRace ? {
          name: lastRace.name,
          winner: lastRace.podium?.[0]?.driver || "Unknown",
          podium: (lastRace.podium || []).map(p => `${p.position}. ${p.driver} (${p.team})`)
        } : null
      };
    } catch (e) {
      console.warn("Could not load F1 context for AI:", e);
    }

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback mode if no API key is provided - simulates the engineer locally
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

    // Call OpenAI API
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
