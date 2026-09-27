// Tiny 16x16 pixel-art faces — Lexi's buddy icon, expression driven by mood.

const C = {
  hair: '#7a4a21',
  skin: '#f2c290',
  eye: '#2a2a3a',
  mouth: '#9c4040',
  blush: '#e89aa0',
  heart: '#e03050',
  shirt: '#5a7ac0',
};

// Base head shape (16x16). ' ' = empty
const BASE = [
  '    hhhhhhhh    ',
  '  hhhhhhhhhhhh  ',
  ' hhhhhhhhhhhhhh ',
  ' hhsssssssssshh ',
  ' hssssssssssssh ',
  ' hssssssssssssh ',
  ' hssssssssssssh ',
  ' hssssssssssssh ',
  ' hssssssssssssh ',
  ' hssssssssssssh ',
  ' hhsssssssssshh ',
  '  hssssssssssh  ',
  '   ssssssssss   ',
  '    ttTTtttt    ',
  '    tttttttt    ',
  '   tttttttttt   ',
];

// eye/mouth variants: list of [x, y, color] stamps
const EYES = {
  open:    [[5,6,'e'],[6,6,'e'],[10,6,'e'],[11,6,'e'],[5,7,'e'],[6,7,'e'],[10,7,'e'],[11,7,'e']],
  happy:   [[5,6,'e'],[6,6,'e'],[10,6,'e'],[11,6,'e'],[4,7,'e'],[7,7,'e'],[9,7,'e'],[12,7,'e']],
  half:    [[4,6,'e'],[5,6,'e'],[6,6,'e'],[9,6,'e'],[10,6,'e'],[11,6,'e'],[5,7,'e'],[10,7,'e']],
  wink:    [[5,6,'e'],[6,6,'e'],[5,7,'e'],[6,7,'e'],[10,7,'e'],[11,7,'e']],
  angry:   [[4,5,'e'],[5,5,'e'],[11,5,'e'],[12,5,'e'],[5,7,'e'],[6,7,'e'],[10,7,'e'],[11,7,'e']],
  sad:     [[5,6,'e'],[6,6,'e'],[10,6,'e'],[11,6,'e'],[4,7,'e'],[7,7,'e'],[9,7,'e'],[12,7,'e']],
  hearts:  [[5,6,'H'],[6,6,'H'],[10,6,'H'],[11,6,'H'],[5,7,'H'],[6,7,'H'],[10,7,'H'],[11,7,'H']],
};

const MOUTHS = {
  smile:  [[6,10,'m'],[7,10,'m'],[8,10,'m'],[9,10,'m'],[5,9,'m'],[10,9,'m']],
  grin:   [[5,10,'m'],[6,10,'m'],[7,10,'m'],[8,10,'m'],[9,10,'m'],[10,10,'m'],[6,11,'m'],[7,11,'m'],[8,11,'m'],[9,11,'m']],
  flat:   [[6,10,'m'],[7,10,'m'],[8,10,'m'],[9,10,'m']],
  frown:  [[5,10,'m'],[10,10,'m'],[6,11,'m'],[7,11,'m'],[8,11,'m'],[9,11,'m']],
  smirk:  [[6,10,'m'],[7,10,'m'],[8,10,'m'],[9,10,'m'],[10,9,'m']],
  open:   [[6,10,'m'],[7,10,'m'],[8,10,'m'],[9,10,'m'],[6,11,'m'],[7,11,'m'],[8,11,'m'],[9,11,'m']],
};

const MOOD_FACE = {
  neutral: { eyes: 'open', mouth: 'flat', blush: false },
  curious: { eyes: 'open', mouth: 'smile', blush: false },
  amused:  { eyes: 'happy', mouth: 'grin', blush: true },
  flirty:  { eyes: 'wink', mouth: 'smirk', blush: true },
  bored:   { eyes: 'half', mouth: 'flat', blush: false },
  annoyed: { eyes: 'angry', mouth: 'frown', blush: false },
  hurt:    { eyes: 'sad', mouth: 'frown', blush: false },
  smitten: { eyes: 'hearts', mouth: 'open', blush: true },
};

const COLORMAP = { h: C.hair, s: C.skin, e: C.eye, m: C.mouth, b: C.blush, H: C.heart, t: C.shirt, T: '#4a6ab0' };

// Draw a 16x16 face onto a canvas element (its size = pixel scale).
function drawFace(canvas, mood = 'neutral', hair = C.hair) {
  const px = canvas.width / 16;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const put = (x, y, color) => {
    ctx.fillStyle = color === C.hair ? hair : color;
    ctx.fillRect(x * px, y * px, px, px);
  };

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = BASE[y][x];
      if (ch !== ' ' && COLORMAP[ch]) put(x, y, COLORMAP[ch]);
    }
  }

  const face = MOOD_FACE[mood] || MOOD_FACE.neutral;
  for (const [x, y, key] of EYES[face.eyes]) put(x, y, COLORMAP[key]);
  for (const [x, y, key] of MOUTHS[face.mouth]) put(x, y, COLORMAP[key]);
  if (face.blush) {
    put(3, 8, C.blush); put(4, 8, C.blush);
    put(11, 8, C.blush); put(12, 8, C.blush);
  }
}

const MOODS = Object.keys(MOOD_FACE);
