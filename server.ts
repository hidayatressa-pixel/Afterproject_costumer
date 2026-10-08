import express from 'express';
import cors from 'cors';

const app = express();
const port = Number(process.env.PORT || 10000);
app.use(cors({ origin: true }));
app.use(express.json({ limit: '60mb' }));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'after-project-photocopy-api' }));
app.listen(port, () => console.log('After Project API listening on ' + port));
