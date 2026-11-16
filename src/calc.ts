import {ageOn,addDays,parseDate} from './date';
import type {CalculationSettings,DailyHealthRecord,FoodEntry,UserSettings,WeightEntry,FinanceSettings,Transaction} from './types';
export const sum=(xs:number[])=>xs.reduce((a,b)=>a+b,0);
export const effectiveWeight=(date:string,weights:WeightEntry[],base:number|null)=>weights.filter(w=>w.date<=date).sort((a,b)=>b.date.localeCompare(a.date))[0]?.kg??base;
export const rmr=(date:string,kg:number|null,user:UserSettings)=>{if(user.manualRmr!==null)return user.manualRmr;if(kg===null||user.heightCm===null||!user.sex||!user.birthDate)return null;const age=ageOn(user.birthDate,date);return age===null?null:10*kg+6.25*user.heightCm-5*age+(user.sex==='male'?5:-161)};
export function dayCalc(date:string,foods:FoodEntry[],days:DailyHealthRecord[],weights:WeightEntry[],user:UserSettings,model:CalculationSettings){
 const day=days.find(x=>x.date===date);const items=foods.filter(x=>x.date===date);const intake=sum((['午餐','晚餐','零嘴','早餐'] as const).map(meal=>day?.mealKcal?.[meal]??sum(items.filter(x=>x.meal===meal).map(x=>x.kcal))));const hasFood=!!day||items.length>0;const kg=effectiveWeight(date,weights,user.baseWeightKg);const resting=rmr(date,kg,user);const walking=kg===null||day?.walkingKm===null||day?.walkingKm===undefined?null:kg*day.walkingKm*model.walking;const running=kg===null||day?.runningKm===null||day?.runningKm===undefined?null:kg*day.runningKm*model.running;
 const total=resting===null||kg===null||!hasFood?null:resting*(1+model.activity)+intake*model.tef+(walking??0)+(running??0);
 const deficit=total===null?null:total-intake;
 return {date,intake:hasFood?intake:null,complete:hasFood,kg,resting,walking,running,activity:resting===null?null:resting*model.activity,tef:hasFood?intake*model.tef:null,total,deficit,theoretical:deficit===null?null:-deficit/model.kgPerKcal,walkingKm:day?.walkingKm??null,runningKm:day?.runningKm??null};
}
export const cents=(value:string)=>{const n=Number(value);return Number.isFinite(n)?Math.round(n*100):null};
export const balance=(settings:FinanceSettings,tx:Transaction[])=>settings.initialCents===null?null:settings.initialCents+sum(tx.map(t=>t.kind==='expense'?-t.cents:t.cents));
export const available=(settings:FinanceSettings,tx:Transaction[])=>{const b=balance(settings,tx);return b===null?null:b-settings.reserveCents};
export const availableOn=(settings:FinanceSettings,tx:Transaction[],date:string)=>available(settings,tx.filter(t=>t.date<=date));
export const daysToDeadline=(date:string,deadline?:string)=>{if(!deadline)return null;const days=Math.round((parseDate(deadline).getTime()-parseDate(date).getTime())/86400000)+1;return days>0?days:null};
export const dailyAvailable=(settings:FinanceSettings,tx:Transaction[],date:string)=>{const days=daysToDeadline(date,settings.deadline);const cents=availableOn(settings,tx,date);return days===null||cents===null?null:Math.round(cents/days)};
export const priorWeight=(date:string,weights:WeightEntry[])=>weights.filter(w=>w.date<date).sort((a,b)=>b.date.localeCompare(a.date))[0]??null;
export const previousDate=(date:string)=>addDays(date,-1);
