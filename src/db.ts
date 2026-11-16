import Dexie,{type EntityTable} from 'dexie';
import type {FoodEntry,DailyHealthRecord,WeightEntry,UserSettings,CalculationSettings,FinanceSettings,Transaction} from './types';
type DietingDb=Dexie & {foods:EntityTable<FoodEntry,'id'>;days:EntityTable<DailyHealthRecord,'date'>;weights:EntityTable<WeightEntry,'date'>;user:EntityTable<UserSettings,'id'>;calc:EntityTable<CalculationSettings,'id'>;finance:EntityTable<FinanceSettings,'id'>;transactions:EntityTable<Transaction,'id'>};
function createDb(name:string){const next=new Dexie(name) as DietingDb;next.version(1).stores({foods:'id,date,meal',days:'date',weights:'date',user:'id',calc:'id',finance:'id',transactions:'id,date,kind,category'});return next}
let activeDbName='dieting';
export let db=createDb('dieting');
export function selectAccountDb(accountId?:string){const name=accountId?`dieting-account-${accountId}`:'dieting';if(name===activeDbName&&db.isOpen())return;db.close();db=createDb(name);activeDbName=name}
export const uid=()=>crypto.randomUUID();
