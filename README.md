# Pit Wall · Live F1 2026 Dashboard

[![Live Demo](https://img.shields.io/badge/demo-pitwalllive.vercel.app-red)](https://pitwalllive.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A live, auto-updating F1 2026 dashboard with countdown timers, driver and constructor standings, the full calendar, last-race podium, paddock intel, telemetry, and weather.

**Live:** [pitwalllive.vercel.app](https://pitwalllive.vercel.app)  
**GitHub:** [github.com/mugenkyou/pit-wall](https://github.com/mugenkyou/pit-wall)

Built by [Sachin Patel](https://www.linkedin.com/in/sachinskyte/) ([@mugenkyou](https://github.com/mugenkyou))

## Structure

- `public/` holds the frontend static files.
- `api/` holds the backend route modules.
- `utils/` holds shared fetch and formatting helpers.
- `worker.js` serves the static assets and API endpoints.

## Routes

- `/api/live`
- `/api/standings`
- `/api/driver/:code`
- `/api/weather`
- `/api/telemetry`
- `/api/schedule`

## Run locally

This app runs on [Cloudflare Workers](https://developers.cloudflare.com/workers/). Use [Wrangler](https://developers.cloudflare.com/workers/wrangler/) to serve the worker and static assets from `public/` in dev.

```bash
npm install
npx wrangler dev
```

Or use the npm script (same command):

```bash
npm run dev
```

Wrangler starts a local server (default: [http://localhost:8787](http://localhost:8787)) with the API routes and frontend. Open that URL in your browser to use the dashboard.

To deploy to Cloudflare:

```bash
npm run deploy
```

## License

MIT © [Sachin Patel](https://github.com/mugenkyou)
