const $ = (id) => document.getElementById(id);
const messagesEl = $('messages');
const typingEl = $('typing');
const composeEl = $('compose');
const sugEl = $('suggestions');

/* ---------- AIM sounds (synthesized, no audio files needed) ---------- */
let audioCtx = null;
function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function blip(freq, dur, delay = 0, vol = 0.12, type = 'sine') {
  const ctx = ac();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + delay);
  o.stop(ctx.currentTime + delay + dur);
}
const sndSend = () => blip(880, 0.08);
const sndRecv = () => { blip(660, 0.09); blip(990, 0.12, 0.09); };
const sndDoor = () => { blip(180, 0.25, 0, 0.15, 'sawtooth'); blip(320, 0.15, 0.22); };
const sndSlam = () => blip(120, 0.4, 0, 0.18, 'sawtooth');

/* ---------- draggable windows ---------- */
document.querySelectorAll('.window').forEach((win) => {
  const bar = win.querySelector('.titlebar');
  bar.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('tbtn')) return;
    const ox = e.clientX - win.offsetLeft;
    const oy = e.clientY - win.offsetTop;
    win.style.zIndex = ++window.topZ || (window.topZ = 10);
    const move = (ev) => {
      win.style.left = Math.max(0, ev.clientX - ox) + 'px';
      win.style.top = Math.max(0, ev.clientY - oy) + 'px';
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
});

/* ---------- rendering ---------- */
let currentMood = 'neutral';

function stamp() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function addMsg(who, text) {
  const div = document.createElement('div');
  div.className = `msg ${who}`;
  if (who === 'system') {
    div.textContent = text;
  } else {
    const name = who === 'player' ? 'you' : 'xX_lexi_Xx';
    div.innerHTML = `<span class="who">${name}</span> <span class="time">${stamp()}</span>: `;
    div.appendChild(document.createTextNode(text));
  }
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderState(s) {
  $('interest-fill').style.width = s.interest + '%';
  $('buddy-mood').textContent = s.mood || '';
  $('chapter-label').textContent = s.sectionTitle || 'Lexi is online';
  if (s.mood && s.mood !== currentMood) {
    currentMood = s.mood;
    drawFace($('lexi-face'), currentMood);
    drawFace($('buddy-face'), currentMood);
  }
}

/* ---------- suggestions (Emily-is-Away style numbered options) ---------- */
let currentSuggestions = [];

function renderSuggestions(list) {
  currentSuggestions = list || [];
  sugEl.innerHTML = '';
  currentSuggestions.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'sug';
    div.innerHTML = `<span class="num">${i + 1}.</span>`;
    div.appendChild(document.createTextNode(s));
    div.addEventListener('click', () => pickSuggestion(i));
    sugEl.appendChild(div);
  });
}

// Pick an option: it "types" itself into the compose box, then sends.
let autoTyping = false;
async function pickSuggestion(i) {
  const text = currentSuggestions[i];
  if (!text || busy || autoTyping) return;
  autoTyping = true;
  renderSuggestions([]);
  composeEl.value = '';
  for (let c = 0; c < text.length; c++) {
    composeEl.value += text[c];
    if (c % 3 === 0) blip(1400 + Math.random() * 400, 0.02, 0, 0.03, 'square');
    await sleep(28);
  }
  autoTyping = false;
  send();
}

/* ---------- game flow ---------- */
let busy = false;

async function send() {
  const text = composeEl.value.trim();
  if (!text || busy || autoTyping) return;
  busy = true;
  composeEl.value = '';
  renderSuggestions([]);
  addMsg('player', text);
  sndSend();

  typingEl.classList.remove('hidden');
  let data;
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    data = await res.json();
  } catch {
    typingEl.classList.add('hidden');
    addMsg('system', '~ connection lost. the horror. ~');
    busy = false;
    return;
  }

  // she "types" for a beat per message
  const lexiMsgs = data.messages || [];
  for (let i = 0; i < lexiMsgs.length; i++) {
    await sleep(500 + lexiMsgs[i].length * 25);
    if (i === lexiMsgs.length - 1) typingEl.classList.add('hidden');
    addMsg('lexi', lexiMsgs[i]);
    sndRecv();
  }
  typingEl.classList.add('hidden');
  renderState(data.state);
  renderSuggestions(data.suggestions);
  busy = false;
  composeEl.focus();

  for (const ev of data.events || []) {
    if (ev.type === 'section_end') await sectionTransition(data.state, ev.reason);
    if (ev.type === 'game_over') endGame(ev.outcome);
  }
}

async function sectionTransition(state, reason) {
  sndSlam();
  addMsg('system', '*xX_lexi_Xx has signed off*');
  await sleep(900);
  $('section-card-text').textContent = state.sectionCard;
  $('section-card').classList.remove('hidden');
  await sleep(2600);
  $('section-card').classList.add('hidden');
  messagesEl.innerHTML = '';
  renderSuggestions([]);
  sndDoor();
  addMsg('system', '*xX_lexi_Xx has signed on*');
  await sleep(400);
  if (reason === 'stormed') {
    addMsg('system', 'she signed back on... but she remembers how that ended.');
  }
}

function endGame(outcome) {
  const el = $('ending-overlay');
  const title = $('ending-title');
  const text = $('ending-text');
  if (outcome === 'girlfriend') {
    title.innerHTML = '&lt;3 she said yes &lt;3';
    text.textContent = 'xX_lexi_Xx is officially your girlfriend. her away message is about you now.';
  } else if (outcome === 'rejected') {
    title.textContent = 'the friendzone';
    text.textContent = 'she thinks you\'re "really sweet, but..." — you know how this ends.';
  } else if (outcome === 'drifted') {
    title.textContent = 'emily is away';
    text.textContent = 'the conversations got shorter. then they stopped. whatever this was, it\'s over now.';
  } else {
    title.textContent = '*door slam*';
    text.textContent = 'xX_lexi_Xx has signed off. she is not coming back. you blew it.';
  }
  sndSlam();
  el.classList.remove('hidden');
}

async function newGame() {
  await fetch('/api/reset', { method: 'POST' });
  messagesEl.innerHTML = '';
  renderSuggestions([]);
  $('ending-overlay').classList.add('hidden');
  const s = await (await fetch('/api/state')).json();
  renderState(s);
  $('section-card-text').textContent = s.sectionCard;
  $('section-card').classList.remove('hidden');
  await sleep(2200);
  $('section-card').classList.add('hidden');
  sndDoor();
  addMsg('system', '*xX_lexi_Xx has signed on*');
  await sleep(400);
  addMsg('system', 'you\'ve been staring at her screen name for 20 minutes.');
  composeEl.focus();
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/* ---------- boot ---------- */
$('send-btn').addEventListener('click', send);
$('reset-btn').addEventListener('click', newGame);
$('ending-reset').addEventListener('click', newGame);
$('block-btn').addEventListener('click', () => addMsg('system', 'you can\'t block her. you like her too much.'));
$('warn-btn').addEventListener('click', () => addMsg('system', 'warning her would definitely ruin everything. don\'t.'));
composeEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
});
document.addEventListener('keydown', (e) => {
  if (['1', '2', '3'].includes(e.key) && document.activeElement !== composeEl) {
    pickSuggestion(Number(e.key) - 1);
  }
});

(async () => {
  drawFace($('player-face'), 'neutral', '#3a3a3a');
  drawFace($('lexi-face'), 'neutral');
  drawFace($('buddy-face'), 'neutral');
  const s = await (await fetch('/api/state')).json();
  renderState(s);
  if (s.outcome) { endGame(s.outcome); return; }
  addMsg('system', '*xX_lexi_Xx has signed on*');
  sndDoor();
  await sleep(400);
  if (Array.isArray(s.history) && s.history.length) {
    for (const h of s.history) addMsg(h.who, h.text);
    addMsg('system', '— ' + (s.sectionCard || '') + ' —');
  } else {
    addMsg('system', s.sectionCard || 'it\'s late. you\'ve been staring at her screen name for 20 minutes.');
  }
})();
