// Game engine: session state, turn orchestration, persistence.

import fs from 'node:fs';
import path from 'node:path';
import { getProvider } from './llm.js';
import { buildSystemPrompt, parseTurn, chapterFor } from './lexi.js';
import { fallbackTurn } from './fallback.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const STARTING_INTEREST = 30;

const provider = getProvider();
export const AI_MODE = provider ? provider.name : 'fallback';

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'state.json'), 'utf8'));
  } catch {
    return null;
  }
}

function saveState(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, 'state.json'), JSON.stringify(state, null, 2));
}

function newState() {
  return {
    interest: STARTING_INTEREST,
    memories: [],
    history: [],       // [{who:'player'|'lexi'|'system', text}]
    turn: 0,
    outcome: null,     // null | 'girlfriend' | 'rejected' | 'gone'
    mood: 'neutral',
    lastDelta: 0,
    startedAt: Date.now(),
  };
}

let state = loadState() || newState();

function llmTurn(playerText) {
  const system = buildSystemPrompt(state);
  const messages = [{ role: 'user', content: playerText }];
  return provider.chat(system, messages).then(parseTurn);
}

export async function takeTurn(playerText) {
  if (state.outcome) {
    return { state: publicState(), messages: [], ended: true };
  }

  state.history.push({ who: 'player', text: playerText });
  state.turn += 1;

  let turn;
  if (provider) {
    try {
      turn = await llmTurn(playerText);
    } catch (err) {
      console.error('LLM error, using fallback:', err.message);
    }
  }
  if (!turn) turn = fallbackTurn(state, playerText);

  // Apply turn
  state.lastDelta = turn.interest_delta;
  state.interest = Math.max(0, Math.min(100, state.interest + turn.interest_delta));
  state.mood = turn.mood;
  for (const m of turn.new_memories) {
    if (!state.memories.includes(m)) state.memories.push(m);
  }
  for (const msg of turn.messages) {
    state.history.push({ who: 'lexi', text: msg });
  }

  // Endings — the model can only end the game where the story allows it
  if (state.interest <= 5) state.outcome = 'gone';
  else if (turn.outcome === 'girlfriend' && state.interest >= 85) state.outcome = 'girlfriend';
  else if (turn.outcome === 'rejected' && state.turn >= 10) state.outcome = 'rejected';
  else if (turn.outcome === 'gone' && state.interest <= 20) state.outcome = 'gone';

  saveState(state);
  return { state: publicState(), messages: turn.messages, ended: !!state.outcome };
}

export function getState() {
  return publicState();
}

export function reset() {
  state = newState();
  saveState(state);
  return publicState();
}

function publicState() {
  return {
    interest: state.interest,
    mood: state.mood,
    chapter: chapterFor(state.interest).id,
    chapterLabel: chapterFor(state.interest).label,
    memories: state.memories,
    turn: state.turn,
    outcome: state.outcome,
    aiMode: AI_MODE,
  };
}
