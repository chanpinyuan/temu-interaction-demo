/* A guided presentation around the existing product flow; no simulated payment shortcuts. */
const story={index:0,mode:'guided',busy:false,offScript:false,comparisonPrompt:false,snapshots:new Map(),seen:new Set(),journey:{comparison:'pending',pickerReviewed:false,singleReturned:false,exitLeft:false,exitContinued:false}};
const chapters=[
 ['先看见权益','首页轻入口 → 低参与用户邀请','让用户愿意多看一眼','首页保持轻量。转盘只面向低参与用户，并且可以跳过。'],
 ['再感知进度','加选第一件 → A/B 对照','把“还差一步”说清楚','先用商品位呈现选择，再用同一组商品体验进度条方案。'],
 ['接住不同选择','购物车 → 支付补选 → 单件购买','补选有入口，购买不被阻断','在用户当前场景承接：回会场、原地选品，或直接买一件。'],
 ['最后真正获得','补选达标 → 继续支付 → 奖励到账','补齐两件，完成支付再获券','在支付页补选第二件，保留当前订单；体验退出挽留后，继续支付并获得优惠券。']
];
const plainVenue=()=>state.page==='venue'&&!state.overlay;
const plainPay=()=>state.page==='checkout'&&!state.overlay;
const firstSelected=()=>[...state.selected][0]??0;
const nextProduct=()=>products.find(p=>!state.selected.has(p.id)&&p.id!==state.purchased)?.id;
const step=(chapter,phase,title,copy,cta,target,valid,action,note='')=>({chapter,phase,title,copy,cta,target,valid,action,note});
const storySteps=[
 step(0,'首页入口','在手机中开始体验','可点击首页 banner 进入会场；低参与用户停留片刻后会收到转盘邀请。','点击首页 banner','.home-hotspot',()=>state.page==='home',()=>go('venue')),
 step(0,'低参与用户','用一次互动，揭晓权益','面向活动低参与度用户，用可跳过的转盘吸引参与。点击 SPIN 揭晓权益。','转动转盘','[data-action="spin"].primary',()=>state.page==='spin',()=>spin()),
 step(0,'权益揭晓','先理解收益，再开始挑选','这是用于后续订单的券包。先看清购买条件，再进入活动会场。','进入活动会场','[data-action="venue"].primary',()=>state.page==='offer',()=>go('venue')),
 step(1,'方案 A · 商品位','先加选第一件','点击任意商品的 Add to pair，观察商品飞入、进度位和底部按钮的联动。','添加第一件商品',()=>`.add-button[data-action="add"][data-id="${nextProduct()}"]`,()=>plainVenue()&&!state.selected.size,()=>add(nextProduct())),
 step(1,'方案 A · 继续加选','一件已选，再挑一件','点击另一件商品的 Add to pair。单件 Checkout 仍可直接购买。','点击添加第二件',()=>`.add-button[data-action="add"][data-id="${nextProduct()}"]`,()=>plainVenue()&&eligibleCount()===1,()=>add(nextProduct())),
 step(1,'方案 A · 已选满','两件已选，可以对照 B 版','先看满件后的商品位与结账按钮，再对照圆形进度条。','查看 B 版进度条',null,()=>plainVenue()&&eligibleCount()>=2,()=>resolveComparison('viewed'), '切换只改变进度呈现，商品和金额保持一致。'),
 step(1,'对照小结','取消一件，继续体验单件路径','点击第二件商品的移除按钮，观察进度和结账按钮回退，再进入购物车。','移除第二件商品',()=>`.add-button[data-id="${[...state.selected].at(-1)}"]`,()=>plainVenue()&&eligibleCount()>=2,()=>remove([...state.selected].at(-1))),
 step(2,'场景一 · 购物车','在购物车，给一个补选入口','点击横幅中的 Add item，回到会场商品区。原来选中的商品会保留。','回到会场补选','.bag-sheet .add-item-link',()=>state.overlay==='bag'&&eligibleCount()===1,()=>locateProducts()),
 step(2,'场景一 · 返回选品','也可以直接购买一件','点击手机底部 Checkout，先正常进入支付页，确认订单与支付方式。','点击 Checkout','.checkout-cta',()=>plainVenue(),()=>go('checkout')),
 step(2,'场景二 · 单件返回','只选一件，返回也不会被拦住','当前订单只有一件。点击左上角返回，回到会场后仍保留这一件和原金额，不弹挽留。','单件返回会场','.payment-back',()=>plainPay()&&eligibleCount()===1,()=>back()),
 step(2,'场景二 · 单件结账提醒','继续补选，留在支付页','Add one more item 原地补选；Continue with 1 item 完成单件支付。关闭后仍可从底部 banner 补选。','打开原地选品','[data-action="retention-primary"]',()=>state.overlay==='retention'&&retentionCount()===1,()=>retentionPrimary()),
 step(2,'场景二 · 半弹窗','补选，不必重走一遍','地址和支付方式留在底层。点击一件商品的 Add，选择先暂存，也可以取消。','暂选一件商品',()=>`[data-action="picker-add"][data-id="${products.find(p=>!state.selected.has(p.id))?.id}"]`,()=>state.overlay==='picker',()=>toggleDraft(products.find(p=>!state.selected.has(p.id)).id)),
 step(2,'场景二 · 确认补选','确认后，才更新订单','现在还只是临时选择。确认加入后，订单金额和奖励条件才同步更新。','确认加购并返回','[data-action="confirm-picker"]',()=>state.overlay==='picker'&&state.draft.size>state.selected.size,()=>confirmPicker()),
 step(2,'场景二 · 两件结账退出','两件已达标，试着返回','点击支付页左上角返回，看看已满足奖励条件时的挽留。','点击返回','.payment-back',()=>plainPay()&&eligibleCount()>=2,()=>back()),
 step(2,'场景二 · 允许退出','提醒权益，也允许离开','这次点击 Leave checkout。返回会场后，已选商品和金额都会保留。','退出结账','[data-action="retention-secondary"]',()=>state.overlay==='retention'&&retentionCount()>=2,()=>retentionSecondary()),
 step(2,'场景三 · 双件返回','两件已保留，金额没有变化','刚才已确认补选第二件。退出结账保留这两件商品，点击 Checkout 回到支付页。','回到双件支付页','.checkout-cta',()=>plainVenue()&&eligibleCount()>=2,()=>go('checkout')),
 step(2,'场景三 · 单件付款','次级按钮，仍然能完成购买','直接点击手机里的 Checkout。这里只支付当前商品，不提前发放券包。','完成单件模拟支付','[data-action="pay"]',()=>plainPay()&&eligibleCount()===1,()=>pay()),
 step(2,'单件订单已完成','本次单件购买已结束','你选择了直接购买一件。点击 Continue browsing 返回首页。','返回首页','[data-name="不再继续"]',()=>state.page==='success'&&!state.receipt?.earned,()=>{state.history=[];commitPage('home',{remember:false});}),
 step(3,'选择商品','挑选活动商品','选择商品，再按当前进度继续结账。','添加第一件商品',()=>`.add-button[data-action="add"][data-id="${nextProduct()}"]`,()=>plainVenue()&&!state.selected.size,()=>add(nextProduct())),
 step(3,'两件已选','商品已选好，准备结账','当前金额包含这次选中的两件商品。点击 Checkout 进入支付。','前往本次结账','.checkout-cta',()=>plainVenue()&&eligibleCount()>=2,()=>go('checkout')),
 step(3,'支付 · 获得前的最后一步','支付成功后，才真正发券','确认本次金额并支付。随后观察礼花、优惠券进入账户，以及完成后的返回。','完成模拟支付','[data-action="pay"]',()=>plainPay()&&eligibleCount()>=2,()=>pay()),
 step(3,'奖励到账','用反馈确认，奖励已经获得','礼花强化获得感，券面仍清楚展示使用门槛。点击 Done，结束这次体验并回到首页。','完成并回到首页','[data-action="finish"]',()=>state.page==='success'&&state.receipt?.earned,()=>finishFlow()),
 step(3,'讲解完成','这条设计路径，已经走完','补选、两件退出、继续支付和奖励到账已体验。可自由探索或回看任一章节。','进入自由探索',null,()=>state.page==='home',()=>storyExplore()),
 step(2,'场景一 · 购物车入口','带着这一件，打开购物车','点击会场右上角购物袋，查看单件状态下的补选入口。','打开购物车','.nav-bag',()=>plainVenue()&&eligibleCount()===1,()=>openBag()),
 step(3,'双件订单 · 达标退出','两件已选，试着返回','当前订单已满足两件条件。点击返回，体验挽留中的继续支付。','点击返回','.payment-back',()=>plainPay()&&eligibleCount()>=2,()=>back()),
 step(3,'双件订单 · 继续支付','这次留下，完成最后一步','点击 Continue payment 关闭提醒，回到当前支付页；下一步再确认支付。','继续支付','[data-action="retention-primary"]',()=>state.overlay==='retention'&&retentionCount()>=2,()=>retentionPrimary()),
 step(2,'场景二 · 单件已返回','仍是刚才那一件','返回没有增加商品，进度和金额保持单件状态。点击 Checkout，再体验支付页内的补选入口。','进入单件支付页','.checkout-cta',()=>plainVenue()&&eligibleCount()===1,()=>go('checkout')),
 step(2,'场景二 · 单件支付提醒','现在体验补选提醒','当前仍为一件。点击支付页 Checkout，再选择 Add one more item；只有确认补选后才会变成两件。','点击 Checkout','[data-action="pay"]',()=>plainPay()&&eligibleCount()===1,()=>pay()),
];
function storySnapshot(){return {...state,selected:new Set(state.selected),draft:state.draft?new Set(state.draft):null,history:[...state.history],quantities:{...state.quantities},guideJourney:{...story.journey}};}
function storyRemember(){story.snapshots.set(story.index,storySnapshot());story.seen.add(story.index);}
function storyScenario(patch){clearAsync();Object.assign(state,{overlay:null,draft:null,spinning:false,paying:false,scroll:0,history:[],quantities:{},entryReturn:'home',offerSeen:true},patch);render();}
function storyEnter(index,action){story.busy=true;story.index=index;try{action?.();storyRemember();}finally{story.busy=false;}storyObserve();storyRender();scheduleCoach(true);}
function storyRestore(index=story.index){const snap=story.snapshots.get(index);if(!snap)return;const{guideJourney,...saved}=snap;story.busy=true;story.comparisonPrompt=false;clearAsync();story.index=index;story.journey={...guideJourney};Object.assign(state,{...saved,selected:new Set(snap.selected),draft:snap.draft?new Set(snap.draft):null,history:[...snap.history],quantities:{...snap.quantities},spinning:false,paying:false});render();story.busy=false;storyObserve();storyRender();scheduleCoach(true);}
function storyAdvance(){if(story.mode!=='guided'||state.spinning||state.paying)return;if(story.offScript){story.index=stageForCurrentScreen();storyRemember();updateGuides();scheduleCoach(true);return;}contextualStoryStep().action();}
function storyObserve(){
 if(story.busy||story.mode!=='guided')return;
 if(state.page!=='venue'||eligibleCount()<2)story.comparisonPrompt=false;
 const next=stageForCurrentScreen();
 if(next!==story.index){story.index=next;storyRemember();}
}
function contextualStoryStep(){
 const s={...storySteps[story.index]};
 if(story.comparisonPrompt)return {...s,chapter:1,phase:'讲解节点 · 方案对照',title:'先对照方案，或跳过继续',copy:'B 版用圆形进度条呈现同一组商品。查看或跳过后，都将继续体验单件补选与双件结账。',cta:'查看 B 版进度条',target:null,valid:()=>true,action:()=>resolveComparison('viewed'),note:'仅切换演示方案，已选商品和金额保持不变。'};
 if($('.rules-modal'))return {...s,phase:'活动规则',title:'看清条件，再继续',copy:'优惠券用于后续订单。点击 Got it 关闭规则，回到刚才的页面。',cta:'点击 Got it',target:'.rules-modal .primary',valid:()=>true,note:''};
 if(state.overlay==='bag'){
  const n=state.selected.size,qualified=eligibleCount()>=2;
  return {...s,chapter:2,phase:'购物车',title:n?(qualified?'商品已选好，继续结账':'在购物车，补选或直接结账'):'购物车还没有商品',copy:n?(qualified?'Checkout 进入支付页。关闭购物车回到原页面，已选商品会保留。':'Add item 返回会场选品；也可以直接 Checkout。'):'点击 Explore eligible items 前往会场选品，或关闭购物车。',cta:n?(qualified?'点击 Checkout':'点击 Add item'):'点击挑选商品',target:!n?'[data-action="locate-products"]':qualified?'.bag-sheet .checkout-cta':'.bag-sheet .add-item-link',valid:()=>true,note:''};
 }
 if(state.overlay==='retention'&&state.page==='venue'){
  const g=retentionGuide();return {...s,phase:'会场退出提醒',title:g[0],copy:g[1],cta:g[2],target:'[data-action="retention-primary"]',valid:()=>true,note:''};
 }
 if([3,4].includes(story.index)&&state.page==='venue'&&!state.overlay&&state.variant==='progress'&&state.purchased==null){
  if(eligibleCount()<2){s.phase='方案 B · 继续挑选';s.title=state.selected.size?'还差一件，进度同步回退':'挑选两件，点亮进度';s.copy='可继续添加，也可取消已选商品。进度、金额和结账层级同步变化。';}
 }
 return s;
}
function storyRender(){
 if(story.busy)return;
 const s=contextualStoryStep(),done=story.index===22;
 const exploreComparison=story.mode==='explore'&&plainVenue()&&eligibleCount()>=2&&!$('.rules-modal');
 document.body.classList.toggle('exploring',story.mode==='explore');
 document.querySelectorAll('[data-experience-mode]').forEach(tab=>{const active=tab.dataset.experienceMode===story.mode;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
 $('#experience-panel').setAttribute('aria-labelledby','mode-'+story.mode);
 $('#reset').textContent=story.mode==='guided'?'↻ 从头讲解':'↻ 重置体验';
 $('#guide-next').classList.toggle('compare-ready',exploreComparison||(story.mode==='guided'&&story.index===5&&plainVenue()&&eligibleCount()>=2&&story.journey.comparison==='pending'&&!$('.rules-modal')));
 $('#comparison-skip').hidden=story.mode!=='guided'||!story.comparisonPrompt;
 $('.narrative-guidance').classList.toggle('comparison-prompt',story.mode==='guided'&&story.comparisonPrompt);
 $('#explore-controls').hidden=story.mode!=='explore';
 $('#explore-controls .experiment').hidden=exploreComparison;
 $('#chapter-list').innerHTML=chapters.map((c,i)=>`<li class="${story.mode==='guided'&&s.chapter===i?'active':i<s.chapter||done?'completed':''}" ${story.mode==='guided'&&s.chapter===i?'aria-current="step"':''}><span class="chapter-number">${i<s.chapter||done?'✓':String(i+1).padStart(2,'0')}</span><div><strong>${c[0]}</strong></div></li>`).join('');
 $('#chapter-status').textContent=story.mode==='explore'?'自由探索':done?'04 / 04 · 讲解完成':`第 ${String(s.chapter+1).padStart(2,'0')} 章 / 共 04 章`;
 $('#chapter-meter').setAttribute('aria-valuenow',done?4:s.chapter+1);$('#chapter-meter>span').style.width=(done?100:(s.chapter+1)*25)+'%';
 $('#story-back').hidden=true;$('#locate').hidden=true;$('#toggle-onboarding').hidden=true;
 $('#walkthrough-summary').hidden=!done&&story.mode!=='explore';
 if(done||story.mode==='explore')$('#walkthrough-summary').innerHTML='<p>回看关键内容</p>'+[[0,'低参与用户与转盘'],[3,'商品位与进度条 A/B'],[7,'购物车与支付页承接'],[24,'继续支付与奖励到账']].filter(([i])=>story.snapshots.has(i)).map(([i,t])=>`<button data-story-replay="${i}">${t} ↗</button>`).join('');
 if(story.mode==='explore'){
  $('#guide-next').hidden=!exploreComparison;$('#phone-instruction').hidden=true;
  $('#guide-kicker').textContent='自由操作 / 当前提示';$('#scene-note').hidden=true;
  $('#story-action-hint').textContent='上方可随时从头讲解';
  if(exploreComparison){
   const isB=state.variant==='progress';
   $('#step-index').textContent=isB?'方案 B · 圆形进度条':'方案 A · 商品位';
   $('#guide-content').innerHTML='<h2>两件已选，自由对照方案</h2><p>切换 A/B 只改变进度呈现，商品和金额不变。也可以直接在手机内 Checkout。</p>';
   $('#guide-next').textContent=isB?'返回 A 版商品位':'查看 B 版进度条';
   $('#guide-next').disabled=false;
  }
  return;
 }
 story.offScript=!s.valid();
 $('#intent-title').textContent=chapters[s.chapter][2];$('#intent-copy').textContent=chapters[s.chapter][3];
 $('#guide-kicker').textContent=story.offScript?'当前正在自由操作':'现在体验';$('#step-index').textContent=s.phase;
 $('#guide-content').innerHTML=`<h2>${s.title}</h2><p>${story.offScript?'可继续操作手机，或回到当前讲解。':s.copy}</p>`;
 $('#scene-note').hidden=!s.note||story.offScript;$('#scene-note').textContent=s.note;
 $('#guide-next').textContent=state.spinning?'正在揭晓权益…':state.paying?'模拟支付处理中…':story.offScript?'回到当前讲解':s.cta;
 $('#guide-next').disabled=state.spinning||state.paying;
 const selector=typeof s.target==='function'?s.target():s.target;
 $('#guide-next').hidden=!!$('.rules-modal')||(!story.comparisonPrompt&&(!!state.overlay||(!story.offScript&&![5,22].includes(story.index))));
 $('#phone-instruction').hidden=!selector||story.offScript;
 $('#phone-instruction').textContent=selector?'在手机内点击高亮区域':'';
 $('#story-action-hint').textContent=selector?'也可以直接操作手机':'点击上方按钮继续讲解';
}
function storyRestart(){story.busy=true;story.index=0;story.comparisonPrompt=false;story.journey={comparison:'pending',pickerReviewed:false,singleReturned:false,exitLeft:false,exitContinued:false};guidanceEnabled=story.mode==='guided';story.snapshots.clear();story.seen.clear();reset();if(story.mode==='guided'){story.index=1;state.variant='slots';state.audience='low';openOffer('spin',true);}storyRemember();story.busy=false;storyRender();scheduleOffer();scheduleCoach(true);}
function stageForCurrentScreen(){
 const i=story.index;
 if(state.overlay==='picker')return state.draft.size>state.selected.size?12:11;
 if(state.overlay==='retention'&&state.page==='checkout')return retentionCount()>=2?(story.journey.exitLeft?25:14):10;
 if(state.overlay==='bag')return 7;
 if(state.page==='home')return state.receipt?22:0;
 if(state.page==='spin')return 1;
 if(state.page==='offer')return 2;
 if(state.page==='success')return state.receipt?.earned?21:17;
 if(state.page==='checkout'){
  if(eligibleCount()<2)return checkoutEntrySeen?16:story.journey.singleReturned?27:9;
  if(i===12){story.journey.pickerReviewed=true;return story.journey.exitLeft?24:13;}
  if(i===13)return 13;
  if(i===25){story.journey.exitContinued=true;return 20;}
  if(story.journey.exitLeft&&!story.journey.exitContinued)return 24;
  return 20;
 }
 if(state.purchased!=null)return state.selected.size?19:18;
 if(eligibleCount()>=2){if(i===14){story.journey.exitLeft=true;return 15;}if(i===15)return 15;return story.journey.comparison==='pending'?5:6;}
 if(eligibleCount()===1){if(i===9){story.journey.singleReturned=true;return 26;}if(i===26)return 26;if(i===6||i===23)return 23;return [7,8,15,16,27].includes(i)&&!state.overlay?8:4;}
 return 3;
}
function setExperienceMode(mode){
 if(mode===story.mode)return;
 if(story.mode==='guided')story.guidedContext=originalGuideKey();
 story.comparisonPrompt=false;story.mode=mode;guidanceEnabled=mode==='guided';clearTimeout(coachTimer);hideCoach();
 if(mode==='guided'){
  if(story.guidedContext!==originalGuideKey())story.index=stageForCurrentScreen();
  storyRemember();
 }
 updateGuides();scheduleOffer();if(guidanceEnabled)scheduleCoach(true);
}
function storyExplore(){setExperienceMode('explore');}
const productUpdateGuides=updateGuides;
updateGuides=function(){productUpdateGuides();storyObserve();storyRender();};
const productScheduleOffer=scheduleOffer;
scheduleOffer=function(){if(story.mode==='guided'&&story.index!==0){clearTimeout(pushTimer);return;}productScheduleOffer();};
const productClickTarget=clickTarget;
clickTarget=function(){if(story.mode==='guided'&&!story.offScript){const s=contextualStoryStep(),target=typeof s.target==='function'?s.target():s.target;return [target||'[data-story-no-target]',s.cta];}return productClickTarget();};
// Comparison is a presentation milestone, independent of the product variant.
function resolveComparison(choice){
 story.comparisonPrompt=false;
 storyEnter(6,()=>{
  story.journey.comparison=choice;
  if(choice==='viewed')state.variant='progress';
  if(state.overlay==='bag')state.overlay=null;
  render();
 });
}
app.addEventListener('click',e=>{
 const control=e.target.closest('[data-action="checkout"]');
 if(!control||story.mode!=='guided'||story.journey.comparison!=='pending'||state.page!=='venue'||eligibleCount()<2)return;
 e.preventDefault();e.stopImmediatePropagation();
 story.comparisonPrompt=true;clearTimeout(coachTimer);hideCoach();storyRender();
 $('#guide-next').focus({preventScroll:true});
 $('#guide-next').scrollIntoView({block:'nearest',behavior:'smooth'});
},true);
$('#comparison-skip').addEventListener('click',()=>resolveComparison('skipped'));
$('#guide-next').addEventListener('click',e=>{
 if(story.mode==='guided'){e.stopImmediatePropagation();storyAdvance();return;}
 if(plainVenue()&&eligibleCount()>=2&&!$('.rules-modal')){
  e.stopImmediatePropagation();rememberScroll();
  state.variant=state.variant==='slots'?'progress':'slots';render();
 }
},true);
$('#reset').addEventListener('click',e=>{e.stopImmediatePropagation();storyRestart();},true);
$('#story-back').addEventListener('click',()=>{if(story.index>0)storyRestore(story.index-1);});
$('#walkthrough-summary').addEventListener('click',e=>{const button=e.target.closest('[data-story-replay]');if(!button)return;const index=Number(button.dataset.storyReplay);if(!story.snapshots.has(index))return;story.mode='guided';guidanceEnabled=true;storyRestore(index);});
clearTimeout(pushTimer);storyRemember();updateGuides();scheduleOffer();scheduleCoach(true);

// A non-blocking cue lives on the real phone control, never substitutes its action.
hideCoach=function(){
 const mark=screen.querySelector('.onboarding-focus');
 if(!mark)return;
 mark.classList.remove('onboarding-focus');mark.classList.add('coach-retiring');
 mark.style.opacity='0';setTimeout(()=>mark.remove(),180);
};
showCoach=function(){
 if(story.mode!=='guided'||!guidanceEnabled||guideIsBusy())return;
 const [selector,label]=clickTarget(),target=$(selector);
 if(!target||target.disabled||target.getAttribute('aria-disabled')==='true')return;
 const mark=document.createElement('div');mark.className='onboarding-focus coach-entering';mark.setAttribute('aria-hidden','true');
 if(!positionGuide(mark,target))return;
 hideCoach();mark.dataset.target=selector;
 const cue=document.createElement('i');cue.className='coach-tap';mark.appendChild(cue);
 screen.appendChild(mark);lastGuideKey=guideKey();
 $('#onboarding-status').textContent=label+'。点击屏幕内高亮区域继续。';
 requestAnimationFrame(()=>requestAnimationFrame(()=>mark.classList.remove('coach-entering')));
};
// The overlay is visual only: taps and scrolling reach the original product controls.
app.addEventListener('pointerdown',()=>hideCoach(),{capture:true});
const originalGuideKey=guideKey;
guideKey=function(){return originalGuideKey()+'|'+story.mode+'|'+story.index;};
const narrativeRender=render;
render=function(){narrativeRender();scheduleCoach();};
scheduleCoach(true);

const modeTabs=[...document.querySelectorAll('[data-experience-mode]')];
modeTabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>setExperienceMode(tab.dataset.experienceMode));
 tab.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-index;
  modeTabs[next].focus();setExperienceMode(modeTabs[next].dataset.experienceMode);
 });
});

// Guided entry starts with the audience-specific invitation; free exploration stays optional.
if(story.mode==='guided'&&state.page==='home'&&!state.receipt){storyEnter(1,()=>{state.audience='low';openOffer('spin',true);});}
