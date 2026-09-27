import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { takeTurn, getState, reset, AI_MODE } from './src/engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const text = String(req.body?.message || '').trim();
  if (!text) return res.status(400).json({ error: 'empty message' });
  const result = await takeTurn(text);
  res.json(result);
});

app.get('/api/state', (_req, res) => res.json(getState()));
app.post('/api/reset', (_req, res) => res.json(reset()));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AIM is running at http://localhost:${PORT} (Lexi brain: ${AI_MODE})`);
});
