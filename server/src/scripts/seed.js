import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase, User, ResidentPreferences, CareCircle, Activity, FollowUpTask, CommunityEvent, HelpRequest, WisdomExchange, Notification, VolunteerVerification } from '../models/index.js';

const password='Circle2026!';
const names={coordinator:'Maya Coordinator',residents:['Mr. Sharma','Amara Kapoor','Dev Rao','Fatima Lal','Joseph D’Souza'],volunteers:['Rahul Kumar','Priya Sen','Anil Verma','Meera Joshi','Kavita Shah','Arjun Nair','Nisha Das','Farah Ali'],family:['Rohan Sharma','Neha Kapoor']};
async function seed(){
 await connectDatabase();
 for(const m of [Notification,FollowUpTask,Activity,CareCircle,ResidentPreferences,CommunityEvent,HelpRequest,WisdomExchange,VolunteerVerification,User])await m.deleteMany({});
 const pass=await bcrypt.hash(password,12);
 const coordinator=await User.create({name:names.coordinator,email:'coordinator@ncc.demo',passwordHash:pass,role:'coordinator',verificationStatus:'not-required'});
 const residents=await User.create(names.residents.map((name,i)=>({name,email:i===0?'resident@ncc.demo':`resident${i+1}@ncc.demo`,passwordHash:pass,role:'resident',interests:[['walking','chess','storytelling'],['gardening','cooking'],['music','walking'],['crafts','cooking'],['chess','gardening']][i],bio:'A neighbour with interests, experience and stories to share.'})));
 const volunteers=await User.create(names.volunteers.map((name,i)=>({name,email:i===0?'volunteer@ncc.demo':`volunteer${i+1}@ncc.demo`,passwordHash:pass,role:'volunteer',verificationStatus:i<6?'approved':'pending',skills:['walking','conversation','everyday help'],availability:true})));
 const family=await User.create(names.family.map((name,i)=>({name,email:i===0?'family@ncc.demo':'family2@ncc.demo',passwordHash:pass,role:'family',linkedResident:residents[i]._id,verificationStatus:'not-required'})));
 for(const r of residents)await ResidentPreferences.create({resident:r._id,consentToCircle:true,allowFamilyUpdates:false,graceMinutes:30,interests:r.interests,contactPreference:'either',followUpContacts:[coordinator._id]});
 const circleSpecs=[[0,[0,1]],[1,[2,3]],[3,[4,5]]];const circles=[];
 for(const [ri,vi] of circleSpecs)circles.push(await CareCircle.create({resident:residents[ri]._id,active:true,members:[{user:residents[ri]._id,role:'coordinator',approved:true,consentedAt:new Date()},{user:volunteers[vi[0]]._id,role:'primary',approved:true,consentedAt:new Date()},{user:volunteers[vi[1]]._id,role:'backup',approved:true,consentedAt:new Date()}]}));
 const now=new Date();const at=(days,hour=17)=>{const d=new Date(now);d.setDate(d.getDate()+days);d.setHours(hour,0,0,0);return d};
 const acts=await Activity.create([
  {title:'Wednesday evening walk',type:'walk',resident:residents[0]._id,primary:volunteers[0]._id,backup:volunteers[1]._id,assignedTo:volunteers[0]._id,startsAt:at(-2),recurrence:'weekly',graceMinutes:0,status:'Follow-up Required',notes:'Mr. Sharma prefers the garden loop.'},
  {title:'Saturday chess afternoon',type:'community event',resident:residents[0]._id,primary:volunteers[1]._id,backup:volunteers[0]._id,assignedTo:volunteers[1]._id,startsAt:at(3,16),recurrence:'weekly',status:'Scheduled',notes:'Chess at the community room.'},
  {title:'A catch-up call with Rahul',type:'phone call',resident:residents[0]._id,primary:volunteers[0]._id,backup:volunteers[1]._id,assignedTo:volunteers[0]._id,startsAt:at(1,11),recurrence:'weekly',status:'Accepted'},
  {title:'Balcony garden check-in',type:'visit',resident:residents[1]._id,primary:volunteers[2]._id,backup:volunteers[3]._id,assignedTo:volunteers[2]._id,startsAt:at(2,10),recurrence:'once',status:'Scheduled'},
  {title:'Grocery collection',type:'grocery help',resident:residents[3]._id,primary:volunteers[4]._id,backup:volunteers[5]._id,assignedTo:volunteers[4]._id,startsAt:at(-4,12),recurrence:'once',status:'Completed',outcome:'Groceries delivered as requested.',resolvedAt:at(-4,14)},
  {title:'Sunday story circle',type:'community event',resident:residents[4]._id,primary:volunteers[5]._id,backup:volunteers[4]._id,assignedTo:volunteers[5]._id,startsAt:at(5,15),recurrence:'weekly',status:'Scheduled'}
 ]);
 const follow=await FollowUpTask.create({activity:acts[0]._id,resident:residents[0]._id,assignedTo:coordinator._id,reason:'An agreed walk was marked missed. Please check in using Mr. Sharma’s preferred contact method.'});
 const events=await CommunityEvent.create([
  {title:'Saturday chess in the garden',category:'Chess & board games',description:'A relaxed afternoon for beginners and old friends. Bring a board or just bring yourself.',venue:'Maple Community Room',startsAt:at(3,16),capacity:12,accessibility:'Step-free entrance, seating available',organiser:coordinator._id,attendees:[residents[0]._id,residents[2]._id]},
  {title:'Morning garden circle',category:'Gardening',description:'Share cuttings, swap growing tips and tend to the neighbourhood planters.',venue:'Community Garden',startsAt:at(4,10),capacity:15,accessibility:'Outdoor path, benches nearby',organiser:coordinator._id,attendees:[residents[1]._id]},
  {title:'Stories over chai',category:'Storytelling',description:'An easygoing gathering to trade neighbourhood memories and favourite stories.',venue:'Library Meeting Room',startsAt:at(7,16),capacity:10,accessibility:'Lift access and quiet room',organiser:coordinator._id,attendees:[]},
  {title:'Recipes we grew up with',category:'Cooking',description:'A recipe exchange with a small demonstration and plenty of tasting.',venue:'Community Kitchen',startsAt:at(9,11),capacity:10,accessibility:'Accessible kitchen workspace',organiser:coordinator._id,attendees:[]}
 ]);
 const help=await HelpRequest.create([{resident:residents[2]._id,category:'Smartphone guidance',description:'Could someone show Dev how to make a video call?',preferredAt:at(2,11),status:'open'},{resident:residents[1]._id,category:'Company for a walk',description:'A companion for a short garden loop.',preferredAt:at(3,9),assignedTo:volunteers[3]._id,status:'assigned'}]);
 const wisdom=await WisdomExchange.create([{resident:residents[0]._id,title:'Chess for curious beginners',category:'Chess and Board Games',description:'Mr. Sharma would love to teach the basics and learn a few new tricks too.',startsAt:at(8,16),venue:'Maple Community Room',capacity:8},{resident:residents[1]._id,title:'Growing herbs in small spaces',category:'Gardening',description:'Amara shares simple ways to grow useful herbs on a balcony or windowsill.',startsAt:at(10,10),venue:'Community Garden',capacity:6},{resident:residents[4]._id,title:'The stories behind family recipes',category:'Traditional Cooking',description:'A relaxed recipe and story exchange for all ages.',startsAt:at(12,11),venue:'Community Kitchen',capacity:8}]);
 await Notification.create([{user:coordinator._id,title:'A gentle check-in is due',message:'Mr. Sharma’s Wednesday walk was missed. Please follow his agreed contact preferences.',kind:'follow-up',link:'/follow-ups'},{user:volunteers[1]._id,title:'Care Relay request',message:'Can you cover Mr. Sharma’s Wednesday walk? Accept only if you are available.',kind:'relay',link:'/schedule'},{user:residents[0]._id,title:'A follow-up is underway',message:'Your circle noticed the walk was missed. A coordinator will check in; you decide the next step.',kind:'follow-up',link:'/schedule'}]);
 await VolunteerVerification.insertMany(volunteers.map((v,i)=>({volunteer:v._id,status:i<6?'approved':'pending',reviewedBy:i<6?coordinator._id:undefined,reviewedAt:i<6?now:undefined})));
 console.log(`Seeded ${residents.length} residents, ${volunteers.length} volunteers, ${family.length} family contacts, ${events.length} events and ${acts.length} activities.`);
 console.log('Demo accounts: resident@ncc.demo, volunteer@ncc.demo, coordinator@ncc.demo, family@ncc.demo');console.log(`Demo password: ${password}`);
 await disconnectDatabase();
}
seed().catch(async err=>{console.error(err);await disconnectDatabase();process.exit(1)});
