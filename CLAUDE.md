# booking-agent-api

Express backend for Aria, the booking assistant for Bella's Hair Studio (Colchester, Essex). Exposes `POST /api/chat`, which proxies to the Anthropic SDK with two tools: `check_availability` and `create_booking`.

## Paired repo
Frontend lives at `C:\Users\milan\Documents\booking-agent-web` (GitHub: `UXVal92/booking-agent-web`). It is a Next.js app that calls this API. When changing the chat contract (request or response shape, tool names, system prompt behaviour), check the web repo too.

## Run
`npm start` (listens on `PORT` or 3333). Requires `ANTHROPIC_API_KEY` in `.env`.

## Non-obvious

- `SLOTS` and `booked` are in-memory in `server.mjs`. Bookings vanish on restart. This is a demo, not production state.
- `index.html` at repo root is a standalone demo client served via Vercel rewrite in `vercel.json`. The Next.js frontend in the paired repo is the real client.
- Deployed on Railway (see recent commits about CORS and dotenv path).
- Model: `claude-haiku-4-5-20251001`. Aria persona and pricing are hardcoded in the system prompt.
