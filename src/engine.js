// Game engine: session state, section transitions, turn orchestration.

import fs from 'node:fs';
import path from 'node:path';
import { getProvider } from './llm.js';
import { buildSystemPrompt, parseTurn, sectionFor } from './lexi.js';
import { SECTIONS } from './sections.js';
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
    history: [],
    turn: 0,
    sectionIndex: 0,
    sectionTurn: 0,
    lastEndMood: null,   // 'natural' | 'stormed' | null
    outcome: null,       // null | 'girlfriend' | 'rejected' | 'gone' | 'drifted'
    mood: 'neutral',
    lastDelta: 0,
    startedAt: Date.now(),
  };
}

let state = migrate(loadState()) || newState();

function migrate(s) {
  if (!s || typeof s !== 'object') return null;
  return { ...newState(), ...s };
}

function llmTurn(playerText) {
  const system = buildSystemPrompt(state);
  const messages = [{ role: 'user', content: playerText }];
  return provider.chat(system, messages).then(parseTurn);
}

// Is the current section over, and why?
function sectionShouldEnd(turn) {
  const section = sectionFor(state);
  if (turn.storm_off) return 'stormed';
  if (state.interest <= 5) return 'stormed';
  if (turn.end_section) return 'natural';
  if (state.sectionTurn >= section.maxTurns) return 'natural';
  return null;
}

function endGame(outcome) {
  state.outcome = outcome;
  return { type: 'game_over', outcome };
}

// Advance to the next section, or end the game if we're out of sections.
function closeSection(reason) {
  state.lastEndMood = reason === 'stormed' ? 'stormed' : 'natural';

  // An abrupt angry exit at rock-bottom interest can just end it.
  if (reason === 'stormed' && state.interest <= 5) {
    return endGame('gone');
  }

  const next = state.sectionIndex + 1;
  if (next >= SECTIONS.length) {
    // Final section ended without a declared outcome — the Emily-is-Away
    // ending: whatever this was resolves by where interest landed.
    if (state.interest >= 80) return endGame('girlfriend');
    if (state.interest >= 45) return endGame('drifted');
    return endGame('rejected');
  }

  state.sectionIndex = next;
  state.sectionTurn = 0;
  state.history = [];
  return { type: 'section_end', reason, next };
}

export async function takeTurn(playerText) {
  if (state.outcome) {
    return { state: publicState(), messages: [], events: [], ended: true };
  }

  state.history.push({ who: 'player', text: playerText });
  state.turn += 1;
  state.sectionTurn += 1;

  const events = [];
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

  // Direct outcomes — gated so she can't agree to be his girlfriend in section 1
  const isFinalSection = state.sectionIndex === SECTIONS.length - 1;
  if (turn.outcome === 'gone' && state.interest <= 20) {
    events.push(endGame('gone'));
  } else if (turn.outcome === 'girlfriend' && isFinalSection && state.interest >= 85) {
    events.push(endGame('girlfriend'));
  } else if (turn.outcome === 'rejected' && (isFinalSection || state.turn >= 10)) {
    events.push(endGame('rejected'));
  } else if (turn.outcome === 'drifted' && isFinalSection) {
    events.push(endGame('drifted'));
  } else {
    // Section transitions
    const reason = sectionShouldEnd(turn);
    if (reason) events.push(closeSection(reason));
  }

  saveState(state);
  return {
    state: publicState(),
    messages: turn.messages,
    suggestions: turn.suggestions || [],
    events,
    ended: !!state.outcome,
  };
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
  const section = sectionFor(state);
  return {
    interest: state.interest,
    mood: state.mood,
    section: section.id,
    sectionTitle: section.title,
    sectionIndex: state.sectionIndex,
    sectionCard: section.card,
    totalSections: SECTIONS.length,
    memories: state.memories,
    history: state.history,
    turn: state.turn,
    outcome: state.outcome,
    aiMode: AI_MODE,
  };
}
