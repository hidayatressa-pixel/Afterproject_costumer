import express from 'express';
const app = express();
const port = Number(process.env.PORT || 10000);
app.get('/health', (_req, res) => res.json({ ok: true }));
app.listen(port, () => console.log(`API listening on ${port}`));
