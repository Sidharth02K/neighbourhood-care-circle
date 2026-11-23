import express from 'express';
import app from '../server/src/app.js';

// Keep an Express entrypoint at a location Vercel's Express builder detects.
// The Vite build is copied into /public and served by Vercel's static CDN.
const handler = express();
handler.use(app);

export default handler;
