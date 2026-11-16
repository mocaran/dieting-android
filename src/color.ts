export type Hsv={h:number;s:number;v:number};

export function hexToHsv(hex:string,neutralHue=348):Hsv{
 const normalized=/^#[0-9a-fA-F]{6}$/.test(hex)?hex:'#ffffff';
 const [r,g,b]=[1,3,5].map(index=>parseInt(normalized.slice(index,index+2),16)/255);
 const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
 let h=neutralHue;
 if(delta>0){
  if(max===r)h=60*(((g-b)/delta)%6);
  else if(max===g)h=60*((b-r)/delta+2);
  else h=60*((r-g)/delta+4);
 }
 return {h:(h+360)%360,s:max===0?0:delta/max*100,v:max*100};
}

export function hsvToHex({h,s,v}:Hsv):string{
 const hue=((h%360)+360)%360,saturation=Math.min(1,Math.max(0,s/100)),brightness=Math.min(1,Math.max(0,v/100));
 const chroma=brightness*saturation,x=chroma*(1-Math.abs((hue/60)%2-1)),m=brightness-chroma;
 const [r,g,b]=hue<60?[chroma,x,0]:hue<120?[x,chroma,0]:hue<180?[0,chroma,x]:hue<240?[0,x,chroma]:hue<300?[x,0,chroma]:[chroma,0,x];
 return '#'+[r,g,b].map(channel=>Math.round((channel+m)*255).toString(16).padStart(2,'0')).join('');
}
