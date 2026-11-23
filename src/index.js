import app from '../server/src/app.js';

// Vercel detects this default-exported Express app as a serverless function.
// The Vite build is copied into /public and served by Vercel's static CDN.
export default app;
