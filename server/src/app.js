import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import api from './routes/api.js';
import { connectDatabase } from './models/index.js';
import { checkOverdue } from './jobs/socialRhythm.js';

const app=express();
const publicDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../public');
const allowedOrigins=[
  ...(process.env.CLIENT_ORIGIN||'http://localhost:5173').split(',').map(x=>x.trim()).filter(Boolean),
  process.env.VERCEL_URL&&`https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_PROJECT_PRODUCTION_URL&&`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
].filter(Boolean);
app.use(helmet());
app.use(cors({origin(origin,callback){if(!origin||allowedOrigins.includes(origin))return callback(null,true);return callback(new Error('This origin is not allowed.'))}}));
app.use(express.json({limit:'100kb'}));
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'Neighbourhood Care Circle API',database:process.env.SUPABASE_URL?'supabase':'mongodb'}));
app.use(async(req,res,next)=>{
  try{
    await connectDatabase();
    // Function instances are short-lived on Vercel, so check due routines while
    // the client is actively using the app. The local process also runs a timer.
    if(req.path==='/api/data'||req.path==='/api/follow-ups')await checkOverdue();
    next();
  }catch(error){next(error)}
});
app.use('/api',api);
app.use(express.static(publicDir));
app.get('*',(req,res,next)=>{
  if(req.path==='/api'||req.path.startsWith('/api/'))return next();
  res.sendFile(path.join(publicDir,'index.html'),error=>{if(error)next(error)});
});
app.use((error,_req,res,_next)=>{
  console.error(error);
  if(error.code===11000||error.code==='23505')return res.status(409).json({message:'That record already exists.'});
  if(error.name==='ValidationError')return res.status(400).json({message:Object.values(error.errors).map(x=>x.message).join(' ')});
  res.status(500).json({message:process.env.NODE_ENV==='production'?'Something went wrong.':'Server error. Check the API configuration.'});
});
export default app;

