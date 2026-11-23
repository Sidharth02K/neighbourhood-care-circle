import 'dotenv/config';
import { connectDatabase, disconnectDatabase, User } from '../models/index.js';

async function repair(){
 await connectDatabase();
 const expected=await User.findOne({email:'resident@ncc.demo'});
 if(expected){console.log('resident@ncc.demo already exists; no change made.');await disconnectDatabase();return}
 const sharma=await User.findOne({email:'resident1@ncc.demo',name:'Mr. Sharma',role:'resident'});
 if(!sharma){console.log('No legacy Mr. Sharma demo account found; seed the demo database first.');await disconnectDatabase();process.exitCode=1;return}
 sharma.email='resident@ncc.demo';await sharma.save();
 console.log('Updated the existing Mr. Sharma demo account email to resident@ncc.demo. No other records were changed.');
 await disconnectDatabase();
}
repair().catch(async err=>{console.error(err);await disconnectDatabase();process.exit(1)});
