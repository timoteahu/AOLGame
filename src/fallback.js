// Scripted Lexi — used when no LLM API key is configured. Rule-based scoring
// and response pools keep the game playable offline; a real model makes her
// far more convincing.

import { chapterFor } from './lexi.js';

const CREEPY = /\b(sex|hot\b|boobs|nudes|send (me )?pic|wanna hook up|make ?out)\b/i;
const BRAGGY = /\b(i'?m (the )?(best|rich|jacked|captain)|everyone loves me|all (the )?girls)\b/i;
const BORING = /^(hey|hi|sup|yo|lol|k|ok|nm|wassup|wsg)\.?$/i;
const QUESTION = /\?|(^|\s)(what|how|why|when|where|who|do you|are you|have you)\b/i;
const DANCE_ASK = /\b(dance|formal|prom|go with me|go with you|be my date)\b.*\?/i;
const FEELINGS = /\b(i like you|i love you|be my girlfriend|girlfriend|go out with me|you'?re (amazing|beautiful|special))\b/i;

const GREETS = [
  'hey lol',
  'oh hey',
  'umm hi? do i know u lol',
];

const COLD = ['lol', 'k', 'yeah', 'cool', 'anyway', 'lol ok'];
const WARM_OPEN = [
  'wait ur actually kinda funny lol',
  'haha ok ur not as weird as i thought',
  'lol ok i see u',
  'haha ok continue',
];
const CURIOUS = [
  'so tell me something about u',
  'what do u do for fun anyway',
  'wait what music do u like. this is important',
  'ok real question. the OC: seth or ryan',
];
const FLIRTY = [
  'ur kinda cute when ur trying lol',
  'stop making me laugh i have homework',
  'haha u always know what to say',
  ';) ok that was smooth ngl',
];
const DANCE_HINTS = [
  'sooo winter formal is friday. everyone keeps asking if im going lol',
  'r u going to the dance friday? just curious lol',
  'omg everyone is talking about the formal. its so annoying lol. ...r u going?',
];
const ANNOYED = [
  'wow ok',
  'lol. anyway',
  'did u really just say that',
  'yikes lol',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function scoreMessage(text, state) {
  let delta = 0;
  if (CREEPY.test(text)) delta -= 14;
  if (BRAGGY.test(text)) delta -= 6;
  if (BORING.test(text.trim())) delta -= 4;
  if (QUESTION.test(text)) delta += 3;
  if (DANCE_ASK.test(text)) delta += state.interest >= 45 ? 9 : -2;
  if (FEELINGS.test(text)) delta += state.interest >= 60 ? 8 : -3;
  if (text.trim().split(/\s+/).length >= 8) delta += 2; // effort
  if (/sorry|my bad|ur right/i.test(text) && state.lastDelta < 0) delta += 4;
  return Math.max(-15, Math.min(15, delta));
}

function extractMemories(text, existing) {
  const found = [];
  const name = text.match(/\b(?:i'?m|my name'?s|call me|im)\s+([A-Z][a-z]+)\b/);
  if (name && !existing.some((m) => m.includes('name'))) {
    found.push(`his name is ${name[1]}`);
  }
  const hobby = text.match(/\bi (?:play|like|love|do)\s+([a-z ]{2,30})/i);
  if (hobby && found.length < 2) {
    found.push(`he ${hobby[0].replace(/^i\s+/i, 'likes/plays ')}`);
  }
  return found;
}

export function fallbackTurn(state, playerText) {
  const interest = state.interest;
  const delta = scoreMessage(playerText, state);
  const newInterest = Math.max(0, Math.min(100, interest + delta));
  const chapter = chapterFor(newInterest);
  const memories = extractMemories(playerText, state.memories);

  let messages, mood = 'neutral', outcome = null;

  if (state.turn === 1) {
    messages = [pick(GREETS), 'ur the kid from english right?'];
    mood = 'curious';
  } else if (newInterest <= 5) {
    messages = ['yeah im gonna go lol', '*xX_lexi_Xx has signed off*'];
    mood = 'annoyed';
    outcome = 'gone';
  } else if (delta <= -8) {
    messages = [pick(ANNOYED), newInterest < 25 ? 'brb' : undefined].filter(Boolean);
    mood = 'annoyed';
  } else if (DANCE_ASK.test(playerText) && newInterest >= 45) {
    messages = ['omg', 'wait seriously??', 'YES lol ok. pick me up at 7 :)'];
    mood = 'smitten';
    memories.push('you asked her to the Winter Formal and she said YES');
  } else if (FEELINGS.test(playerText) && newInterest >= 85) {
    messages = ['...', 'ok i was wondering when ud say that lol', 'i like u too. obviously :) <3'];
    mood = 'smitten';
    outcome = 'girlfriend';
  } else if (chapter.id === 'the_dance' && delta > 0 && Math.random() < 0.4) {
    messages = [pick(DANCE_HINTS)];
    mood = 'curious';
  } else if (newInterest >= 70 && delta > 2) {
    messages = [pick(FLIRTY)];
    mood = 'flirty';
  } else if (delta >= 3) {
    messages = [pick(WARM_OPEN), pick(CURIOUS)];
    mood = 'amused';
  } else {
    messages = [pick(COLD)];
    mood = 'bored';
  }

  return {
    messages,
    interest_delta: newInterest - interest,
    mood,
    new_memories: memories,
    outcome,
  };
}
