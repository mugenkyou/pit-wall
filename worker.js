import * as standings from "./api/standings.js";
import * as live from "./api/live.js";
import * as driver from "./api/driver.js";
import * as weather from "./api/weather.js";
import * as telemetry from "./api/telemetry.js";
import * as schedule from "./api/schedule.js";

const routeMap = new Map([
  ["/api/standings", standings],
  ["/api/live", live],
  ["/api/weather", weather],
  ["/api/telemetry", telemetry],
  ["/api/schedule", schedule],
]);

function serveStatic(request, env) {
  if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
    return env.ASSETS.fetch(request);
  }
  return new Response("Static assets not configured.", { status: 500 });
}

async function invokeRoute(mod, request, env, ctx) {
  if (typeof mod.GET === "function") {
    return mod.GET(request, env, ctx);
  }
  return new Response("Method not allowed.", { status: 405 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/driver/")) {
      return invokeRoute(driver, request, env, ctx);
    }

    const moduleRef = routeMap.get(url.pathname);
    if (moduleRef) {
      return invokeRoute(moduleRef, request, env, ctx);
    }

    return serveStatic(request, env);
  },
};
