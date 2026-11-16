export const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const parseDate=(s:string)=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
export const addDays=(s:string,n:number)=>{const d=parseDate(s);d.setDate(d.getDate()+n);return localDate(d)};
export const weekStart=(s:string)=>{const d=parseDate(s);return addDays(s,-((d.getDay()+6)%7))};
export const monthStart=(s:string)=>s.slice(0,7)+'-01';
export const monthEnd=(s:string)=>{const d=parseDate(monthStart(s));d.setMonth(d.getMonth()+1);d.setDate(0);return localDate(d)};
export const daysBetween=(a:string,b:string)=>{const out:string[]=[];for(let d=a;d<=b;d=addDays(d,1))out.push(d);return out};
export const ageOn=(birth:string,date:string)=>{const b=parseDate(birth),d=parseDate(date);let a=d.getFullYear()-b.getFullYear();if(d.getMonth()<b.getMonth()||(d.getMonth()===b.getMonth()&&d.getDate()<b.getDate()))a--;return a>=0?a:null};
