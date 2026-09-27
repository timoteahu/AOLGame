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
but rule-based). For real AI responses, set one of:

```bash
export ANTHROPIC_API_KEY=...   # preferred
export OPENAI_API_KEY=...      # or OpenAI
npm start
```

You can also put them in a `.env` file and `source` it — or just export before
`npm start`.

## How it works

- `server.js` — Express server: static frontend + `/api/chat`, `/api/state`, `/api/reset`
- `src/engine.js` — game state (interest 0–100, memories, history), turn orchestration, JSON persistence in `data/`
- `src/lexi.js` — Lexi's persona prompt, the structured JSON turn contract, chapter thresholds
- `src/llm.js` — Anthropic / OpenAI provider abstraction (raw fetch, no SDK)
- `src/fallback.js` — scripted Lexi when no key is set
- `public/` — the AIM UI: draggable windows, typing indicator, synthesized AIM sounds
