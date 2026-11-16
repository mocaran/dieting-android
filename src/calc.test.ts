import {describe,it,expect} from 'vitest';
import {DEFAULT_CALC,DEFAULT_FINANCE,DEFAULT_USER,type FoodEntry,type WeightEntry,type Transaction} from './types';
import {rmr,dayCalc,balance,available,availableOn,dailyAvailable,daysToDeadline,effectiveWeight} from './calc';
import {addDays,weekStart,monthStart} from './date';
import {validateBackup} from './data';
const user={...DEFAULT_USER,sex:'male' as const,birthDate:'2000-01-01',heightCm:180};
const date='2026-11-14';
const foods:FoodEntry[]=[{id:'a',date,meal:'早餐',name:'早餐',kcal:700},{id:'b',date,meal:'午餐',name:'午餐',kcal:800}];
const weights:WeightEntry[]=[{date:'2026-11-13',kg:80}];
describe('energy calculations',()=>{
 it('calculates male and female Mifflin–St Jeor RMR',()=>{expect(rmr(date,80,user)).toBe(1800);expect(rmr(date,80,{...user,sex:'female'})).toBe(1634)});
 it('calculates walking, running, TDEE, deficit and theoretical change',()=>{const c=dayCalc(date,foods,[{date,walkingKm:5,runningKm:3,foodComplete:true}],weights,user,DEFAULT_CALC);expect(c.walking).toBe(200);expect(c.running).toBe(216);expect(c.total).toBeCloseTo(1800*1.1+150+200+216);expect(c.deficit).toBeCloseTo(1046);expect(c.theoretical).toBeCloseTo(-1046/7700)});
 it('handles a surplus and incomplete day',()=>{const c=dayCalc(date,[{...foods[0],kcal:4000}],[{date,walkingKm:0,runningKm:0,foodComplete:false}],weights,user,DEFAULT_CALC);expect(c.deficit).toBeLessThan(0);expect(c.complete).toBe(true)});
 it('leaves an untouched date blank',()=>{const c=dayCalc(date,[],[],[],DEFAULT_USER,DEFAULT_CALC);expect(c.kg).toBeNull();expect(c.resting).toBeNull();expect(c.intake).toBeNull();expect(c.total).toBeNull();expect(c.theoretical).toBeNull()});
 it('uses only past weight and updates later calculations when weight changes',()=>{expect(effectiveWeight('2026-11-12',[...weights,{date:'2026-11-15',kg:70}],null)).toBeNull();const d={date,walkingKm:5,runningKm:0,foodComplete:true};expect(dayCalc(date,foods,[d],weights,user,DEFAULT_CALC).walking).toBe(200);expect(dayCalc(date,foods,[d],[{date:'2026-11-13',kg:70}],user,DEFAULT_CALC).walking).toBe(175)});
});
describe('date and finance',()=>{it('handles local calendar boundaries',()=>{expect(addDays('2026-01-01',-1)).toBe('2025-12-31');expect(weekStart('2026-11-14')).toBe('2026-11-09');expect(monthStart(date)).toBe('2026-11-01')});it('keeps money in integer cents and reserve separate',()=>{const tx:Transaction[]=[{id:'1',date,kind:'income',name:'收入',cents:10001,category:'其他',createdAt:''},{id:'2',date,kind:'expense',name:'支出',cents:3002,category:'其他',createdAt:''}];const f={...DEFAULT_FINANCE,initialCents:100000,reserveCents:20000};expect(balance(f,tx)).toBe(106999);expect(available(f,tx)).toBe(86999)});it('uses the selected date and inclusive deadline',()=>{const tx:Transaction[]=[{id:'1',date:'2026-11-15',kind:'expense',name:'支出',cents:10000,category:'其他',createdAt:''}];const f={...DEFAULT_FINANCE,initialCents:100000,reserveCents:10000,deadline:'2026-12-20'};expect(daysToDeadline('2026-11-15',f.deadline)).toBe(36);expect(daysToDeadline('2026-11-14',f.deadline)).toBe(37);expect(availableOn(f,tx,'2026-11-14')).toBe(90000);expect(availableOn(f,tx,'2026-11-15')).toBe(80000);expect(dailyAvailable(f,tx,'2026-11-15')).toBe(Math.round(80000/36));expect(daysToDeadline('2026-12-21',f.deadline)).toBeNull()});it('validates backup schema',()=>{expect(validateBackup({schemaVersion:1,foods:[],days:[],weights:[],user:[],calc:[],finance:[],transactions:[]})).toBe(true);expect(validateBackup({schemaVersion:2,foods:[]})).toBe(false)})});

