import {useCallback,useEffect,useRef,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {CloudOff,Download,LogIn,RefreshCw,UserRound} from 'lucide-react';
import ModernApp from './ModernApp';
import {backup,download,restore,type Backup} from './data';
import {selectAccountDb} from './db';

const API_BASE=(import.meta.env.VITE_API_BASE_URL??'https://dieting-personal-tracker-2026.thinmerit.chatgpt.site').replace(/\/$/,'');
const SESSION_KEY='dieting.session.v1';
const SYNC_KEY='dieting.sync.v1';

type LocalSession={kind:'local';username:string};
type OnlineSession={kind:'online';id:string;username:string;token:string};
type Session=LocalSession|OnlineSession;
type SyncStatus='loading'|'synced'|'saving'|'offline'|'conflict';
type RemoteData={revision:number;data:Backup|null};
type SyncState={revision:number;lastSyncedFingerprint:string};

class ApiError extends Error{
  constructor(message:string,readonly status:number){super(message)}
}

async function requestJson<T>(path:string,init:RequestInit={},token?:string):Promise<T>{
  const controller=new AbortController();
  const timer=window.setTimeout(()=>controller.abort(),12000);
  const headers=new Headers(init.headers);
  headers.set('Accept','application/json');
  if(init.body)headers.set('Content-Type','application/json');
  if(token)headers.set('Authorization',`Bearer ${token}`);
  try{
    const response=await fetch(`${API_BASE}${path}`,{...init,headers,signal:controller.signal,cache:'no-store'});
    const result=await response.json().catch(()=>({})) as {error?:string};
    if(!response.ok)throw new ApiError(result.error??`账号服务返回 ${response.status}`,response.status);
    return result as T;
  }catch(error){
    if(error instanceof ApiError)throw error;
    throw new Error('无法连接账号服务器，仍可使用单机模式');
  }finally{
    window.clearTimeout(timer);
  }
}

function readSession():Session|null{
  try{
    const value=JSON.parse(localStorage.getItem(SESSION_KEY)??'null') as Partial<Session>|null;
    if(value?.kind==='local')return {kind:'local',username:'本机用户'};
    if(value?.kind==='online'&&typeof value.id==='string'&&typeof value.username==='string'&&typeof value.token==='string')return {kind:'online',id:value.id,username:value.username,token:value.token};
  }catch{}
  return null;
}

function saveSession(session:Session|null){
  if(session)localStorage.setItem(SESSION_KEY,JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

function fingerprint(value:Backup){
  return JSON.stringify([value.foods,value.days,value.weights,value.user,value.calc,value.finance,value.transactions]);
}

function hasRecords(value:Backup){
  return [value.foods,value.days,value.weights,value.user,value.calc,value.finance,value.transactions].some(items=>items.length>0);
}

function readSyncState(accountId:string):SyncState|null{
  try{
    const value=JSON.parse(localStorage.getItem(`${SYNC_KEY}.${accountId}`)??'null') as Partial<SyncState>|null;
    if(Number.isInteger(value?.revision)&&typeof value?.lastSyncedFingerprint==='string')return value as SyncState;
  }catch{}
  return null;
}

function saveSyncState(accountId:string,state:SyncState){
  localStorage.setItem(`${SYNC_KEY}.${accountId}`,JSON.stringify(state));
}

async function loadRemote(session:OnlineSession){
  return requestJson<RemoteData>('/api/data',{},session.token);
}

async function saveRemote(session:OnlineSession,revision:number,data:Backup){
  return requestJson<{revision:number}>('/api/data',{method:'PUT',body:JSON.stringify({revision,data})},session.token);
}

export default function AccountShell(){
  const [session,setSession]=useState<Session|null>(()=>readSession());
  const enterLocal=()=>{
    const next:LocalSession={kind:'local',username:'本机用户'};
    selectAccountDb();
    saveSession(next);
    setSession(next);
  };
  const enterOnline=(next:OnlineSession)=>{
    selectAccountDb(next.id);
    saveSession(next);
    setSession(next);
  };
  const leave=()=>{
    saveSession(null);
    setSession(null);
  };
  if(!session)return <AccountEntry onLocal={enterLocal} onOnline={enterOnline}/>;
  if(session.kind==='local')return <LocalApp onLeave={leave}/>;
  return <OnlineApp key={session.id} session={session} onLeave={leave}/>;
}

function AccountEntry({onLocal,onOnline}:{onLocal:()=>void;onOnline:(session:OnlineSession)=>void}){
  const [mode,setMode]=useState<'login'|'register'>('login');
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();
    setBusy(true);
    setError('');
    try{
      const result=await requestJson<{user:{id:string;username:string};token:string}>('/api/auth',{method:'POST',body:JSON.stringify({action:mode,username,password})});
      onOnline({kind:'online',id:result.user.id,username:result.user.username,token:result.token});
    }catch(caught){
      setError((caught as Error).message);
      setBusy(false);
    }
  };
  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand">Dieting</div>
      <h1>登录或单机使用</h1>
      <button className="offline-entry" onClick={onLocal}>
        <CloudOff size={21}/>
        <span><b>单机使用</b></span>
      </button>
      <div className="auth-tabs">
        <button className={mode==='login'?'selected':''} onClick={()=>{setMode('login');setError('')}}><LogIn size={15}/> 登录</button>
        <button className={mode==='register'?'selected':''} onClick={()=>{setMode('register');setError('')}}><UserRound size={15}/> 注册</button>
      </div>
      <form onSubmit={submit}>
        <label>用户名
          <input required autoComplete="username" minLength={2} maxLength={32} value={username} onChange={event=>setUsername(event.target.value)} placeholder="汉字、字母、数字或下划线"/>
        </label>
        <label>密码
          <input required type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='register'?4:1} maxLength={128} value={password} onChange={event=>setPassword(event.target.value)} placeholder="可使用纯数字，注册至少 4 位"/>
        </label>
        {error&&<p className="auth-error">{error}</p>}
        <button className="primary" disabled={busy}>{busy?'请稍候…':mode==='login'?'登录并同步':'创建账号'}</button>
      </form>
      <p className="auth-foot">首次使用账号请先注册。无需邮箱或手机号；忘记密码后目前无法找回。</p>
    </section>
  </main>;
}

function LocalApp({onLeave}:{onLeave:()=>void}){
  return <ModernApp onExitLocal={onLeave}/>;
}

function OnlineApp({session,onLeave}:{session:OnlineSession;onLeave:()=>void}){
  const [ready,setReady]=useState(false);
  const [status,setStatus]=useState<SyncStatus>('loading');
  const [notice,setNotice]=useState('');
  const [retryTick,setRetryTick]=useState(0);
  const revision=useRef(0);
  const lastSynced=useRef('');
  const connected=useRef(false);
  const conflict=useRef(false);
  const busy=useRef(false);
  const firstConnect=useRef(false);
  const snapshot=useLiveQuery(()=>ready?backup():Promise.resolve(null),[ready]);

  const applyRemote=useCallback(async(remote:RemoteData)=>{
    if(!remote.data)return;
    await restore(remote.data,'replace');
    revision.current=remote.revision;
    lastSynced.current=fingerprint(remote.data);
    conflict.current=false;
    connected.current=true;
    saveSyncState(session.id,{revision:remote.revision,lastSyncedFingerprint:lastSynced.current});
  },[session.id]);

  const upload=useCallback(async(data:Backup,currentRevision:number)=>{
    const result=await saveRemote(session,currentRevision,data);
    revision.current=result.revision;
    lastSynced.current=fingerprint(data);
    conflict.current=false;
    connected.current=true;
    saveSyncState(session.id,{revision:result.revision,lastSyncedFingerprint:lastSynced.current});
  },[session]);

  const connect=useCallback(async()=>{
    setStatus('loading');
    setNotice('');
    try{
      const local=await backup();
      const remote=await loadRemote(session);
      const localFingerprint=fingerprint(local);
      const saved=readSyncState(session.id);
      revision.current=remote.revision;
      if(!remote.data){
        if(hasRecords(local))await upload(local,0);
        else{
          lastSynced.current=localFingerprint;
          connected.current=true;
          conflict.current=false;
          saveSyncState(session.id,{revision:0,lastSyncedFingerprint:localFingerprint});
        }
        setStatus('synced');
        return;
      }
      const remoteFingerprint=fingerprint(remote.data);
      if(localFingerprint===remoteFingerprint)await applyRemote(remote);
      else if(saved?.lastSyncedFingerprint===localFingerprint)await applyRemote(remote);
      else if(saved?.lastSyncedFingerprint===remoteFingerprint)await upload(local,remote.revision);
      else if(!hasRecords(local)&&!saved)await applyRemote(remote);
      else{
        revision.current=remote.revision;
        connected.current=true;
        conflict.current=true;
        setStatus('conflict');
        return;
      }
      setStatus('synced');
    }catch(caught){
      const error=caught as Error;
      connected.current=false;
      setStatus('offline');
      setNotice(error instanceof ApiError&&error.status===401?'登录已过期，记录仍保存在本机':error.message);
    }finally{
      setReady(true);
    }
  },[applyRemote,session,upload]);

  useEffect(()=>{
    if(firstConnect.current)return;
    firstConnect.current=true;
    selectAccountDb(session.id);
    void connect();
  },[connect,session.id]);

  useEffect(()=>{
    if(!ready||!snapshot||!connected.current||conflict.current)return;
    const key=fingerprint(snapshot);
    if(key===lastSynced.current)return;
    const timer=window.setTimeout(async()=>{
      if(busy.current||conflict.current)return;
      busy.current=true;
      setStatus('saving');
      try{
        await upload(snapshot,revision.current);
        setStatus('synced');
        setNotice('');
      }catch(caught){
        connected.current=false;
        setStatus('offline');
        setNotice((caught as Error).message);
      }finally{
        busy.current=false;
      }
    },900);
    return ()=>window.clearTimeout(timer);
  },[ready,snapshot,upload]);

  useEffect(()=>{
    if(!ready)return;
    const timer=window.setInterval(async()=>{
      if(busy.current||conflict.current||!connected.current)return;
      try{
        const remote=await loadRemote(session);
        if(remote.revision<=revision.current)return;
        const local=await backup();
        if(fingerprint(local)!==lastSynced.current){
          conflict.current=true;
          setStatus('conflict');
          return;
        }
        await applyRemote(remote);
        setStatus('synced');
      }catch{}
    },20000);
    return ()=>window.clearInterval(timer);
  },[applyRemote,ready,session]);

  useEffect(()=>{
    if(retryTick>0)void connect();
  },[connect,retryTick]);

  const exportLocal=async()=>download(`dieting-${session.username}-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(await backup(),null,2),'application/json');
  const loadCloud=async()=>{
    try{
      const remote=await loadRemote(session);
      await applyRemote(remote);
      setStatus('synced');
      setNotice('');
    }catch(caught){
      setNotice((caught as Error).message);
    }
  };
  const overwriteCloud=async()=>{
    if(!confirm('用本机记录覆盖云端记录？另一台设备上的较新内容会被替换。'))return;
    try{
      await upload(await backup(),revision.current);
      setStatus('synced');
      setNotice('');
    }catch(caught){
      setStatus('offline');
      setNotice((caught as Error).message);
    }
  };
  const statusText=({loading:'正在连接账号',synced:'已同步',saving:'正在同步',offline:'离线使用中',conflict:'需要处理数据冲突'} as const)[status];
  const accountPanel=<div className="account-settings"><p><b>{session.username}</b> · {statusText}</p>{notice&&<p>{notice}</p>}<button onClick={()=>setRetryTick(value=>value+1)} disabled={status==='loading'||status==='saving'}><RefreshCw size={16}/> 重试同步</button>{status==='conflict'&&<><p>本机和云端都有不同修改，请选择保留的数据。</p><button onClick={exportLocal}><Download size={16}/> 导出本机</button><button onClick={loadCloud}>加载云端</button><button onClick={overwriteCloud}>用本机覆盖云端</button></>}<button onClick={onLeave}>返回登录页</button></div>;
  return ready?<ModernApp accountPanel={accountPanel}/>:<div className="auth-page"><div className="loading-copy">正在读取本机记录…</div></div>;
}
