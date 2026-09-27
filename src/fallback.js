// Scripted Lexi — used when no LLM API key is configured. Rule-based scoring
// and response pools keep the game playable offline; a real model makes her
// far more convincing.

import { sectionFor } from './lexi.js';
import { SECTIONS } from './sections.js';

const CREEPY = /\b(sex|hot\b|boobs|nudes|send (me )?pic|wanna hook up|make ?out)\b/i;
const BRAGGY = /\b(i'?m (the )?(best|rich|jacked|captain)|everyone loves me|all (the )?girls)\b/i;
const BORING = /^(hey|hi|sup|yo|lol|k|ok|nm|wassup|wsg|hey lexi)\.?$/i;
const QUESTION = /\?|(^|\s)(what|how|why|when|where|who|do you|are you|have you)\b/i;
const DANCE_ASK = /\b(dance|formal|prom|go with me|go with you|be my date)\b.*\?/i;
const FEELINGS = /\b(i like you|i love you|be my girlfriend|girlfriend|go out with me|you'?re (amazing|beautiful|special))\b/i;

const GREETS = [
  'oh hey lol',
  'umm hi? do i know u lol',
  'heyy. ur the kid from english right?',
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
  'sooo winter formal is coming up. everyone keeps asking if im going lol',
  'r u going to the dance? just curious lol',
  'omg everyone is talking about the formal. its so annoying lol. ...r u going?',
];
const ANNOYED = [
  'wow ok',
  'lol. anyway',
  'did u really just say that',
  'yikes lol',
];
const SIGNOFF = [
  'ok g2g, dinner. ttyl',
  'my moms yelling at me to get off the computer lol. later',
  'im gonna go to bed. night :)',
];
const STORM = ['ok im done lol', 'dont message me again', 'wow. bye.'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function scoreMessage(text, state) {
  let delta = 0;
  if (CREEPY.test(text)) delta -= 14;
  if (BRAGGY.test(text)) delta -= 6;
  if (BORING.test(text.trim())) delta -= 4;
  if (QUESTION.test(text)) delta += 3;
  if (DANCE_ASK.test(text)) delta += state.interest >= 40 ? 9 : -2;
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
  const section = sectionFor(state);
  const isFinal = state.sectionIndex === SECTIONS.length - 1;
  const memories = extractMemories(playerText, state.memories);

  let messages, mood = 'neutral', outcome = null;
  let end_section = false, storm_off = false;

  if (state.sectionTurn === 1) {
    const openers = {
      junior_spring: [pick(GREETS)],
      junior_dance: ['omg hey. getting ready rn lol'],
      summer: ['cant sleep either huh'],
      senior_fall: ['heyy. long time'],
      senior_spring: ['hey. cant believe its been a year since u first IMed me lol'],
    };
    messages = openers[section.id] || [pick(GREETS)];
    mood = state.lastEndMood === 'stormed' ? 'annoyed' : 'curious';
    if (state.lastEndMood === 'stormed') messages = ['oh. hi.'];
  } else if (newInterest <= 5) {
    messages = [pick(STORM)];
    mood = 'annoyed';
    storm_off = true;
    if (isFinal || newInterest <= 2) outcome = 'gone';
  } else if (delta <= -8) {
    messages = [pick(ANNOYED)];
    mood = 'annoyed';
    if (newInterest < 15) storm_off = true;
  } else if (DANCE_ASK.test(playerText) && newInterest >= 40) {
    messages = ['omg', 'wait seriously??', 'YES lol ok :)'];
    mood = 'smitten';
    memories.push('he asked me to the dance and i said yes');
  } else if (FEELINGS.test(playerText) && isFinal && newInterest >= 85) {
    messages = ['...', 'ok i was wondering when ud say that lol', 'i like u too. obviously :) <3'];
    mood = 'smitten';
    outcome = 'girlfriend';
  } else if (FEELINGS.test(playerText) && isFinal && newInterest >= 45) {
    messages = ['aww thats really sweet', 'but honestly... i think we\'re better as friends', 'sorry :('];
    mood = 'hurt';
    outcome = 'rejected';
  } else if (section.id === 'junior_spring' && delta > 0 && Math.random() < 0.35) {
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

  // Section wind-down: near the turn cap, she signs off naturally.
  if (!outcome && !storm_off && state.sectionTurn >= section.maxTurns) {
    messages = [...messages, pick(SIGNOFF)];
    end_section = true;
  }

  // Final section ending unresolved → let interest decide at close.
  if (!outcome && !storm_off && isFinal && state.sectionTurn >= section.maxTurns) {
    outcome = newInterest >= 80 ? 'girlfriend' : newInterest >= 45 ? 'drifted' : 'rejected';
  }

  const suggestions = buildSuggestions(section.id, newInterest);

  return {
    messages,
    interest_delta: newInterest - interest,
    mood,
    new_memories: memories,
    end_section,
    storm_off,
    outcome,
    suggestions,
  };
}

function buildSuggestions(sectionId, interest) {
  if (sectionId === 'junior_spring') {
    return [
      'so are u going to the winter formal?',
      'whats ur favorite class? and dont say lunch',
      'i might need help with the english homework... ur obviously the expert',
    ];
  }
  if (sectionId === 'junior_dance') {
    return [
      'i wish i was there with u instead',
      'have fun tonight! u look great in ur pics im sure',
      'want me to sneak u out via the gym doors lol',
    ];
  }
  if (sectionId === 'summer') {
    return [
      'tell me something uve never told anyone',
      'what are u doing tomorrow? we could hang out',
      'honestly? i think about talking to u a lot',
    ];
  }
  if (sectionId === 'senior_fall') {
    return [
      'u ever think about what happens after graduation?',
      'whos this guy u keep mentioning lol. jealous btw',
      'ur one of the only good things about this school',
    ];
  }
  return [
    'lexi. i like u. i have for a while.',
    'prom? id rather just hang out with u somewhere',
    'whatever happens this year, im glad we talked',
  ];
}
