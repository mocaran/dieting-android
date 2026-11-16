import {Capacitor,registerPlugin} from '@capacitor/core';
import {db} from './db';
import type {FoodEntry,DailyHealthRecord,WeightEntry,UserSettings,CalculationSettings,FinanceSettings,Transaction} from './types';
export interface Backup {schemaVersion:1;exportedAt:string;foods:FoodEntry[];days:DailyHealthRecord[];weights:WeightEntry[];user:UserSettings[];calc:CalculationSettings[];finance:FinanceSettings[];transactions:Transaction[]}
export async function backup():Promise<Backup>{const [foods,days,weights,user,calc,finance,transactions]=await Promise.all([db.foods.toArray(),db.days.toArray(),db.weights.toArray(),db.user.toArray(),db.calc.toArray(),db.finance.toArray(),db.transactions.toArray()]);return {schemaVersion:1,exportedAt:new Date().toISOString(),foods,days,weights,user,calc,finance,transactions}}
export function validateBackup(x:unknown):x is Backup{if(!x||typeof x!=='object')return false;const b=x as Record<string,unknown>;if(b.schemaVersion!==1)return false;for(const key of ['foods','days','weights','user','calc','finance','transactions'])if(!Array.isArray(b[key]))return false;const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);const day=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);return (b.foods as unknown[]).every(v=>obj(v)&&typeof v.id==='string'&&day(v.date)&&['早餐','午餐','晚餐','零嘴'].includes(String(v.meal))&&typeof v.name==='string'&&finite(v.kcal)&&v.kcal>=0)&&(b.days as unknown[]).every(v=>obj(v)&&day(v.date)&&(v.walkingKm===null||finite(v.walkingKm)&&v.walkingKm>=0)&&(v.runningKm===null||finite(v.runningKm)&&v.runningKm>=0)&&typeof v.foodComplete==='boolean')&&(b.weights as unknown[]).every(v=>obj(v)&&day(v.date)&&finite(v.kg)&&v.kg>0)&&(b.user as unknown[]).every(v=>obj(v)&&v.id==='main')&&(b.calc as unknown[]).every(v=>obj(v)&&v.id==='main'&&finite(v.walking)&&finite(v.running)&&finite(v.activity)&&finite(v.tef)&&finite(v.kgPerKcal)&&v.kgPerKcal>0)&&(b.finance as unknown[]).every(v=>obj(v)&&v.id==='main'&&(v.initialCents===null||Number.isInteger(v.initialCents))&&Number.isInteger(v.reserveCents))&&(b.transactions as unknown[]).every(v=>obj(v)&&typeof v.id==='string'&&day(v.date)&&['expense','income','refund','adjustment'].includes(String(v.kind))&&typeof v.name==='string'&&finite(v.cents)&&Number.isInteger(v.cents)&&v.cents>=0&&typeof v.category==='string')}
export async function restore(b:Backup,mode:'merge'|'replace'){if(!validateBackup(b))throw Error('备份文件格式不正确');await db.transaction('rw',[db.foods,db.days,db.weights,db.user,db.calc,db.finance,db.transactions],async()=>{if(mode==='replace')await Promise.all([db.foods.clear(),db.days.clear(),db.weights.clear(),db.user.clear(),db.calc.clear(),db.finance.clear(),db.transactions.clear()]);await Promise.all([db.foods.bulkPut(b.foods),db.days.bulkPut(b.days),db.weights.bulkPut(b.weights),db.user.bulkPut(b.user),db.calc.bulkPut(b.calc),db.finance.bulkPut(b.finance),db.transactions.bulkPut(b.transactions)])})}
const fileExport=registerPlugin<{
  save(options:{name:string;content:string;type:string}):Promise<{saved:boolean}>;
}>('FileExport');

export async function download(name:string,content:string,type='text/plain'){
  if(Capacitor.isPluginAvailable('FileExport')){
    const {saved}=await fileExport.save({name,content,type});
    return saved;
  }
  const link=document.createElement('a');
  link.href=URL.createObjectURL(new Blob([content],{type}));
  link.download=name;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  return true;
}
export function csv(rows:(string|number|null|undefined)[][]){return '\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n')}


