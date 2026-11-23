import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

export const databaseType = 'supabase';
const table = 'ncc_records';
let client;
let verified=false;
function db(){
  if(client)return client;
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before starting the API.');
  client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  return client;
}
export async function connectDatabase(){
  if(verified)return;
  const {error}=await db().from(table).select('id').limit(1);
  if(error)throw new Error(`Supabase is not ready: ${error.message}`);
  verified=true;
}
export async function disconnectDatabase(){}

const collections={
  User:'users',ResidentPreferences:'preferences',CareCircle:'circles',Activity:'activities',
  FollowUpTask:'followups',CommunityEvent:'events',HelpRequest:'help_requests',
  WisdomExchange:'wisdom',Participation:'participations',Notification:'notifications',
  VolunteerVerification:'verifications',
};
const defaults={
  users:{interests:[],skills:[],verificationStatus:'pending',availability:true,accessibility:{largeText:false,highContrast:false},active:true},
  preferences:{consentToCircle:true,allowFamilyUpdates:false,familyUpdateFields:[],followUpContacts:[],graceMinutes:30,interests:[],contactPreference:'either',pauseSuggestions:false},
  circles:{members:[],active:true},
  activities:{type:'other',recurrence:'once',nextInstanceCreated:false,graceMinutes:30,status:'Pending Assignment',relayStatus:'none'},
  followups:{status:'open'},events:{capacity:20,attendees:[]},
  help_requests:{status:'open'},wisdom:{capacity:8,participants:[],requests:[]},
  participations:{status:'pending'},notifications:{kind:'update'},verifications:{status:'pending'},
};
const dateKeys=new Set(['startsAt','createdAt','updatedAt','preferredAt','resolvedAt','consentedAt','reviewedAt','rescheduledFor']);
function revive(value){
  if(Array.isArray(value))return value.map(revive);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,dateKeys.has(k)&&typeof v==='string'?new Date(v):revive(v)]));
  return value;
}
function plain(value){return JSON.parse(JSON.stringify(value));}
function pathGet(obj,path){return path.split('.').reduce((v,k)=>v==null?undefined:v[k],obj)}
function pathSet(obj,path,value){const keys=path.split('.');let at=obj;for(const k of keys.slice(0,-1)){if(!at[k]||typeof at[k]!=='object')at[k]={};at=at[k]}at[keys.at(-1)]=value}
function compare(a,b){if(a instanceof Date)a=a.getTime();if(b instanceof Date)b=b.getTime();if(a==null||b==null)return a===b;return String(a)===String(b)}
function scalarMatch(actual,expected){
  if(Array.isArray(actual))return actual.some(v=>scalarMatch(v,expected));
  if(expected&&typeof expected==='object'&&!Array.isArray(expected)&&!(expected instanceof Date)){
    for(const [op,val] of Object.entries(expected)){
      const values=Array.isArray(actual)?actual:[actual];
      if(op==='$in'&&!values.some(v=>val.some(x=>scalarMatch(v,x))))return false;
      if(op==='$nin'&&values.some(v=>val.some(x=>scalarMatch(v,x))))return false;
      if(op==='$ne'&&values.some(v=>scalarMatch(v,val)))return false;
      if(op==='$gte'&&!values.some(v=>v!=null&&new Date(v).getTime()>=new Date(val).getTime()))return false;
      if(op==='$lte'&&!values.some(v=>v!=null&&new Date(v).getTime()<=new Date(val).getTime()))return false;
      if(op==='$gt'&&!values.some(v=>v!=null&&new Date(v).getTime()>new Date(val).getTime()))return false;
      if(op==='$lt'&&!values.some(v=>v!=null&&new Date(v).getTime()<new Date(val).getTime()))return false;
    }
    return true;
  }
  return compare(actual,expected);
}
function matches(doc,query={}){
  return Object.entries(query||{}).every(([key,value])=>{
    if(key==='$or')return value.some(q=>matches(doc,q));
    if(key==='$and')return value.every(q=>matches(doc,q));
    if(key==='$nor')return value.every(q=>!matches(doc,q));
    return scalarMatch(pathGet(doc,key),value);
  });
}
function addArrayHelpers(doc){
  for(const key of ['participants'])if(Array.isArray(doc[key]))Object.defineProperty(doc[key],'addToSet',{enumerable:false,value(value){if(!this.some(x=>compare(x,value)))this.push(value)}});
  return doc;
}
function makeDoc(collection,value){
  const doc=addArrayHelpers(revive({...value,_id:String(value._id||value.id||randomUUID())}));
  Object.defineProperty(doc,'__collection',{enumerable:false,value:collection});
  Object.defineProperty(doc,'save',{enumerable:false,value:async function(){return persist(collection,this)}});
  return doc;
}
async function rows(collection){
  const {data,error}=await db().from(table).select('id,data,created_at,updated_at').eq('collection',collection).limit(1000);
  if(error)throw error;
  return (data||[]).map(row=>makeDoc(collection,{...(row.data||{}),_id:row.id,createdAt:row.data?.createdAt||row.created_at,updatedAt:row.data?.updatedAt||row.updated_at}));
}
async function persist(collection,doc){
  const now=new Date();doc._id=String(doc._id||randomUUID());doc.createdAt=doc.createdAt||now;doc.updatedAt=now;
  const data=plain(doc);delete data.save;delete data.id;
  const {data:result,error}=await db().from(table).upsert({id:doc._id,collection,data,created_at:doc.createdAt.toISOString(),updated_at:doc.updatedAt.toISOString()},{onConflict:'collection,id'}).select('id,data,created_at,updated_at').single();
  if(error)throw error;
  return makeDoc(collection,{...(result.data||{}),_id:result.id,createdAt:result.data?.createdAt||result.created_at,updatedAt:result.data?.updatedAt||result.updated_at});
}
function applyUpdate(doc,update){
  if(!update||typeof update!=='object')return doc;
  for(const [key,value] of Object.entries(update)){
    if(key==='$set'){for(const [p,v] of Object.entries(value))pathSet(doc,p,v)}
    else if(key==='$unset'){for(const p of Object.keys(value)){const keys=p.split('.');let at=doc;for(const k of keys.slice(0,-1))at=at?.[k];if(at)delete at[keys.at(-1)]}}
    else if(key==='$pull'){for(const [p,condition] of Object.entries(value)){const arr=pathGet(doc,p);if(Array.isArray(arr))pathSet(doc,p,arr.filter(item=>condition&&typeof condition==='object'? !matches(item,condition):!compare(item,condition)))} }
    else if(key==='$addToSet'){for(const [p,values] of Object.entries(value)){const arr=pathGet(doc,p)||[];const toAdd=values?.$each||[values];for(const item of toAdd)if(!arr.some(x=>compare(x,item)))arr.push(item);pathSet(doc,p,arr)}}
    else if(key==='$push'){for(const [p,valueToPush] of Object.entries(value)){const arr=pathGet(doc,p)||[];arr.push(valueToPush);pathSet(doc,p,arr)}}
    else if(!key.startsWith('$'))pathSet(doc,key,value);
  }
  return doc;
}
async function remove(collection,filter){
  const found=(await rows(collection)).filter(x=>matches(x,filter));
  if(!found.length)return {deletedCount:0};
  const ids=found.map(x=>x._id);
  const {error}=await db().from(table).delete().eq('collection',collection).in('id',ids);
  if(error)throw error;
  return {deletedCount:ids.length};
}
function project(doc,selection){
  if(!selection)return doc;
  const fields=selection.trim().split(/\s+/).filter(Boolean);
  if(fields.every(f=>f.startsWith('-'))){const copy=plain(doc);for(const f of fields)delete copy[f.slice(1)];return makeDoc(doc.__collection||'',copy)}
  const out={_id:doc._id};for(const f of fields)if(f!=='_id'&&doc[f]!==undefined)out[f]=doc[f];return out;
}
const modelByCollection={};
class Query{
  constructor(model,filter={},single=false){this.model=model;this.filter=filter;this.single=single;this.order=null;this.max=null;this.selection=null;this.populates=[];this.isLean=false}
  sort(value){this.order=value;return this}
  limit(value){this.max=value;return this}
  select(value){this.selection=value;return this}
  populate(path,select){this.populates.push({path,select});return this}
  lean(){this.isLean=true;return this}
  async execute(){
    let found=(await rows(this.model.collection)).filter(d=>matches(d,this.filter));
    if(this.order)for(const [path,direction] of Object.entries(this.order)){found.sort((a,b)=>{const av=pathGet(a,path),bv=pathGet(b,path);const x=av instanceof Date?av.getTime():av,y=bv instanceof Date?bv.getTime():bv;return (x<y?-1:x>y?1:0)*direction})}
    if(this.max!=null)found=found.slice(0,this.max);
    if(this.single)found=found.slice(0,1);
    found=await Promise.all(found.map(async doc=>{
      for(const {path,select} of this.populates)await populate(doc,path,select);
      const projected=project(doc,this.selection);
      return this.isLean?plain(projected):makeDoc(this.model.collection,projected);
    }));
    return this.single?(found[0]||null):found;
  }
  then(resolve,reject){return this.execute().then(resolve,reject)}
  catch(reject){return this.execute().catch(reject)}
}
async function populate(doc,path,selection){
  const parts=path.split('.');
  if(parts.length===2&&Array.isArray(doc[parts[0]])){
    for(const item of doc[parts[0]])await populate(item,parts[1],selection);
    return;
  }
  const id=doc[path];
  if(!id||typeof id==='object')return;
  const collection=({resident:'users',user:'users',activity:'activities',organiser:'users',assignedTo:'users'})[parts.at(-1)];
  const model=modelByCollection[collection];if(!model)return;
  const related=await new Query(model,{_id:String(id)},true).execute();
  if(!related)return;
  doc[path]=selection?project(related,selection):related;
}
function createModel(name){
  const collection=collections[name];const model={collection,name};modelByCollection[collection]=model;
  model.find=(filter={})=>new Query(model,filter);
  model.findOne=(filter={})=>new Query(model,filter,true);
  model.findById=id=>new Query(model,{_id:String(id)},true);
  model.exists=async filter=>(await new Query(model,filter,true).execute())?{_id:true}:null;
  model.create=async input=>{
    if(Array.isArray(input))return Promise.all(input.map(item=>model.create(item)));
    const value={...(defaults[collection]||{}),...plain(input||{})};
    if(collection==='users')value.accessibility={...(defaults.users.accessibility),...(input?.accessibility||{})};
    return persist(collection,makeDoc(collection,value));
  };
  model.insertMany=async list=>model.create(list);
  model.deleteMany=filter=>remove(collection,filter||{});
  model.countDocuments=async filter=>(await new Query(model,filter||{}).execute()).length;
  model.findByIdAndUpdate=(id,update,options={})=>new Query(model,{_id:String(id)},true).execute().then(async current=>{
    if(!current&&!options.upsert)return null;
    const doc=current||makeDoc(collection,{...(defaults[collection]||{}),_id:String(id)});
    applyUpdate(doc,update);const saved=await doc.save();return options.new===false?current:saved;
  });
  model.findOneAndUpdate=async(filter,update,options={})=>{
    const current=await new Query(model,filter,true).execute();
    if(!current&&!options.upsert)return null;
    const doc=current||makeDoc(collection,{...(defaults[collection]||{}),...filter});applyUpdate(doc,update);
    const saved=await doc.save();return options.new===false?current:saved;
  };
  model.findOneAndDelete=async filter=>{const current=await new Query(model,filter,true).execute();if(current)await remove(collection,{_id:current._id});return current};
  model.findByIdAndDelete=async id=>{const current=await model.findById(id);if(current)await remove(collection,{_id:String(id)});return current};
  return model;
}
export const User=createModel('User');
export const ResidentPreferences=createModel('ResidentPreferences');
export const CareCircle=createModel('CareCircle');
export const Activity=createModel('Activity');
export const FollowUpTask=createModel('FollowUpTask');
export const CommunityEvent=createModel('CommunityEvent');
export const HelpRequest=createModel('HelpRequest');
export const WisdomExchange=createModel('WisdomExchange');
export const Participation=createModel('Participation');
export const Notification=createModel('Notification');
export const VolunteerVerification=createModel('VolunteerVerification');
