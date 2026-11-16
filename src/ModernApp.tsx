import {useEffect,useRef,useState,type PointerEvent,type ReactNode} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {Home,NotebookPen,Wallet,ChartNoAxesCombined,Settings as SettingsIcon,Plus,Trash2,Copy,ChevronLeft,ChevronRight,Download,Upload} from 'lucide-react';
import {db,uid} from './db';
import {DEFAULT_CALC,DEFAULT_FINANCE,DEFAULT_USER,type Meal,type FoodEntry,type Transaction,type DailyHealthRecord,type UserSettings,type CalculationSettings,type FinanceSettings,type WeightEntry} from './types';
import {addDays,daysBetween,localDate,monthStart,weekStart} from './date';
import {availableOn,balance,dailyAvailable,dayCalc,daysToDeadline,priorWeight,sum} from './calc';
import {backup,csv,download,restore,validateBackup,type Backup} from './data';
import {hexToHsv,hsvToHex,type Hsv} from './color';

type Page='home'|'record'|'finance'|'trends'|'settings';
type SettingsPage='main'|'appearance'|'body'|'model'|'finance'|'data';
type AppProps={onExitLocal?:()=>void;accountPanel?:ReactNode};
const meals:Meal[]=['午餐','晚餐','零嘴','早餐'];
const money=(cents:number|null)=>cents===null?'—':`¥ ${(cents/100).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const quantity=(value:number|null|undefined,unit:string,digits=0)=>value===null||value===undefined?'—':`${value.toFixed(digits)} ${unit}`;
const dayName=(date:string)=>`${Number(date.slice(5,7))}月${Number(date.slice(8))}日`;
const amount=(text:string)=>Math.round(Number(text)*100);
const optionalNumber=(text:string)=>text===''?null:Number(text);
const dayDefault=(date:string):DailyHealthRecord=>({date,walkingKm:null,runningKm:null,foodComplete:true});

export default function ModernApp({onExitLocal,accountPanel}:AppProps){
 const [page,setPage]=useState<Page>('home');
 const [settingsPage,setSettingsPage]=useState<SettingsPage>('main');
 const [date,setDate]=useState(localDate());
 const [message,setMessage]=useState('');
 const foods=useLiveQuery(()=>db.foods.toArray(),[])??[];
 const days=useLiveQuery(()=>db.days.toArray(),[])??[];
 const weights=useLiveQuery(()=>db.weights.toArray(),[])??[];
 const transactions=useLiveQuery(()=>db.transactions.toArray(),[])??[];
 const user=useLiveQuery(()=>db.user.get('main'),[])??DEFAULT_USER;
 const model=useLiveQuery(()=>db.calc.get('main'),[])??DEFAULT_CALC;
 const finance=useLiveQuery(()=>db.finance.get('main'),[])??DEFAULT_FINANCE;
 const result=dayCalc(date,foods,days,weights,user,model);
 const available=availableOn(finance,transactions,date);
 const perDay=dailyAvailable(finance,transactions,date);
 const remaining=daysToDeadline(date,finance.deadline);
 const dayExpenses=transactions.filter(t=>t.date===date&&t.kind==='expense');
 const expense=dayExpenses.length?sum(dayExpenses.map(t=>t.cents)):null;
 const notify=(text:string)=>{setMessage(text);window.setTimeout(()=>setMessage(''),2300)};
 const navigate=(next:Page,detail:SettingsPage='main')=>{history.pushState({page:next,detail},'');setPage(next);setSettingsPage(detail);scrollTo(0,0)};
 useEffect(()=>{history.replaceState({page:'home',detail:'main'},'');const listener=(event:PopStateEvent)=>{setPage(event.state?.page??'home');setSettingsPage(event.state?.detail??'main')};addEventListener('popstate',listener);return()=>removeEventListener('popstate',listener)},[]);
 useEffect(()=>{const dark=user.theme==='dark'||user.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=dark?'dark':'light';const colors:Record<string,string|undefined>={'--accent':user.accentColor??'#a94354','--card':user.surfaceColor??(dark?'#242b29':'#ffffff'),'--text':user.textColor??(dark?'#f2f2ed':'#292d2b'),'--health-card':user.healthCardColor,'--finance-card':user.financeCardColor,'--meal-card':user.mealCardColor,'--trend-card':user.trendCardColor};for(const [key,value] of Object.entries(colors)){if(value)document.documentElement.style.setProperty(key,value);else document.documentElement.style.removeProperty(key)}},[user]);
 const updateDay=async(patch:Partial<DailyHealthRecord>)=>db.days.put({...dayDefault(date),...await db.days.get(date),...patch});
 const updateUser=(patch:Partial<UserSettings>)=>db.user.put({...user,...patch});
 const updateFinance=(patch:Partial<FinanceSettings>)=>db.finance.put({...finance,...patch});
 const updateModel=(patch:Partial<CalculationSettings>)=>db.calc.put({...model,...patch,version:model.version+1,updatedAt:new Date().toISOString()});
 return <div className="new-app"><header className="new-top"><b>Dieting</b><span>{dayName(date)}</span><button onClick={()=>navigate('settings')} aria-label="设置"><SettingsIcon size={20}/></button></header><main className="new-main">
  <div className="new-heading"><h1>{({home:'首页',record:'热量',finance:'财务',trends:'趋势',settings:'设置'} as const)[page]}</h1>{(page==='home'||page==='record'||page==='finance')&&<DateNav date={date} setDate={setDate}/>}</div>
  {page==='home'&&<>
   <section className="new-card health-card"><h2>热量账目</h2><div className="new-metrics"><Metric label="摄入" value={quantity(result.intake,'kcal')}/><Metric label="消耗" value={quantity(result.total,'kcal')}/><Metric label={result.deficit!==null&&result.deficit<0?'热量盈余':'热量赤字'} value={quantity(result.deficit===null?null:Math.abs(result.deficit),'kcal')}/><Metric label="理论变化" value={quantity(result.theoretical,'kg',3)}/></div>{result.complete&&result.total===null&&<p className="new-hint">完善身体参数后可计算消耗。</p>}</section>
   <section className="new-card finance-card"><h2>财务账目</h2><div className="new-metrics main-finance"><Metric label="可支配" value={money(available)}/><Metric label="当日支出" value={money(expense)}/></div><div className="daily-average"><span>日均可支配</span><strong>{money(perDay)}</strong>{remaining!==null&&<small>截至 {dayName(finance.deadline!)} · 剩余 {remaining} 天</small>}</div></section>
  </>}
  {page==='record'&&<><div className="meal-layout">{meals.map(meal=><MealCard key={meal} date={date} meal={meal} foods={foods} day={days.find(d=>d.date===date)} onDay={updateDay} notify={notify}/>)}</div><section className="new-card"><h2>运动与体重</h2><div className="new-fields"><label>步行 km<input type="number" min="0" step="0.1" value={days.find(d=>d.date===date)?.walkingKm??''} onChange={e=>updateDay({walkingKm:optionalNumber(e.target.value)})}/></label><label>跑步 km<input type="number" min="0" step="0.1" value={days.find(d=>d.date===date)?.runningKm??''} onChange={e=>updateDay({runningKm:optionalNumber(e.target.value)})}/></label><label>体重 kg<input type="number" min="0" step="0.01" value={weights.find(w=>w.date===date)?.kg??''} onChange={e=>e.target.value?db.weights.put({date,kg:Number(e.target.value)}):db.weights.delete(date)}/></label></div><div className="new-minor"><span>步行消耗 {quantity(result.walking,'kcal',1)}</span><span>跑步消耗 {quantity(result.running,'kcal',1)}</span>{(()=>{const current=weights.find(w=>w.date===date),before=priorWeight(date,weights);return current&&before?<span>{before.date===addDays(date,-1)?'比昨日':'比上次称重'} {quantity(current.kg-before.kg,'kg',2)}</span>:null})()}</div></section></>}
  {page==='finance'&&<FinanceRecords date={date} transactions={transactions} finance={finance} updateFinance={updateFinance} notify={notify}/>}
  {page==='trends'&&<Trends foods={foods} days={days} weights={weights} transactions={transactions} finance={finance} user={user} model={model} onDate={selected=>{setDate(selected);navigate('record')}}/>}
  {page==='settings'&&<SettingsPageView detail={settingsPage} navigate={navigate} user={user} model={model} finance={finance} updateUser={updateUser} updateModel={updateModel} updateFinance={updateFinance} notify={notify} foods={foods} days={days} weights={weights} transactions={transactions} onExitLocal={onExitLocal} accountPanel={accountPanel}/>}
 </main><nav className="new-nav">{([['home',Home,'首页'],['record',NotebookPen,'热量'],['finance',Wallet,'财务'],['trends',ChartNoAxesCombined,'趋势'],['settings',SettingsIcon,'设置']] as const).map(([key,Icon,label])=><button key={key} className={page===key?'active':''} onClick={()=>navigate(key)}><Icon size={21}/><span>{label}</span></button>)}</nav>{message&&<div className="new-toast">{message}</div>}</div>;
}

function DateNav({date,setDate}:{date:string;setDate:(value:string)=>void}){return <div className="new-date"><button aria-label="前一天" onClick={()=>setDate(addDays(date,-1))}><ChevronLeft/></button><input aria-label="日期" type="date" value={date} onChange={e=>setDate(e.target.value)}/><button aria-label="后一天" onClick={()=>setDate(addDays(date,1))}><ChevronRight/></button></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="new-metric"><span>{label}</span><strong>{value}</strong></div>}

function MealCard({date,meal,foods,day,onDay,notify}:{date:string;meal:Meal;foods:FoodEntry[];day:DailyHealthRecord|undefined;onDay:(patch:Partial<DailyHealthRecord>)=>Promise<unknown>;notify:(text:string)=>void}){
 const [noteOpen,setNoteOpen]=useState(false);
 const entries=foods.filter(f=>f.date===date&&f.meal===meal).sort((a,b)=>(a.order??0)-(b.order??0));
 const legacyTotal=sum(entries.map(f=>f.kcal));
 const total=day?.mealKcal&&meal in day.mealKcal?day.mealKcal[meal]:(legacyTotal>0?legacyTotal:null);
 const note=day?.mealNotes?.[meal]??'';
 const copyYesterday=async()=>{const previous=await db.foods.where('date').equals(addDays(date,-1)).filter(f=>f.meal===meal).toArray();const previousDay=await db.days.get(addDays(date,-1));if(!previous.length&&previousDay?.mealKcal?.[meal]===undefined)return notify('昨日没有这餐记录');if(!confirm(`复制昨日${meal}到今日？这会覆盖今日${meal}。`))return;await db.foods.bulkDelete(entries.map(f=>f.id));await db.foods.bulkAdd(previous.map((f,index)=>({...f,id:uid(),date,order:index+1})));await onDay({mealKcal:{...day?.mealKcal,[meal]:previousDay?.mealKcal?.[meal]??null},mealNotes:{...day?.mealNotes,[meal]:previousDay?.mealNotes?.[meal]??''}});notify('已复制')};
 const finalize=(entry:FoodEntry,related:EventTarget|null,current:HTMLElement)=>{if(current.contains(related as Node))return;const inputs=current.querySelectorAll('input');if(inputs[0]?.value.trim()&&!inputs[1]?.value.trim())void db.foods.update(entry.id,{grams:'X'})};
 return <section className="new-card meal-card"><div className="meal-head"><h2>{meal}</h2><label>总热量 kcal<input type="number" min="0" step="1" value={total??''} onChange={e=>onDay({mealKcal:{...day?.mealKcal,[meal]:optionalNumber(e.target.value)}})}/></label></div>
  {entries.map(entry=><div className="meal-entry" key={entry.id} onBlur={e=>finalize(entry,e.relatedTarget,e.currentTarget)}><input aria-label={`${meal}餐品名`} placeholder="餐品名" value={entry.name} onChange={e=>db.foods.update(entry.id,{name:e.target.value})}/><div className="grams-field"><input aria-label="克重" placeholder="克重" value={entry.grams??''} onFocus={()=>{if(entry.grams==='X')void db.foods.update(entry.id,{grams:''})}} onChange={e=>db.foods.update(entry.id,{grams:e.target.value})}/>{entry.grams!=='X'&&<span>g</span>}</div><button aria-label="删除餐品" onClick={()=>db.foods.delete(entry.id)}><Trash2 size={19}/></button></div>)}
  <div className="meal-actions"><button onClick={()=>db.foods.add({id:uid(),date,meal,name:'',kcal:0,grams:'',order:Math.max(0,...entries.map(e=>e.order??0))+1})}><Plus size={18}/> 加餐品</button><button onClick={copyYesterday}><Copy size={18}/> 复制昨日</button><button onClick={()=>setNoteOpen(!noteOpen)}>备注</button></div>{(noteOpen||note)&&<textarea aria-label={`${meal}备注`} placeholder="备注" value={note} onChange={e=>onDay({mealNotes:{...day?.mealNotes,[meal]:e.target.value}})}/>}</section>;
}

function FinanceRecords({date,transactions,finance,updateFinance,notify}:{date:string;transactions:Transaction[];finance:FinanceSettings;updateFinance:(patch:Partial<FinanceSettings>)=>Promise<unknown>;notify:(text:string)=>void}){
 const [kind,setKind]=useState<'expense'|'income'>('expense');
 const [name,setName]=useState('');
 const [value,setValue]=useState('');
 const todays=transactions.filter(t=>t.date===date).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
 const add=async()=>{if(!value||!Number.isFinite(Number(value))||Number(value)<0)return notify('请输入金额');await db.transactions.add({id:uid(),date,kind,name:name.trim()||'全天合计',cents:amount(value),category:'其他',createdAt:new Date().toISOString()});setName('');setValue('');notify('已保存')};
 const dates=Array.from(new Set(transactions.map(t=>t.date))).filter(d=>d!==date).sort().reverse().slice(0,20);
 const dailyTotal=(d:string,k:'expense'|'income')=>{const rows=transactions.filter(t=>t.date===d&&(k==='expense'?t.kind==='expense':t.kind!=='expense'));return rows.length?money(sum(rows.map(t=>t.cents))):'—'};
 return <><section className="new-card finance-card"><h2>{dayName(date)}账目</h2><div className="daily-totals"><span>支出 {dailyTotal(date,'expense')}</span><span>收入 {dailyTotal(date,'income')}</span></div><div className="new-segment"><button className={kind==='expense'?'active':''} onClick={()=>setKind('expense')}>支出</button><button className={kind==='income'?'active':''} onClick={()=>setKind('income')}>收入</button></div><div className="new-fields"><label>金额（元）<input type="number" min="0" step="0.01" placeholder="输入金额" value={value} onChange={e=>setValue(e.target.value)}/></label><label>账目内容<input placeholder="全天合计或单项名称" value={name} onChange={e=>setName(e.target.value)}/></label></div><button className="new-primary" onClick={add}>添加到账目</button><div className="daily-entries">{todays.map(t=><div className="daily-entry" key={t.id}><span>{t.kind==='expense'?'支出':'收入'}</span><input aria-label="账目内容" value={t.name} onChange={e=>db.transactions.update(t.id,{name:e.target.value})}/><input aria-label="金额元" type="number" min="0" step="0.01" value={t.cents/100} onChange={e=>db.transactions.update(t.id,{cents:Math.max(0,amount(e.target.value))})}/><button aria-label="删除账目" onClick={()=>{if(confirm('删除这项账目？'))void db.transactions.delete(t.id)}}><Trash2 size={18}/></button></div>)}</div><label className="day-note">当日备注<textarea placeholder="记录这一天资金用于哪些账目" value={finance.dayNotes?.[date]??''} onChange={e=>updateFinance({dayNotes:{...finance.dayNotes,[date]:e.target.value}})}/></label></section>
 {dates.length>0&&<section className="new-card finance-card"><h2>近期每日账目</h2>{dates.map(d=><div className="past-day" key={d}><b>{dayName(d)}</b><div className="past-day-amounts"><span>支出 {dailyTotal(d,'expense')}</span><span>收入 {dailyTotal(d,'income')}</span></div>{finance.dayNotes?.[d]&&<p>{finance.dayNotes[d]}</p>}</div>)}</section>}</>;
}

type PlotRow={date:string;label:string;[key:string]:string|number|null};
type PlotSeries={key:string;label:string;color:string};
function LinePlot({title,rows,series,zeroBase=false,onDate}:{title:string;rows:PlotRow[];series:PlotSeries[];zeroBase?:boolean;onDate?:(date:string)=>void}){
 const values=rows.flatMap(row=>series.map(s=>row[s.key])).filter((value):value is number=>typeof value==='number'&&Number.isFinite(value));
 if(!values.length)return <section className="new-card trend-card"><h2>{title}</h2><div className="empty-chart">这段时间没有记录</div></section>;
 const rawMin=Math.min(...values),rawMax=Math.max(...values);
 const pad=Math.max((rawMax-rawMin)*.12,rawMax===rawMin?Math.max(Math.abs(rawMax)*.1,1):1);
 const min=zeroBase?Math.min(0,rawMin):rawMin-pad;
 const max=rawMax+pad;
 const left=53,right=620,top=18,bottom=194;
 const x=(index:number)=>left+(right-left)*(rows.length===1?.5:index/(rows.length-1));
 const y=(value:number)=>bottom-(value-min)/(max-min)*(bottom-top);
 const paths=(key:string)=>{const segments:string[]=[];let segment='';rows.forEach((row,index)=>{const value=row[key];if(typeof value==='number'&&Number.isFinite(value))segment+=`${segment?' L':'M'} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`;else if(segment){segments.push(segment);segment=''}});if(segment)segments.push(segment);return segments};
 const ticks=[min,(min+max)/2,max];
 return <section className="new-card trend-card"><h2>{title}</h2><div className="plot-legend">{series.map(s=><span key={s.key}><i style={{background:s.color}}/>{s.label}</span>)}</div><div className="chart-frame"><svg viewBox="0 0 640 230" preserveAspectRatio="none" role="img" aria-label={`${title}折线图`}>
  {ticks.map((value,index)=><g key={index}><line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="var(--line)"/><text x={left-7} y={y(value)+4} textAnchor="end" fill="var(--muted)" fontSize="12">{Math.round(value)}</text></g>)}
  {rows.map((row,index)=>(index===0||index===rows.length-1||rows.length<=7)&&<text key={row.date} x={x(index)} y="218" textAnchor="middle" fill="var(--muted)" fontSize="12">{row.label}</text>)}
  {series.map(s=><g key={s.key}>{paths(s.key).map((path,index)=><path key={index} d={path} fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>)}{rows.map((row,index)=>typeof row[s.key]==='number'&&<circle key={row.date} cx={x(index)} cy={y(row[s.key] as number)} r="4.5" fill={s.color} onClick={()=>onDate?.(row.date)}><title>{row.date} {s.label} {row[s.key]}</title></circle>)}</g>)}
 </svg></div></section>;
}

function Trends({foods,days,weights,transactions,finance,user,model,onDate}:{foods:FoodEntry[];days:DailyHealthRecord[];weights:WeightEntry[];transactions:Transaction[];finance:FinanceSettings;user:UserSettings;model:CalculationSettings;onDate:(date:string)=>void}){
 const [range,setRange]=useState<'周'|'月'>('周');
 const today=localDate(),start=range==='周'?weekStart(today):monthStart(today);
 const chart:PlotRow[]=daysBetween(start,today).map(date=>{const energy=dayCalc(date,foods,days,weights,user,model);const expenses=transactions.filter(t=>t.date===date&&t.kind==='expense');const incomes=transactions.filter(t=>t.date===date&&t.kind!=='expense');const balanceCents=balance(finance,transactions.filter(t=>t.date<=date));return {date,label:dayName(date),intake:energy.intake,burn:energy.total,deficit:energy.deficit,weight:weights.find(w=>w.date===date)?.kg??null,expense:expenses.length?sum(expenses.map(t=>t.cents))/100:null,income:incomes.length?sum(incomes.map(t=>t.cents))/100:null,balance:balanceCents===null?null:balanceCents/100}});
 return <><div className="new-segment"><button className={range==='周'?'active':''} onClick={()=>setRange('周')}>本周</button><button className={range==='月'?'active':''} onClick={()=>setRange('月')}>本月</button></div><LinePlot title="热量摄入与消耗" rows={chart} series={[{key:'intake',label:'摄入 kcal',color:'#bd6571'},{key:'burn',label:'消耗 kcal',color:'#608f87'}]} zeroBase onDate={onDate}/><LinePlot title="热量缺口" rows={chart} series={[{key:'deficit',label:'缺口 kcal',color:'#608f87'}]} onDate={onDate}/><LinePlot title="体重" rows={chart} series={[{key:'weight',label:'体重 kg',color:'#bd6571'}]} onDate={onDate}/><LinePlot title="财务趋势" rows={chart} series={[{key:'expense',label:'支出 元',color:'#bd6571'},{key:'income',label:'收入 元',color:'#608f87'}]} zeroBase/><LinePlot title="余额变化" rows={chart} series={[{key:'balance',label:'余额 元',color:'#608f87'}]}/></>;
}

function ColorEditor({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){
 const [expanded,setExpanded]=useState(false);
 const [hsv,setHsv]=useState(()=>hexToHsv(value));
 const [draft,setDraft]=useState(value);
 const dragging=useRef(false);
 const current=useRef(hsv);
 useEffect(()=>{setDraft(value);setHsv(previous=>{const next=hexToHsv(value,previous.h);current.current=next;return next})},[value]);
 const preview=hsvToHex(hsv);
 const update=(next:Hsv)=>{current.current=next;setHsv(next)};
 const commit=()=>onChange(hsvToHex(current.current));
 const commitHex=()=>{const normalized=draft.startsWith('#')?draft:`#${draft}`;if(/^#[0-9a-fA-F]{6}$/.test(normalized))onChange(normalized.toLowerCase());else setDraft(value)};
 const palettePoint=(event:PointerEvent<HTMLDivElement>)=>{const rect=event.currentTarget.getBoundingClientRect();update({...current.current,s:Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)),v:Math.max(0,Math.min(100,100-(event.clientY-rect.top)/rect.height*100))})};
 const presets=['#a94354','#bd6571','#608f87','#7c76b8','#bc8a4a','#f5f2ee','#ffffff','#292d2b','#242b29'];
 return <div className="color-editor"><button className="color-editor-toggle" type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}><span>{label}</span><span className="color-editor-current"><i style={{background:value}}/><code>{value.toUpperCase()}</code><ChevronRight size={17}/></span></button>{expanded&&<div className="color-picker">
  <div className="color-preview" style={{background:preview}}><span>{label}</span><b>{preview.toUpperCase()}</b></div>
  <div className="color-palette" role="slider" aria-label={`${label}颜色深浅`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hsv.s)} tabIndex={0} style={{backgroundColor:`hsl(${hsv.h} 100% 50%)`}} onPointerDown={event=>{dragging.current=true;event.currentTarget.setPointerCapture(event.pointerId);palettePoint(event)}} onPointerMove={event=>{if(dragging.current)palettePoint(event)}} onPointerUp={event=>{if(dragging.current){palettePoint(event);dragging.current=false;commit()}}} onPointerCancel={()=>{dragging.current=false}} onKeyDown={event=>{const step=event.shiftKey?10:2;if(event.key==='ArrowRight')update({...current.current,s:Math.min(100,current.current.s+step)});else if(event.key==='ArrowLeft')update({...current.current,s:Math.max(0,current.current.s-step)});else if(event.key==='ArrowUp')update({...current.current,v:Math.min(100,current.current.v+step)});else if(event.key==='ArrowDown')update({...current.current,v:Math.max(0,current.current.v-step)});else return;event.preventDefault()}} onKeyUp={commit}><span className="palette-thumb" style={{left:`${hsv.s}%`,top:`${100-hsv.v}%`}}/></div>
  <label className="hue-label">色相<input type="range" min="0" max="359" value={Math.round(hsv.h)} onChange={event=>update({...current.current,h:Number(event.target.value)})} onPointerUp={commit} onKeyUp={commit} onBlur={commit}/></label>
  <div className="color-presets" aria-label="推荐色">{presets.map(color=><button key={color} type="button" aria-label={`使用推荐色 ${color}`} title={color} style={{background:color}} className={value.toLowerCase()===color?'selected':''} onClick={()=>onChange(color)}/>)}</div>
  <label className="hex-label">色值<input type="text" value={draft} onChange={event=>setDraft(event.target.value)} onBlur={commitHex} onKeyDown={event=>{if(event.key==='Enter'){commitHex();event.currentTarget.blur()}}}/></label>
 </div>}</div>;
}

function SettingsPageView({detail,navigate,user,model,finance,updateUser,updateModel,updateFinance,notify,foods,days,weights,transactions,onExitLocal,accountPanel}:{detail:SettingsPage;navigate:(page:Page,detail?:SettingsPage)=>void;user:UserSettings;model:CalculationSettings;finance:FinanceSettings;updateUser:(patch:Partial<UserSettings>)=>Promise<unknown>;updateModel:(patch:Partial<CalculationSettings>)=>Promise<unknown>;updateFinance:(patch:Partial<FinanceSettings>)=>Promise<unknown>;notify:(text:string)=>void;foods:FoodEntry[];days:DailyHealthRecord[];weights:WeightEntry[];transactions:Transaction[];onExitLocal?:()=>void;accountPanel?:ReactNode}){
 const [preview,setPreview]=useState<Backup|null>(null);
 const [exporting,setExporting]=useState(false);
 const dark=user.theme==='dark'||user.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;
 const baseCard=user.surfaceColor??(dark?'#242b29':'#ffffff');
 const colors:[string,string, keyof UserSettings][]=[['主色',user.accentColor??'#a94354','accentColor'],['文字颜色',user.textColor??(dark?'#f2f2ed':'#292d2b'),'textColor'],['栏目底色',baseCard,'surfaceColor'],['热量栏目',user.healthCardColor??baseCard,'healthCardColor'],['财务栏目',user.financeCardColor??baseCard,'financeCardColor'],['饮食栏目',user.mealCardColor??baseCard,'mealCardColor'],['趋势栏目',user.trendCardColor??baseCard,'trendCardColor']];
 const importFile=async(file?:File)=>{if(!file)return;try{const parsed:unknown=JSON.parse(await file.text());if(!validateBackup(parsed))throw Error('备份格式不正确');setPreview(parsed)}catch(error){notify((error as Error).message)}};
 const runExport=async(write:()=>Promise<boolean>)=>{
  setExporting(true);
  try{
   if(await write())notify('已导出');
  }catch{
   notify('导出失败，请重试');
  }finally{
   setExporting(false);
  }
 };
 const exportCsv=()=>runExport(async()=>{
  const files=[
   ['dieting-food.csv',csv([['日期','餐次','餐品','克重','热量'],...foods.map(f=>[f.date,f.meal,f.name,f.grams??'',f.kcal])])],
   ['dieting-daily.csv',csv([['日期','步行 km','跑步 km','摄入 kcal'],...days.map(d=>[d.date,d.walkingKm,d.runningKm,sum(Object.values(d.mealKcal??{}).map(v=>v??0))])])],
   ['dieting-weight.csv',csv([['日期','体重 kg'],...weights.map(w=>[w.date,w.kg])])],
   ['dieting-finance.csv',csv([['日期','类型','账目','金额 元'],...transactions.map(t=>[t.date,t.kind,t.name,t.cents/100])])]
  ];
  for(const [name,content] of files){
   if(!await download(name,content,'text/csv'))return false;
  }
  return true;
 });
 if(detail==='main')return <><section className="new-card"><h2>设置</h2><div className="settings-list">{([['appearance','外观与颜色'],['body','身体参数'],['model','代谢模型'],['finance','财务设置'],['data','备份与数据']] as const).map(([key,label])=><button key={key} onClick={()=>navigate('settings',key)}>{label}<ChevronRight size={20}/></button>)}</div></section>{accountPanel&&<section className="new-card"><h2>账号与同步</h2>{accountPanel}</section>}{onExitLocal&&<section className="new-card"><h2>单机模式</h2><button className="new-primary" onClick={onExitLocal}>退出单机</button></section>}</>;
 return <><button className="settings-back" onClick={()=>history.back()}><ChevronLeft size={18}/> 返回设置</button>
 {detail==='appearance'&&<section className="new-card"><h2>外观与颜色</h2><div className="new-fields"><label>显示模式<select value={user.theme} onChange={e=>updateUser({theme:e.target.value as UserSettings['theme']})}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label></div><div className="color-list">{colors.map(([label,value,key])=><ColorEditor key={key} label={label} value={value} onChange={color=>updateUser({[key]:color})}/>)}</div><button onClick={()=>updateUser({accentColor:undefined,surfaceColor:undefined,textColor:undefined,healthCardColor:undefined,financeCardColor:undefined,mealCardColor:undefined,trendCardColor:undefined})}>恢复默认配色</button></section>}
 {detail==='body'&&<section className="new-card"><h2>身体参数</h2><div className="new-fields"><label>性别<select value={user.sex} onChange={e=>updateUser({sex:e.target.value as UserSettings['sex']})}><option value="">未设置</option><option value="male">男性</option><option value="female">女性</option></select></label><label>出生日期<input type="date" value={user.birthDate} onChange={e=>updateUser({birthDate:e.target.value})}/></label><label>身高 cm<input type="number" value={user.heightCm??''} onChange={e=>updateUser({heightCm:optionalNumber(e.target.value)})}/></label><label>基础体重 kg<input type="number" value={user.baseWeightKg??''} onChange={e=>updateUser({baseWeightKg:optionalNumber(e.target.value)})}/></label><label>手动静息代谢 kcal<input type="number" value={user.manualRmr??''} onChange={e=>updateUser({manualRmr:optionalNumber(e.target.value)})}/></label><label>目标体重 kg<input type="number" value={user.targetKg??''} onChange={e=>updateUser({targetKg:optionalNumber(e.target.value)})}/></label><label>目标日期<input type="date" value={user.targetDate} onChange={e=>updateUser({targetDate:e.target.value})}/></label></div></section>}
 {detail==='model'&&<section className="new-card"><h2>代谢模型 · V{model.version}</h2><div className="new-fields">{([['walking','步行系数'],['running','跑步系数'],['activity','日常活动比例'],['tef','食物热效应比例'],['kgPerKcal','理论体重换算 kcal/kg']] as const).map(([key,label])=><label key={key}>{label}<input type="number" min="0" step="0.01" value={model[key]} onChange={e=>{const value=Number(e.target.value);if(Number.isFinite(value)&&value>=0)updateModel({[key]:value})}}/></label>)}</div><button onClick={()=>{updateModel(DEFAULT_CALC);notify('已恢复默认系数')}}>恢复默认系数</button></section>}
 {detail==='finance'&&<section className="new-card"><h2>财务设置</h2><div className="new-fields"><label>期初余额（元）<input type="number" step="0.01" value={finance.initialCents===null?'':finance.initialCents/100} onChange={e=>updateFinance({initialCents:e.target.value===''?null:amount(e.target.value)})}/></label><label>固定预留（元）<input type="number" min="0" step="0.01" value={finance.reserveCents===0?'':finance.reserveCents/100} onChange={e=>updateFinance({reserveCents:e.target.value===''?0:Math.max(0,amount(e.target.value))})}/></label><label>可支配日期期限<input type="date" value={finance.deadline??''} onChange={e=>updateFinance({deadline:e.target.value})}/></label></div></section>}
 {detail==='data'&&<section className="new-card"><h2>备份与数据</h2><div className="settings-list"><button disabled={exporting} onClick={()=>runExport(async()=>download('dieting-backup.json',JSON.stringify(await backup(),null,2),'application/json'))}><Download size={18}/> 导出完整备份</button><label className="settings-upload"><Upload size={18}/> 选择备份文件<input type="file" accept=".json,application/json" onChange={e=>importFile(e.target.files?.[0])}/></label><button disabled={exporting} onClick={exportCsv}><Download size={18}/> 导出 CSV</button></div>{preview&&<div className="new-preview"><p>备份日期：{preview.exportedAt.slice(0,10)}</p><button onClick={async()=>{await restore(preview,'merge');setPreview(null);notify('已合并备份')}}>合并导入</button><button onClick={async()=>{if(confirm('覆盖现有数据？')){await restore(preview,'replace');setPreview(null);notify('已恢复备份')}}}>覆盖现有数据</button></div>}<button className="danger" onClick={async()=>{if(!confirm('清除本机全部记录和设置？'))return;await db.transaction('rw',[db.foods,db.days,db.weights,db.user,db.calc,db.finance,db.transactions],async()=>{await Promise.all([db.foods.clear(),db.days.clear(),db.weights.clear(),db.user.clear(),db.calc.clear(),db.finance.clear(),db.transactions.clear()])});notify('已清除')}}>清除本机数据</button></section>}
 </>;
}
