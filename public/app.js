const $ = (id) => document.getElementById(id);
const messagesEl = $('messages');
const typingEl = $('typing');
const composeEl = $('compose');

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
const MOOD_ICON = {
  bored: '😴', neutral: '🙂', curious: '🤔', amused: '😄',
  flirty: '😏', annoyed: '😒', hurt: '😢', smitten: '😍',
};

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
    div.innerHTML = `<span class="who">${name}</span><span class="time">${stamp()}</span>: `;
    div.appendChild(document.createTextNode(text));
  }
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderState(s) {
  $('interest-fill').style.width = s.interest + '%';
  $('buddy-mood').textContent = (MOOD_ICON[s.mood] || '') + ' ' + (s.mood || '');
  $('chapter-label').textContent = s.chapterLabel || 'Lexi is online';
}

/* ---------- game flow ---------- */
let busy = false;

async function send() {
  const text = composeEl.value.trim();
  if (!text || busy) return;
  busy = true;
  composeEl.value = '';
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
  busy = false;
  composeEl.focus();

  if (data.state.outcome) endGame(data.state.outcome);
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
  $('ending-overlay').classList.add('hidden');
  addMsg('system', '*xX_lexi_Xx has signed on*');
  sndDoor();
  addMsg('system', 'it\'s 9:47pm on a thursday. you\'ve been staring at her screen name for 20 minutes.');
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

(async () => {
  const s = await (await fetch('/api/state')).json();
  renderState(s);
  if (s.outcome) { endGame(s.outcome); return; }
  addMsg('system', '*xX_lexi_Xx has signed on*');
  sndDoor();
  await sleep(400);
  addMsg('system', 'it\'s 9:47pm on a thursday. you\'ve been staring at her screen name for 20 minutes.');
})();
