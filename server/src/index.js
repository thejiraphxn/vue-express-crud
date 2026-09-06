import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { productsRouter } from './routes/products.js';
import { HttpError } from './lib/errors.js';
import { CATEGORIES, STATUSES } from './schemas.js';
import { countProducts } from './db.js';

const PORT = Number(process.env.PORT ?? 3001);
/** หน่วงเวลาเทียม (ms) เพื่อให้เห็น loading / optimistic update ฝั่ง client ชัด ๆ */
const LATENCY = Number(process.env.FAKE_LATENCY ?? 250);

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use((_req, _res, next) => {
  if (!LATENCY) return next();
  setTimeout(next, LATENCY);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', products: countProducts(), uptime: process.uptime() });
});

// ให้ฝั่ง client ดึง option ของ dropdown จาก server แทนการ hardcode ซ้ำสองที่
app.get('/api/meta', (_req, res) => {
  res.json({ data: { categories: CATEGORIES, statuses: STATUSES } });
});

app.use('/api/products', productsRouter);

app.use((req, res) => {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}`, code: 'not_found' });
});

// error handler กลาง — ทุก error ออกหน้าตาเดียวกัน client จึง parse ที่เดียวจบ
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, code: err.code, errors: err.errors });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body', code: 'bad_request' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error', code: 'internal_error' });
});

app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT} (fake latency ${LATENCY}ms)`);
});
