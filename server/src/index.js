import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './models/index.js';
import { startRhythmJob } from './jobs/socialRhythm.js';

const port=process.env.PORT||4000;
connectDatabase().then(()=>{
  app.listen(port,()=>console.log(`Neighbourhood Care Circle API listening on ${port} (${process.env.SUPABASE_URL?'Supabase':'MongoDB'})`));
  startRhythmJob();
}).catch(error=>{
  console.error('Database connection failed:',error.message);
  process.exit(1);
});
