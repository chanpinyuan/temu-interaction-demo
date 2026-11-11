/* Contextual exit retention. A single absolute deadline survives navigation/reloads. */
const RETENTION_SCREENS={venue0:'f14CuZ',venue1:'C89bQM',venue2:'SKx3u',payment1:'l5bGb',payment2:'hiBVK'};
const RETENTION_CLOCK_KEY='temu.retention.deadline.v2';
let retentionTick=null,retentionDeadline=null;
try{const saved=Number(sessionStorage.getItem(RETENTION_CLOCK_KEY));if(Number.isFinite(saved)&&saved>0)retentionDeadline=saved;}catch{}
function retentionCount(){return Math.min(2,eligibleCount());}
function retentionKey(){return (state.page==='checkout'?'payment':'venue')+retentionCount();}
function retentionExpired(){return retentionDeadline!==null&&Date.now()>=retentionDeadline;}
function stopRetentionClock(){cancelAnimationFrame(retentionTick);retentionTick=null;}
function resetRetentionClock(){stopRetentionClock();retentionDeadline=null;try{sessionStorage.removeItem(RETENTION_CLOCK_KEY);}catch{}}
function startRetentionClock(){
 stopRetentionClock();if(state.overlay!=='retention')return;
 if(retentionDeadline===null){retentionDeadline=Date.now()+60*60*1000;try{sessionStorage.setItem(RETENTION_CLOCK_KEY,String(retentionDeadline));}catch{}}
 const update=()=>{
  if(state.overlay!=='retention')return;
  const ticks=Math.max(0,Math.ceil((retentionDeadline-Date.now())/10));
  const values={minutes:Math.floor(ticks/6000),seconds:Math.floor(ticks/100)%60,centiseconds:ticks%100};
  for(const [part,value] of Object.entries(values)){
   const el=app.querySelector(`[data-clock-part="${part}"]`),text=String(value).padStart(2,'0');
   // Keep the exact same elements/text nodes mounted. No render, animation, or font swap.
   if(el?.firstChild&&el.firstChild.nodeValue!==text)el.firstChild.nodeValue=text;
  }
  if(!ticks){dismissRetention();toast('This reminder has ended · You can keep shopping');return;}
  if(!document.hidden)retentionTick=requestAnimationFrame(update);
 };
 update();
}
function openRetention(){
 if(!['venue','checkout'].includes(state.page)||state.paying||retentionExpired())return false;
 rememberScroll();clearAsync();state.overlay='retention';render();
 app.querySelector('[data-action="retention-primary"]')?.focus({preventScroll:true});return true;
}
function dismissRetention(){stopRetentionClock();state.overlay=null;state.draft=null;render();}
function leaveRetention(){
 if(state.overlay!=='retention')return;
 const target=state.page==='checkout'?'venue':state.entryReturn||'home';
 stopRetentionClock();state.overlay=null;state.draft=null;
 state.history=state.history.filter(p=>p!==state.page);commitPage(target,{remember:false});
}
function focusCheckout(){app.querySelector('[data-action="pay"]')?.focus({preventScroll:true});hint();}
function retentionPrimary(){
 if(state.overlay!=='retention')return;
 const page=state.page,count=retentionCount();dismissRetention();
 if(page==='checkout'){if(count<2)openPicker();else focusCheckout();}
 else if(count>=2)go('checkout');
 else{const sc=app.querySelector('.activity-scroll');state.scroll=0;sc?.scrollTo({top:0,behavior:reduced()?'instant':'smooth'});app.querySelector('.add-button:not(.added)')?.focus({preventScroll:true});hint();}
}
function retentionSecondary(){
 if(state.overlay!=='retention')return;
 const page=state.page,count=retentionCount();
 if(count===1&&state.selected.size){dismissRetention();if(page==='venue')go('checkout');else focusCheckout();}
 else leaveRetention();
}
function retentionGuide(){
 const key=retentionKey(),qualified=retentionCount()>=2;
 const title=qualified?'已达标，继续完成付款':state.purchased!=null?'已购进度保留，继续挑选':'保留已选，继续补齐商品';
 let copy={venue0:'点击 Choose my 2 items 回到商品区。关闭只收起弹窗；Leave activity 才返回首页。',venue1:'点击 Add one more item 定位商品区；Checkout with 1 item 仍可直接购买。',venue2:'点击 Checkout 前往支付；退出保留已选商品。',payment1:'点击 Add one more item 原地打开选品半弹窗；Continue with 1 item 确认并完成单件模拟支付。',payment2:'Continue payment 收起弹窗、继续支付；Leave checkout 返回会场并保留已选商品。'}[key];
 if(state.page==='venue'&&state.purchased!=null&&!state.selected.size)copy='第一件已购买，本次购物袋为空。Add one more item 回到商品区；Leave activity 回首页，历史订单不变。';
 return [title,copy,qualified?'继续结账 / 支付':'继续补选商品','按当前进度承接','进入支付页不弹窗。单件点击支付页Checkout时补选提醒，返回不挽留；凑满两件退出支付页时挽留，Leave checkout直接返回会场。关闭提醒保留原支付页，Continue with 1 item确认单件付款。一小时提醒共用截止时间，不因切换、关闭或刷新重置；到期停止限时挽留，购买入口保持可用。','场景化 CTA,选择保留,等宽倒计时'];
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRetentionClock();else if(state.overlay==='retention')startRetentionClock();});
window.addEventListener('pagehide',stopRetentionClock);
