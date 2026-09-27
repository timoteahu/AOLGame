---
name: testing-aolgame
description: How to run and end-to-end test the AOLGame AIM dating sim (server, AI mode, endings, UI quirks)
---

# Testing AOLGame

## Devin Secrets Needed
- `ANTHROPIC_API_KEY` (org secret) — required for real AI replies. Without it the game runs a scripted fallback brain (`aiMode: "fallback"` in GET /api/state).

## Run the app
```bash
cd /home/ubuntu/repos/AOLGame
pgrep -af "node server.js"          # may already be running on :3000
curl -s http://localhost:3000/api/state   # check aiMode field
# restart with real AI if needed:
fuser -k 3000/tcp; nohup env ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" node server.js > /tmp/aol.log 2>&1 &
```
- Serve the UI at http://localhost:3000. API: `POST /api/chat {message}`, `GET /api/state`, `POST /api/reset`.
- State persists to `data/state.json`. Delete it + restart for a guaranteed-clean game (or use New Game / POST /api/reset).

## Interest mechanics (as of the section-based build)
- Interest starts at 30, clamps 0–100. `interest_delta` from the model is clamped to ±15/turn.
- Reaching endings: "gone" when interest ≤5 (or model storm-off at ≤20); "girlfriend" needs interest ≥85 (old chapter build) or final-section resolution ≥80; "rejected"/"drifted" otherwise.
- Realistic pacing: a genuinely charming run gained +3 to +14/turn and won in ~9 turns. Boring one-word spam loses ~2-7/turn; one creepy message tanked interest to 6 and ended the game.

## UI quirks found during testing (verify if still present)
- `newGame()` in `public/app.js` resets server state but never calls `renderState()` — the buddy-list mood/vibes/section label stay stale until the next sent message.
- Chat history is not re-rendered on page refresh (server remembers it; only the vibes/mood/section restore).
- The IM window is taller than a 768px viewport once the chat grows — compose box goes offscreen. Drag the titlebar up or zoom out (Ctrl+-) before typing.
- New build returns `suggestions` (3 numbered reply options) and `events` (`section_end`, `game_over`) from /api/chat; press 1/2/3 or click a suggestion to auto-type it.

## Fast testing pattern
- Driving via the real UI is preferred (shows typing indicator + sounds). Each turn takes ~10-15s (Anthropic latency + simulated typing). Waiting ~15s after Enter is reliable.
- Poll `GET /api/state` between sends for exact interest/mood/turn numbers rather than reading the vibes bar pixel width.
