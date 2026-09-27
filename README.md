# AOL Game

An AI-driven dating sim set inside a faithful recreation of AOL Instant Messenger.
Your goal: convince **Lexi** (`xX_lexi_Xx`) to like you back.

Lexi is an LLM-driven character — she responds in character, forms a hidden
opinion of you (the "vibes" meter in the Buddy List), and remembers facts you
mention across the conversation. A chapter system moves the story forward —
first IM → the Winter Formal → the confession — and what you say decides whether
she ends up your girlfriend, friendzones you, or slams the door and signs off
forever.

## Run it

```bash
npm install
npm start          # http://localhost:3000
```

## Give Lexi a real brain

With no API key the game runs on a scripted fallback engine (still playable,
but rule-based). For real AI responses, either drop a `.env` file in the repo
root (it's gitignored and auto-loaded by `npm start`):

```bash
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

or export the var in your shell before `npm start`. Check the startup log —
it prints which brain Lexi is using (`anthropic`, `openai`, or `fallback`).

## How it works

- `server.js` — Express server: static frontend + `/api/chat`, `/api/state`, `/api/reset`
- `src/engine.js` — game state (interest 0–100, memories, history), section transitions, JSON persistence in `data/`
- `src/sections.js` — the five chat sessions (junior spring → winter formal → summer → senior fall → prom season)
- `src/lexi.js` — Lexi's persona prompt, the structured JSON turn contract
- `src/llm.js` — Anthropic / OpenAI provider abstraction (raw fetch, no SDK)
- `src/fallback.js` — scripted Lexi when no key is set
- `public/` — the AIM UI: draggable windows, 8-bit mood faces (`pixels.js`), numbered reply suggestions, synthesized AIM sounds
