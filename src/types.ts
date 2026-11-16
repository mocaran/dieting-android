export type Meal = '早餐'|'午餐'|'晚餐'|'零嘴';
export interface FoodEntry {id:string; date:string; meal:Meal; name:string; kcal:number; grams?:string; order?:number; note?:string}
export interface DailyHealthRecord {date:string; walkingKm:number|null; runningKm:number|null; foodComplete:boolean; mealKcal?:Partial<Record<Meal,number|null>>; mealNotes?:Partial<Record<Meal,string>>}
export interface WeightEntry {date:string; kg:number}
export interface UserSettings {id:'main'; sex:''|'male'|'female'; birthDate:string; heightCm:number|null; baseWeightKg:number|null; manualRmr:number|null; targetKg:number|null; targetDate:string; theme:'light'|'dark'|'system'; weightUnit:'kg'|'jin'; currency:string; accentColor?:string; surfaceColor?:string; textColor?:string; healthCardColor?:string; financeCardColor?:string; mealCardColor?:string; trendCardColor?:string}
export interface CalculationSettings {id:'main'; version:number; walking:number; running:number; activity:number; tef:number; kgPerKcal:number; updatedAt:string}
export interface FinanceSettings {id:'main'; initialCents:number|null; reserveCents:number; deadline?:string; dayNotes?:Record<string,string>}
export interface Transaction {id:string; date:string; kind:'expense'|'income'|'refund'|'adjustment'; name:string; cents:number; category:string; note?:string; createdAt:string}
export const DEFAULT_CALC:CalculationSettings={id:'main',version:1,walking:.5,running:.9,activity:.1,tef:.1,kgPerKcal:7700,updatedAt:''};
export const DEFAULT_USER:UserSettings={id:'main',sex:'',birthDate:'',heightCm:null,baseWeightKg:null,manualRmr:null,targetKg:null,targetDate:'',theme:'system',weightUnit:'kg',currency:'CNY'};
export const DEFAULT_FINANCE:FinanceSettings={id:'main',initialCents:null,reserveCents:0};
