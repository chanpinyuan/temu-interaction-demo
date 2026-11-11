'use strict';
const $=(s,root=document)=>root.querySelector(s);
const app=$('#app'),screen=$('.screen');
const products=[{"id": 0, "name": "Multi-pocket cargo pants", "price": 15.69, "img": "assets/pencil/cjlkA.png"}, {"id": 1, "name": "50-pack microfiber cloths", "price": 11.06, "img": "assets/pencil/xeP49.png"}, {"id": 2, "name": "Braided USB-C cable", "price": 2.63, "img": "assets/pencil/zJlRD.png"}, {"id": 3, "name": "Motion sensor night lights", "price": 3.73, "img": "assets/pencil/psQTS.png"}, {"id": 4, "name": "Classic everyday belts", "price": 2.36, "img": "assets/pencil/XaPJk.png"}, {"id": 5, "name": "Cozy indoor pet house", "price": 19.77, "img": "assets/pencil/e4seAq.png"}, {"id": 6, "name": "Stainless tongue scrapers", "price": 2.31, "img": "assets/pencil/phOsz.png"}, {"id": 7, "name": "Soft cotton lounge set", "price": 10.8, "img": "assets/pencil/GU0g8.png"}];
const state={page:'home',selected:new Set(),variant:'slots',spinning:false,paid:false,paying:false,wallet:false,receipt:null,history:[],scroll:0,offerSeen:false,entryReturn:'home',modalReturn:'home',audience:'low',overlay:null,draft:null,paymentMethod:'Apple Pay',purchased:null,quantities:{}};
let spinTimer,paymentTimer,toastTimer,flyTimer,pushTimer,celebrationTimer,coachTimer,transitionId=0;
const liveAnimations=new Set();
let guidanceEnabled=true,lastGuideKey='',guideQuietSince=0;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const money=()=>products.filter(p=>state.selected.has(p.id)).reduce((a,p)=>a+p.price*(state.quantities?.[p.id]||1),0).toFixed(2);
const selectedUnits=()=>[...state.selected].flatMap(id=>Array(Math.max(1,state.quantities?.[id]||1)).fill(id));
const eligibleCount=()=>selectedUnits().length+(state.purchased!=null?1:0);
const currentStep=()=>({home:0,spin:1,offer:2,checkout:5,success:6}[state.page]??(eligibleCount()>=2?4:3));
const guides=[
 ['发现一份新权益','点击手机内高亮的 banner 可直接选品。低参与用户停留 4.5–9 秒后会收到转盘邀请；切换常规用户可对照体验。','进入活动主会场','轻入口，低打扰','首页保持轻量入口。仅对活动低参与用户用转盘吸引注意；本地演示每次体验最多一次，关闭后不再重复推送。','轻量入口,背景连续'],
 ['转一下，发现你的优惠','点击转盘中心或 Reveal my offer，体验转盘加速、减速停留与权益揭晓。','开始转盘','互动是权益的揭晓过程','针对活动低参与用户，以互动吸引进入活动。转盘只揭晓可参与的券包权益，不改变购买2件并支付的门槛，也不代表现金中奖。','低参与定向,渐显邀请,固定指针'],
 ['先看清，再开始挑选','券包权益集中呈现。点击 Choose my 2 items 进入主会场，查看规则后再决定参与。','进入主会场','让权益与条件同时可见','保留金色券面视觉，同时说明“购买 2 件并支付”以及优惠券仅用于后续订单。','券面弹入,层级过渡'],
 ['挑选你的第一件商品','点击 Add to pair。每次加购，商品图都会飞入进度位，并同步更新金额和结账状态。','加入第 1 件商品','动作之后，立即得到确认','加购反馈由飞入、节点点亮和文案变化组成。只选 1 件也能结账，轻提示帮助用户发现第二件的价值。','商品飞入,节点点亮,金额更新'],
 ['两件齐了，准备领券','点击 Checkout 进入结算。移除任一商品，进度、金额与横幅提示会同步回退，单件仍可购买。','前往模拟结账','达标与到账明确区分','选满 2 件只获得领券资格。这里强调“Pay to claim”，不提前显示优惠券已经到账。','达标提示,按钮强化,状态回退'],
 ['确认订单，完成支付','这是一笔模拟订单，不会真实扣款。确认商品和金额后，点击支付按钮完成体验。','完成模拟支付','保持购买意图畅通','单件订单也可直接完成；只有两件活动商品的订单，才会在支付成功后发放券包。','支付处理中,防重复点击'],
 ['奖励到账，完成闭环','奖励已到账，本次链路已完成。点击手机内 Done，或下方完成按钮，返回首页。','完成，返回首页','庆祝真实的获得时刻','礼花仅在符合条件的模拟订单支付成功时触发。券包仍保留使用门槛，避免把券面额理解为现金。','礼花庆祝,到账确认,完成返回']
];
function clearAsync(){
 if(typeof stopRetentionClock==='function')stopRetentionClock();
 clearTimeout(coachTimer);hideCoach();clearTimeout(spinTimer);clearTimeout(paymentTimer);clearTimeout(flyTimer);clearTimeout(pushTimer);clearTimeout(toastTimer);clearTimeout(celebrationTimer);
 state.spinning=false;state.paying=false;transitionId++;
 liveAnimations.forEach(a=>a.cancel());liveAnimations.clear();document.querySelectorAll('.flying-product').forEach(n=>n.remove());
 $('#toast').classList.remove('show');$('#fx').replaceChildren();
}
function rememberScroll(){if(state.page==='venue'&&$('.activity-scroll'))state.scroll=$('.activity-scroll').scrollTop;}
function scheduleOffer(){
 clearTimeout(pushTimer);if(state.page!=='home'||state.offerSeen||state.receipt||state.audience!=='low'||state.overlay)return;
 const delay=4500+Math.random()*4500;
 pushTimer=setTimeout(()=>{if(state.page==='home'&&!state.offerSeen&&!document.hidden&&state.audience==='low'&&!state.overlay)openOffer('spin',true);},delay);
}
function commitPage(page,{remember=true}={}){
 rememberScroll();clearAsync();state.overlay=null;state.draft=null;
 if(page==='home')state.purchased=null;
 if(page==='checkout'&&!state.selected.size)page='venue';
 if(page==='success'&&!state.receipt)page='home';
 if(remember&&page!==state.page)state.history.push(state.page);
 state.page=page;state.wallet=false;render();scheduleOffer();
}
function openOffer(page,automatic=false){state.offerSeen=true;state.modalReturn=state.page==='spin'||state.page==='offer'?state.modalReturn:state.page;commitPage(page);if(automatic)screen.classList.add('auto-offer');}
function closeOffer(){const target=state.modalReturn;state.history=state.history.filter(p=>!['spin','offer'].includes(p));commitPage(target,{remember:false});}
function go(page){
 if(['spin','offer'].includes(page)){openOffer(page);return;}
 if(page==='venue'&&['spin','offer'].includes(state.page)){state.entryReturn=state.modalReturn==='venue'?state.entryReturn:state.modalReturn;state.history=state.history.filter(p=>!['spin','offer'].includes(p));commitPage('venue',{remember:false});return;}
 if(page==='venue'&&state.page==='home')state.entryReturn='home';
 commitPage(page);
}
function back(){
 if(state.overlay){closeLayer();return;}
 if($('.rules-modal')){closeRules();return;}
 if(['spin','offer'].includes(state.page)){closeOffer();return;}
 if(state.page==='success'){state.history=[];commitPage('home',{remember:false});return;}
 if(state.page==='checkout'){const cancelled=state.paying;commitPage('venue',{remember:false});state.history=state.history.filter(p=>p!=='checkout');if(cancelled)toast('Payment cancelled · Your items are saved');return;}
 const previous=state.page==='venue'?state.entryReturn:(state.history.pop()||'home');
 commitPage(previous,{remember:false});
}
function resumePurchase(){if(!state.receipt||state.receipt.earned)return;state.purchased=state.receipt.items[0];state.selected.clear();state.quantities={};go('venue');}
function finishFlow(){if(state.page!=='success'||!state.receipt?.earned)return;state.selected.clear();state.quantities={};state.purchased=null;state.history=[];state.scroll=0;state.offerSeen=true;commitPage('home',{remember:false});}
function reset(){if(typeof resetRetentionClock==='function')resetRetentionClock();lastGuideKey='';clearAsync();state.selected.clear();Object.assign(state,{paid:false,receipt:null,page:'home',wallet:false,history:[],scroll:0,offerSeen:false,entryReturn:'home',modalReturn:'home',overlay:null,draft:null,paymentMethod:'Apple Pay',purchased:null,quantities:{}});render();scheduleOffer();}
function homeMarkup(){return `<div class="home"><img class="home-static" src="assets/tLlRx.png" alt="TEMU 首页：活动入口和精选商品"><div class="home-status-cover"></div><button class="home-hotspot" data-action="venue" aria-label="Get a $300 coupon — browse eligible items">Get a $300 coupon</button><button class="home-nav-hit" data-action="bag" aria-label="View selected items">Cart</button></div>`;}
function nav(title,backAction='back',rules=true){return `<div class="nav"><button class="back" data-action="${backAction}" aria-label="Go back">‹</button><span>${title}</span>${rules?'<div class="nav-actions"><button class="nav-bag" data-action="bag" aria-label="Open activity bag">'+bagIcon()+'</button><button class="rules" data-action="rules">Rules</button></div>':'<span style="width:28px"></span>'}</div>`;}
function modalMarkup(){const spin=state.page==='spin';return `<section class="overlay ${spin?'spin':'offer'}" role="dialog" aria-modal="true" aria-label="${spin?'Discover your offer':'Your coupon offer'}"><button class="close" data-action="close-offer" aria-label="Close offer">×</button><h2>${spin?'Give your next shop<br>a lucky spin.':'Your next haul,<br>with more savings.'}</h2>${spin?`<div class="wheel-wrap"><svg class="layer-definitions" width="0" height="0" aria-hidden="true"><defs><clipPath id="wheel-hub-mask" clipPathUnits="objectBoundingBox"><circle cx=".496" cy=".502" r=".139"/><path d="M .459 .371 L .489 .299 Q .498 .285 .506 .304 L .538 .366 Q .541 .376 .528 .376 L .467 .376 Z"/></clipPath></defs></svg><div class="wheel-rotor"><div class="wheel-inner-sectors"></div><img class="wheel-art" src="assets/wheel.png" alt="Seven-segment coupon wheel"></div><img class="wheel-fixed-hub" src="assets/wheel.png" alt="Fixed gold pointer and SPIN button"><button class="spin-center" data-action="spin" aria-label="Spin to reveal offer">SPIN</button></div><p class="conditions">Buy 2 eligible items and pay to earn coupons.<br>The wheel reveals your available offer.</p><button class="primary" data-action="spin">Reveal my offer</button>`:`<img class="coupon-large" src="assets/fR31p.png" alt="$300 coupon bundle"><p class="offer-rule">Buy 2 eligible items to earn it.</p><p class="conditions" style="margin:0">3 × $100 off $150 · For future orders</p><p class="offer-steps">CHOOSE 2 &nbsp; → &nbsp; PAY &nbsp; → &nbsp; GET COUPONS</p><button class="primary" data-action="venue">Choose my 2 items</button>`}<button class="later" data-action="close-offer">Maybe later</button></section>`;}
function progressMarkup(){const n=state.selected.size,selected=[...state.selected].map(id=>products[id]);const title=n===0?'Pick 2 eligible items':n===1?'Just 1 more item':'Ready for checkout';const message=n===0?'Add 2 items, then pay to receive your coupons.':n===1?'Add 1 more, then pay to receive your coupons.':'Both items added. Pay to receive your coupons.';
 if(state.variant==='slots')return `<div class="slot-progress"><div class="slots">${[0,1].map(i=>`<div class="slot ${selected[i]?'filled':''}" id="slot-${i}">${selected[i]?`<img src="${selected[i].img}" alt="${selected[i].name}"><span>Item ${i+1} added</span><button class="slot-remove" data-action="remove" data-id="${selected[i].id}" aria-label="Remove ${selected[i].name}">×</button>`:`<span class="plus">＋</span><span>Choose item ${i+1}</span>`}</div>`).join('')}</div><p class="progress-message">${['Pick 2 items to unlock your coupon bundle.','Nice pick! Just 1 more to go.','Your pair is ready. Complete payment.'][n]}</p></div>`;
 return `<div class="progress-panel"><div class="progress-heading">${title}<small>${n} / 2 added</small></div><div class="milestones"><div class="track"><div class="track-fill" style="width:${n*50}%"></div></div>${[0,1,2].map(i=>`<div class="milestone"><div id="slot-${i}" class="circle ${i<2?selected[i]?'done':'':n===2?'done':''}">${i===2?`<img class="mini-coupon" src="assets/fR31p.png" alt="$300 coupons">${n===2?'<b>✓</b>':''}`:selected[i]?`<img src="${selected[i].img}" alt="${selected[i].name}"><button class="circle-remove" data-action="remove" data-id="${selected[i].id}" aria-label="Remove ${selected[i].name}">×</button>`:'+'}</div><small>${i===2?n===2?'Pay to claim':'After payment':selected[i]?`Item ${i+1} added`:`Pick item ${i+1}`}</small></div>`).join('')}</div><p>${message}</p></div>`;
}
function venueMarkup(){const n=state.selected.size;return `<section class="view activity"><div class="activity-scroll"><div class="activity-hero">${nav('Buy 2. Unlock more.')}<img class="hero-coupon" src="assets/fR31p.png" alt="$300 coupon bundle"><p class="terms">${state.variant==='progress'?'3 × $100 off $150 · For future orders':'Pay for 2 eligible items · Use coupons on future orders'}</p>${progressMarkup()}</div><div class="products-section"><h3>${n===1?'Find your second favorite':'Picked for you'}</h3><div class="product-grid">${products.map(p=>`<article class="product" data-product="${p.id}"><div class="product-photo"><img src="${p.img}" alt="${p.name}"></div><p class="product-name">${p.name}</p><div class="price">$${p.price.toFixed(2)}</div><button class="add-button ${state.selected.has(p.id)?'added':''}" data-action="add" data-id="${p.id}" aria-pressed="${state.selected.has(p.id)}">${state.selected.has(p.id)?'Added ✓ · Undo':'Add to pair'}</button>${state.selected.has(p.id)?`<button class="remove-item" data-action="remove" data-id="${p.id}">Remove</button>`:''}</article>`).join('')}</div><div class="recommendation"><p>More to explore</p><img src="assets/kOAWp.png" alt="More shopping inspiration"></div></div></div>${checkoutBar()}</section>`;}
function bagIcon(){return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>';}
function ticketIcon(){return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Z"/><path d="M12 5v3m0 2v4m0 2v3"/></svg>';}
function checkoutBar(context='venue'){
 const n=state.selected.size,isPayment=context==='checkout';
 const copy=n===0?'Pick 2 items to earn $300 in coupons':n===1?'Add 1 more to earn $300 in coupons':'Pay to receive your $300 coupon bundle';
 const link=n===1&&context!=='venue'?`<button class="add-item-link" data-action="${isPayment?'open-picker':'locate-products'}">Add item ›</button>`:'';
 return `<div class="checkout-bar"><div class="benefit-banner">${ticketIcon()}<span>${copy}</span>${link}</div><div class="checkout-row"><div class="total"><small>Total</small><strong>$${money()}</strong></div><button class="checkout-cta ${n?'qualified':''}" data-action="${isPayment?'pay':'checkout'}" ${!n||state.paying?'disabled':''}>${state.paying?'Processing…':'Checkout'}</button></div></div>`;
}

function checkoutMarkup(){return `<section class="view checkout-page">${nav('Order confirmation','back',false)}<div class="checkout-body"><div class="simulation-label">DEMO ORDER · NO REAL PAYMENT</div><div class="address">Demo customer<small>Sample address · United States</small></div><div class="order-items">${orderItemsMarkup()}</div><h3 class="payment-title">Payment methods</h3><div class="payment-options">${['Apple Pay','Visa …7408','PayPal','Cash App Pay','Afterpay','Klarna','Affirm','Venmo'].map((method,i)=>`<label class="payment-option"><input type="radio" name="payment-method" value="${method}" ${state.paymentMethod===method?'checked':''}><span class="payment-logo method-${i}">${[' Pay','VISA','PayPal','$','Afterpay','Klarna.','affirm','venmo'][i]}</span><span>${method}${i===4||i===5?'<small>4 interest-free payments</small>':i===6?'<small>Payment options available</small>':''}</span></label>`).join('')}</div><div class="order-subtotal"><span>Item(s) total:</span><span>$${money()}</span></div></div>${checkoutBar('checkout')}</section>`;}
function orderItemsMarkup(){return products.filter(p=>state.selected.has(p.id)).map(p=>`<div class="order-item"><img src="${p.img}" alt="${p.name}"><div><h4>${p.name}</h4><p>$${p.price.toFixed(2)}</p></div><button class="order-remove" data-action="remove" data-id="${p.id}" aria-label="Remove ${p.name}">Remove</button></div>`).join('');}
function bagMarkup(){const n=state.selected.size;return `<section class="layer-modal bag-modal" role="dialog" aria-modal="true" aria-label="Activity bag"><div class="layer-dismiss" data-action="close-layer"></div><div class="bag-sheet"><div class="sheet-grip" data-drag-handle></div><div class="sheet-heading"><h3>Your activity bag (${n})</h3><button data-action="close-layer" aria-label="Close activity bag">×</button></div><div class="bag-items">${n?orderItemsMarkup():'<p class="empty-bag">Your next pair starts here.<br>Pick 2 eligible items to earn coupons.</p>'}${n<2?'<button class="text-button" data-action="locate-products">Browse eligible items →</button>':''}</div>${checkoutBar('bag')}</div></section>`;}
function pickerMarkup(){const n=state.draft.size,pending=n>state.selected.size;return `<section class="layer-modal picker-modal" role="dialog" aria-modal="true" aria-label="Add one more item"><div class="layer-dismiss" data-action="close-layer"></div><div class="picker-sheet"><div class="sheet-grip" data-drag-handle></div><div class="sheet-heading"><h3>Add one more item</h3><button data-action="close-layer" aria-label="Cancel item selection">×</button></div><p class="picker-terms">Choose 2 eligible items and pay to earn coupons.<br>Your address and payment method stay saved.</p><div class="picker-progress"><img src="${products[[...state.selected][0]].img}" alt="Current selected item"><span>${n} of 2 selected · ${pending?'Pay after confirming':'Add your second item'}</span></div>${products.filter(p=>!state.selected.has(p.id)).map(p=>`<article class="picker-product"><div class="picker-photo"><img src="${p.img}" alt="${p.name}"></div><div class="picker-product-info"><h4>${p.name}</h4><small>${p.id===1?'Gray · 50 pieces':'Khaki · Size M'}</small><strong>$${p.price.toFixed(2)}</strong><button class="add-button ${state.draft.has(p.id)?'added':''}" data-action="picker-add" data-id="${p.id}" aria-pressed="${state.draft.has(p.id)}">${state.draft.has(p.id)?'Selected ✓ · Undo':'Add'}</button></div></article>`).join('')}<button class="picker-confirm ${pending?'primary':'secondary'}" data-action="${pending?'confirm-picker':'close-layer'}">${pending?'Confirm item · $'+products.filter(p=>state.draft.has(p.id)).reduce((sum,p)=>sum+p.price,0).toFixed(2):'Back to checkout'}</button><p class="picker-footnote">${pending?'Coupons are issued only after payment.':'You can still check out with just 1 item.'}</p></div></section>`;}
function renderLayer(){const action=document.activeElement?.dataset.action;app.querySelector('.layer-modal')?.remove();if(state.overlay)app.insertAdjacentHTML('beforeend',state.overlay==='bag'?bagMarkup():pickerMarkup());updateGuides();const layer=$('.layer-modal');(action&&layer?.querySelector('[data-action="'+action+'"]')||layer?.querySelector('button'))?.focus({preventScroll:true});}
function openBag(){rememberScroll();clearAsync();state.overlay='bag';renderLayer();}
function openPicker(){if(state.page!=='checkout'||state.selected.size!==1||eligibleCount()>=2||state.paying)return;clearAsync();state.overlay='picker';state.draft=new Set(state.selected);renderLayer();}
function closeLayer(){const old=state.overlay;state.overlay=null;state.draft=null;app.querySelector('.layer-modal')?.remove();updateGuides();if(old==='picker')$('.add-item-link')?.focus({preventScroll:true});else $('.nav-bag')?.focus({preventScroll:true});scheduleOffer();}
function toggleDraft(id){if(state.overlay!=='picker'||state.selected.has(id)||!products[id])return;state.draft.has(id)?state.draft.delete(id):state.draft.add(id);renderLayer();$('.picker-progress')?.classList.add('progress-flash');}
function confirmPicker(){if(state.overlay!=='picker'||state.draft.size<=state.selected.size)return;const scroll=$('.checkout-body').scrollTop;state.selected=new Set(state.draft);state.overlay=null;state.draft=null;render();$('.checkout-body').scrollTop=scroll;toast('Item added · Pay to receive your coupons');$('.benefit-banner').classList.add('progress-flash');}
function locateProducts(){state.overlay=null;state.draft=null;go('venue');const region=$('.products-section');region.tabIndex=-1;region.focus({preventScroll:true});const scroller=$('.activity-scroll');scroller.scrollTo({top:Math.max(0,region.offsetTop-$('.activity-hero').offsetHeight),behavior:reduced()?'instant':'smooth'});region.classList.add('focus-products');toast('Choose your second item · Your first pick is saved');hint();}

function successMarkup(){const earned=state.receipt?.earned;return `<section class="receipt ${earned?'':'single'}"><div class="success-check">✓</div><h2>Order confirmed</h2><p>Demo payment completed · $${state.receipt?.total||'0.00'}</p><img class="received-coupon" src="assets/fR31p.png" alt="$300 coupon bundle"><h3>${earned?'Your coupons are ready':'Thanks for your order'}</h3><p>${earned?'Saved to your coupon wallet.<br>Use them on your next eligible orders.':'Your single-item order is complete.<br>This order did not qualify for coupons.'}</p>${earned?'<span class="received-label">✓ Coupons received</span><div class="coupons">'+[1,2,3].map(i=>`<div class="coupon-row"><strong>$100 OFF</strong><span>Orders $150+<br>Coupon ${i} of 3</span></div>`).join('')+'</div><button class="primary" data-action="finish">Done</button>':'<div style="height:30px"></div><button class="primary" data-action="reset">Back to home</button>'}<button class="text-button" data-action="continue-shopping">${earned?'Continue shopping':'Try the 2-item flow'}</button></section>`;}
function render(){screen.classList.remove('auto-offer');screen.classList.toggle('is-modal',['spin','offer'].includes(state.page));app.innerHTML=state.page==='home'?homeMarkup():['spin','offer'].includes(state.page)?homeMarkup()+modalMarkup():state.page==='venue'?venueMarkup():state.page==='checkout'?checkoutMarkup():successMarkup();if(state.page==='venue')$('.activity-scroll').scrollTop=state.scroll;if(state.overlay)app.insertAdjacentHTML('beforeend',state.overlay==='bag'?bagMarkup():pickerMarkup());updateGuides();}
function updateGuides(){let index=currentStep(),g=[...guides[index]];if(state.page==='venue'&&state.selected.size===1)g=['再选一件，离奖励更近','第一件已加入。点击另一件商品，观察进度、金额与结账按钮的联动；也可以直接结账购买当前商品。','加入第 2 件商品','不阻断，轻提醒','单件 Checkout 保持可用。主会场横幅只说明权益，不显示 Add item。购物车返回并定位选品，支付页原地打开选品半弹窗。','商品飞入,通栏提示,单件可买'];if(state.page==='success'&&!state.receipt?.earned)g=['第一件已购买，继续完成奖励','本次单件订单已支付，第一件计入活动。点击继续挑选第二件，回到带 Purchased 标记的会场。','挑选第 2 件商品','尊重已有购买意图','购买和奖励资格是两件事。未达标时允许完成购买，清楚说明未发券原因。','单件畅通,结果明确'];

 if(state.page==='checkout'&&eligibleCount()===1)g=['在支付页原地补选','点击底部 Add item，拉起选品半弹窗。也可以直接点击 Checkout 完成当前单件订单。','打开选品半弹窗','保留付款上下文','选品半弹窗保留地址和支付方式。选择先暂存，确认后更新订单；关闭、下滑或返回可放弃临时选择。','半屏选品,选择可撤销,单件可买'];
 if(state.page==='venue'&&state.purchased!=null)g=state.selected.size?['已购进度保留，支付第二件','第一件保持 Purchased；只需支付本次新选商品。移除新选商品后，回到已购一件的会场。','前往模拟结账','已购与待付款分开','历史订单与本次购物袋分开。本次商品可加选、取消，只对新选择计费。','保留已购,仅计新单,可撤销']:['第一件已买好，再选一件','上方 Purchased 仅表示历史订单进度，不是本次加购。商品区从未选中开始，新加商品都可以取消。','挑选第 2 件商品','从已购进度继续','仅从续购入口延续历史订单进度。当前购物袋为空，Total 为 $0.00；从首页重新进入则开始新的选择。','已购保留,零重复计费,继续挑选'];
 if(state.overlay==='bag')g=['从购物车定位到选品','单件状态点击横幅 Add item，关闭购物车并定位主会场商品区，原来的选择会保留。','定位到会场商品','不同场景，不同承接','会场内无需重复入口；购物车使用返回并定位，支付页使用原地选品。两处都不阻断直接结账。','保留已选,定位商品区,低打扰'];
 if(state.overlay==='picker')g=state.draft.size>state.selected.size?['确认这件，再回到支付','点击 Confirm item，把临时选择加入订单。也可以 Undo、关闭或下滑取消，原订单保持不变。','确认加购并返回','确认前不改原订单','临时选择和订单分离。确认后同步金额、商品数及领券条件，最后仍由用户主动点击 Checkout。','临时选择,确认后更新,支持撤销']:['挑选你的第二件','点击推荐商品的 Add。先查看更新的件数与合计，再确认添加到订单。','选择推荐商品','在支付页完成补选','保留地址、支付方式与支付页位置。无需跳走重填信息，也不强迫购买第二件。','上下文保留,半屏选品,关闭即返回'];
 if(state.overlay==='bag'&&state.purchased!=null&&state.selected.size)g=['只结算新选商品','已购买的第一件已计入活动。购物袋只展示本次未付款的商品，点击 Checkout 继续。','前往模拟结账','已购商品不重复计费','第一件保持已购；本次支付成功后满足活动要求并发券。','已购保留,只付新单'];
 if(state.overlay==='bag'&&!state.selected.size)g=['购物车还没有商品','点击 Explore eligible items 前往会场选品；关闭抽屉回到刚才的页面。','前往会场','从当前页面继续','空购物车不会触发结账，关闭也不会跳到其他页面。','空状态,保留来源'];
 if(state.overlay==='bag'&&eligibleCount()>=2)g=['已选满，继续结账','点击 Checkout 前往支付；关闭回到原页面，已选商品和数量保留。','前往支付','状态一致','按实际件数计算进度与优惠资格；只有支付成功后才发券。','进度一致,保留数量'];
 if(state.overlay==='retention')g=retentionGuide();
 $('#step-index').textContent=`${String(index+1).padStart(2,'0')} / 07`;$('#guide-content').innerHTML=`<h2>${g[0]}</h2><p>${g[1]}</p>`;$('#guide-next').textContent=state.spinning?'正在揭晓权益…':state.paying?'模拟支付处理中…':g[2];$('#guide-next').disabled=state.spinning||state.paying;$('#intent-title').textContent=g[3];$('#intent-copy').textContent=g[4];$('#motion-tags').innerHTML=g[5].split(',').map(t=>`<span>${t}</span>`).join('');$('#journey').innerHTML=['首页入口','转盘感知','权益展示','挑选商品','满件达标','模拟结算','奖励到账'].map((label,i)=>`<button data-step="${i}" class="${i===index?'active':i<index?'past':''}" aria-current="${i===index?'step':'false'}"><span class="step-num">${i<index?'✓':String(i+1).padStart(2,'0')}</span>${label}</button>`).join('');document.querySelectorAll('[data-variant]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.variant===state.variant)));$('#variant-note').textContent=state.variant==='slots'?'沿用主流程的两个商品位。':'商品圆图 → 进度连线 → 优惠券终点。';
 const labels=['首页入口','转盘感知','权益展示','挑选商品','满件达标','模拟结算','奖励到账'];$('#flow-status').textContent='当前：'+labels[index];$('#journey-fill').style.width=(index/6*100)+'%';$('.journey-meter').setAttribute('aria-valuenow',index+1);
 document.querySelectorAll('[data-audience]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.audience===state.audience)));
 $('#trigger-status').textContent=state.audience==='regular'?'常规用户：不自动推送，保留 banner 自主入口。':state.offerSeen?'本次邀请已展示，关闭后不再重复推送。':state.page==='home'?'演示：停留 4.5–9 秒后渐显，每次体验最多一次。':'已离开首页，取消本次自动推送。';
 scheduleCoach();}

function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2100);}
function spin(){
 if(state.spinning||state.page!=='spin')return;
 state.spinning=true;hideCoach();$('.wheel-wrap').classList.add('spinning');
 app.querySelectorAll('[data-action="spin"]').forEach(b=>{
  b.disabled=true;b.setAttribute('aria-disabled','true');b.setAttribute('aria-busy','true');
  if(b.classList.contains('primary')){
   const label=b.querySelector('[data-name="按钮标签"]');
   if(label)label.textContent='Revealing your offer…';else b.textContent='Revealing your offer…';
   b.setAttribute('aria-label','Revealing your offer…');
  }
 });
 updateGuides();spinTimer=setTimeout(()=>{state.spinning=false;commitPage('offer',{remember:false});toast('Your available offer is ready');},reduced()?150:2950);
}
function animateProduct(id,start,end,{reverse=false,onFinish=()=>{}}={}){
 if(reduced()){onFinish();return;}
 const flyer=document.createElement('img');flyer.src=products[id].img;flyer.className='flying-product';
 const size=reverse?38:64;
 Object.assign(flyer.style,{left:(start.left+start.width/2-size/2)+'px',top:(start.top+start.height/2-size/2)+'px',width:size+'px',height:size+'px'});
 document.body.appendChild(flyer);
 const dx=end.left+end.width/2-(start.left+start.width/2),dy=end.top+end.height/2-(start.top+start.height/2);
 // Sample a quadratic arc; the entire trajectory uses one ease-in-out time curve.
 const frames=Array.from({length:61},(_,i)=>{const t=i/60,curve=-55*4*t*(1-t);return {offset:t,transform:`translate(${dx*t}px,${dy*t+curve}px) scale(${1+(reverse?.35:-.48)*t})`,opacity:reverse?1-.85*t:1-Math.max(0,(t-.82)/.18)};});
 const anim=flyer.animate(frames,{duration:reverse?540:820,easing:'cubic-bezier(0.42, 0, 0.58, 1)',fill:'forwards'});
 liveAnimations.add(anim);anim.onfinish=()=>{liveAnimations.delete(anim);flyer.remove();onFinish();};anim.oncancel=()=>flyer.remove();
}
function patchSelection(){
 const scroller=$('.activity-scroll');const scroll=scroller?.scrollTop||state.scroll;
 const existingHero=$('.activity-hero');const oldWidth=$('.track-fill')?.style.width;
 if(state.page!=='venue'){render();return;}
 const holder=document.createElement('div');holder.innerHTML=venueMarkup();
 const fresh=holder.firstElementChild;
 // Keep the scrolling container and page mounted. Only update affected regions.
 existingHero.replaceWith($('.activity-hero',fresh));
 $('.products-section').replaceWith($('.products-section',fresh));
 $('.checkout-bar').replaceWith($('.checkout-bar',fresh));
 scroller.scrollTop=scroll;state.scroll=scroll;const fill=$('.track-fill');if(fill&&oldWidth&&!reduced()){const next=fill.style.width;fill.style.width=oldWidth;void fill.offsetWidth;requestAnimationFrame(()=>{if(fill.isConnected)fill.style.width=next;});}updateGuides();
}
function add(id){
 if(state.page!=='venue'||!products[id])return;
 if(state.selected.has(id)){remove(id);return;}
 const photo=$(`[data-product="${id}"] .product-photo`),start=photo.getBoundingClientRect();
 clearAsync();const token=transitionId;state.selected.add(id);const destIndex=state.selected.size-1;
 patchSelection();const target=$('#slot-'+destIndex),end=target.getBoundingClientRect();
 target.classList.add('awaiting-arrival');
 animateProduct(id,start,end,{onFinish:()=>{
 if(token!==transitionId||state.page!=='venue')return;
 target.classList.remove('awaiting-arrival');target.classList.add('progress-flash');
 if(state.selected.size>=2){$('.checkout-cta').classList.add('qualified-flash');const note=document.createElement('div');note.className='progress-announcement';note.innerHTML='<span>✓ Pair complete · Pay to claim</span>';app.appendChild(note);setTimeout(()=>note.remove(),1300);}
 else toast('Item added · Just 1 more to go');
 }});
}
function remove(id){
 if(!state.selected.has(id)||(!['venue','checkout'].includes(state.page)&&state.overlay!=='bag'))return;
 const index=[...state.selected].indexOf(id),node=$('#slot-'+index),photo=$(`[data-product="${id}"] .product-photo`);
 const start=node?.getBoundingClientRect(),end=photo?.getBoundingClientRect();
 clearAsync();state.selected.delete(id);
 if(state.page==='checkout'&&!state.selected.size){commitPage('venue',{remember:false});toast('Bag cleared · Pick your favorites');return;}
 if(state.page==='venue'&&!state.overlay)patchSelection();else render();
 if(start&&end)animateProduct(id,start,end,{reverse:true});
 toast('Item removed · Progress updated');
}
function pay(){
 if(state.page!=='checkout'||state.paying||state.overlay||!state.selected.size)return;
 state.paying=true;const token=transitionId,order={items:[...state.selected],total:money(),paymentMethod:state.paymentMethod,earned:eligibleCount()>=2};
 $('[data-action="pay"]').disabled=true;$('[data-action="pay"]').textContent='Processing…';updateGuides();
 paymentTimer=setTimeout(()=>{
 if(token!==transitionId||state.page!=='checkout')return;
 state.paying=false;state.paid=true;state.receipt=Object.freeze(order);state.purchased=null;state.selected.clear();state.quantities={};state.scroll=0;state.history=[];
 state.page='success';render();if(order.earned)celebrate();
 },reduced()?150:1100);
}
function celebrate(){const fx=$('#fx');fx.replaceChildren();if(reduced())return;for(let i=0;i<64;i++){const c=document.createElement('i');c.className='confetti';const angle=Math.random()*Math.PI*2,dist=90+Math.random()*260;c.style.setProperty('--x',Math.cos(angle)*dist+'px');c.style.setProperty('--y',(Math.sin(angle)*dist+200)+'px');c.style.setProperty('--r',(Math.random()*1080-540)+'deg');c.style.background=['#f9bb54','#ff7b16','#fff1c9','#d5a04c','#b4915e'][i%5];c.style.animationDelay=Math.random()*.12+'s';fx.appendChild(c);}celebrationTimer=setTimeout(()=>fx.replaceChildren(),1800);}
function rules(){if($('.rules-modal'))return;clearTimeout(coachTimer);hideCoach();const modal=document.createElement('div');modal.className='rules-modal';modal.innerHTML=`<section class="rules-sheet" role="dialog" aria-modal="true" aria-label="Offer rules"><h3>How it works</h3><p>1. Choose 2 eligible items from this activity.<br>2. Complete payment for both items.<br>3. Receive a $300 coupon bundle after payment.</p><p>The bundle includes 3 coupons, each offering $100 off a future order of $150 or more. The bundle is not cash and is not applied to this order.</p><p>You can buy just 1 item without receiving the bundle. This prototype uses simulated orders and payments.</p><button class="primary" data-action="close-rules">Got it</button></section>`;app.appendChild(modal);modal.querySelector('button').focus();}
function closeRules(){const modal=$('.rules-modal');if(modal)modal.remove();$('.rules')?.focus();scheduleCoach();}
function clickTarget(){if(state.overlay==='picker')return [state.draft.size>state.selected.size?'[data-action="confirm-picker"]':'[data-action="picker-add"]',state.draft.size>state.selected.size?'点击确认加购':'点击添加，再确认'];if(state.overlay==='bag')return [state.selected.size===1?'.bag-sheet .add-item-link':state.selected.size?'.bag-sheet .checkout-cta':'[data-action="locate-products"]',state.selected.size===1?'点击定位到会场':'点击继续'];return {home:['.home-hotspot','点击 banner 进入选品'],spin:['.overlay .primary','点击开始转盘'],offer:['.overlay .primary','点击挑选商品'],venue:[state.selected.size<2?'.add-button:not(.added)':'.checkout-cta',state.selected.size<2?'点击添加第 '+(state.selected.size+1)+' 件':'点击前往结账'],checkout:[state.selected.size===1?'.add-item-link':'[data-action="pay"]',state.selected.size===1?'点击原地补选':'点击模拟支付'],success:['.receipt .primary',state.receipt?.earned?'点击查看优惠券':'点击回到首页']}[state.page];}
function guideKey(){return [state.page,state.page==='venue'?state.variant:'',[...state.selected].sort().join(','),state.overlay||'',state.draft?[...state.draft].sort().join(','):'',state.receipt?.earned?'earned':''].join('|');}
function hideCoach(){screen.querySelector('.onboarding-focus')?.remove();}
function guideIsBusy(){if(state.spinning||state.paying||state.overlay&&dragStart||$('.rules-modal'))return true;if(liveAnimations.size)return true;return app.getAnimations({subtree:true}).some(a=>{const t=a.effect?.getComputedTiming();return t&&Number.isFinite(t.endTime)&&(a.pending||a.playState==='running');});}
function scheduleCoach(force=false){
 if(force)lastGuideKey='';
 clearTimeout(coachTimer);if(!guidanceEnabled||state.spinning||state.paying||$('.rules-modal')){hideCoach();return;}
 const key=guideKey();if(!force&&key===lastGuideKey)return;
 hideCoach();guideQuietSince=performance.now();
 const wait=()=>{if(!guidanceEnabled||key!==guideKey())return;if(guideIsBusy()){guideQuietSince=performance.now();coachTimer=setTimeout(wait,100);return;}if(performance.now()-guideQuietSince<140){coachTimer=setTimeout(wait,150);return;}showCoach();};
 coachTimer=setTimeout(wait,450);
}
function positionGuide(mark,target){
 if(!target?.isConnected)return false;
 const r=target.getBoundingClientRect(),s=screen.getBoundingClientRect(),scale=s.width/390;
 let left=Math.max(r.left,s.left),right=Math.min(r.right,s.right),top=Math.max(r.top,s.top+45*scale),bottom=Math.min(r.bottom,s.bottom-25*scale);
 const clip=target.closest('.activity-scroll,.checkout-body,.bag-items');if(clip){const c=clip.getBoundingClientRect();top=Math.max(top,c.top);bottom=Math.min(bottom,c.bottom);}
 if(right-left<4||bottom-top<4)return false;
 Object.assign(mark.style,{left:(left-s.left)/scale+'px',top:(top-s.top)/scale+'px',width:(right-left)/scale+'px',height:(bottom-top)/scale+'px',borderRadius:Math.max(6,parseFloat(getComputedStyle(target).borderRadius)||0)+'px'});return true;
}
function showCoach(){
 if(!guidanceEnabled||guideIsBusy())return;
 const [selector,label]=clickTarget(),target=$(selector);if(!target||target.disabled)return;
 const mark=document.createElement('div');mark.className='onboarding-focus';mark.setAttribute('aria-hidden','true');
 if(!positionGuide(mark,target))return;
 hideCoach();mark.dataset.target=selector;screen.appendChild(mark);lastGuideKey=guideKey();
 $('#onboarding-status').textContent=label+'。按高亮区域操作即可继续。';
 mark.addEventListener('animationend',()=>mark.remove(),{once:true});
}
function hint(){
 guidanceEnabled=true;$('#toggle-onboarding').textContent='关闭引导';$('#toggle-onboarding').setAttribute('aria-pressed','true');
 const [selector]=clickTarget(),el=$(selector);if(!el)return;
 const scroller=el.closest('.activity-scroll,.checkout-body,.bag-items');if(scroller){const a=el.getBoundingClientRect(),b=scroller.getBoundingClientRect(),scale=screen.getBoundingClientRect().width/390;if(a.bottom>b.bottom||a.top<b.top)scroller.scrollTop+=(a.top-b.top)/scale-scroller.clientHeight/2;}
 scheduleCoach(true);
}
function repositionGuide(){const mark=screen.querySelector('.onboarding-focus');if(mark&&!positionGuide(mark,$(mark.dataset.target)))mark.remove();}

function guideNext(){if(state.overlay==='retention'){retentionPrimary();return;}if(state.overlay==='picker'){if(state.draft.size>state.selected.size)confirmPicker();else toggleDraft(products.find(p=>!state.selected.has(p.id)&&p.id!==state.purchased).id);return;}if(state.overlay==='bag'){if(eligibleCount()<2)locateProducts();else go('checkout');return;}if(state.page==='checkout'&&eligibleCount()===1){openPicker();return;}if(state.page==='home')go('venue');else if(state.page==='spin')spin();else if(state.page==='offer')go('venue');else if(state.page==='venue'){const p=products.find(p=>!state.selected.has(p.id)&&p.id!==state.purchased);if(eligibleCount()<2&&p)add(p.id);else go('checkout');}else if(state.page==='checkout')pay();else if(state.page==='success'){if(state.receipt?.earned)finishFlow();else resumePurchase();}else reset();}
app.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const action=b.dataset.action;if(action==='close-layer')closeLayer();else if(action==='open-picker')openPicker();else if(action==='locate-products')locateProducts();else if(action==='picker-add')toggleDraft(Number(b.dataset.id));else if(action==='confirm-picker')confirmPicker();else if(action==='back')back();else if(action==='close-offer')closeOffer();else if(action==='continue-shopping'){state.history=[];commitPage('home',{remember:false});}else if(['home','venue'].includes(action))go(action);else if(action==='spin')spin();else if(action==='add')add(Number(b.dataset.id),b);else if(action==='remove')remove(Number(b.dataset.id));else if(action==='checkout'){if(state.selected.size)go('checkout');}else if(action==='pay')pay();else if(action==='rules')rules();else if(action==='close-rules')closeRules();else if(action==='bag')openBag();else if(action==='finish')finishFlow();else if(action==='reset')reset();});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||!b.matches('.primary,.checkout-cta,.add-button,.guide-next'))return;const r=b.getBoundingClientRect();const ripple=document.createElement('span');ripple.className='ripple';const size=Math.max(r.width,r.height);Object.assign(ripple.style,{width:size+'px',height:size+'px',left:(e.clientX-r.left-size/2)+'px',top:(e.clientY-r.top-size/2)+'px'});b.classList.add('ripple-host');b.appendChild(ripple);setTimeout(()=>ripple.remove(),600);});
$('#guide-next').addEventListener('click',guideNext);$('#reset').addEventListener('click',reset);$('#entry-spin').addEventListener('click',()=>go('spin'));$('#entry-offer').addEventListener('click',()=>go('offer'));$('#locate').addEventListener('click',hint);
$('#toggle-onboarding').addEventListener('click',()=>{guidanceEnabled=!guidanceEnabled;$('#toggle-onboarding').textContent=guidanceEnabled?'关闭引导':'开启引导';$('#toggle-onboarding').setAttribute('aria-pressed',String(guidanceEnabled));clearTimeout(coachTimer);hideCoach();if(guidanceEnabled)scheduleCoach(true);});
document.querySelectorAll('[data-variant]').forEach(b=>b.addEventListener('click',()=>{state.variant=b.dataset.variant;if(state.page==='venue'){rememberScroll();clearAsync();render();}else updateGuides();}));
$('#journey').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(!b)return;const i=+b.dataset.step;if(i===0)go('home');if(i===1)go('spin');if(i===2)go('offer');if(i===3)go('venue');if(i===4){if(eligibleCount()>=2)go('venue');else{go('venue');toast('Pick 2 items to reach this step');}}if(i===5){if(state.selected.size)go('checkout');else{go('venue');toast('Choose an item before checkout');}}if(i===6){if(state.receipt)go('success');else toast('Complete demo payment to receive your reward');}});
app.addEventListener('change',e=>{if(e.target.name==='payment-method')state.paymentMethod=e.target.value;});
let dragStart=null;
app.addEventListener('pointerdown',e=>{const handle=e.target.closest('[data-drag-handle],.sheet-heading');if(!handle||e.target.closest('button'))return;dragStart={y:e.clientY,id:e.pointerId,sheet:handle.closest('.picker-sheet,.bag-sheet')};handle.setPointerCapture(e.pointerId);hideCoach();});
app.addEventListener('pointermove',e=>{if(!dragStart||e.pointerId!==dragStart.id)return;const distance=Math.max(0,e.clientY-dragStart.y)/(screen.getBoundingClientRect().width/390);dragStart.sheet.style.transform='translateY('+distance+'px)';});
app.addEventListener('pointerup',e=>{if(!dragStart||e.pointerId!==dragStart.id)return;if(e.clientY-dragStart.y>65)closeLayer();else{dragStart.sheet.style.transition='transform .25s ease-in-out';dragStart.sheet.style.transform='';scheduleCoach();}dragStart=null;});
app.addEventListener('pointercancel',()=>{if(dragStart){dragStart.sheet.style.transform='';dragStart=null;scheduleCoach();}});
app.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const modal=app.querySelector('.retention-card,.layer-modal,.rules-modal,.overlay');if(!modal)return;const items=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href],[role=button][tabindex="0"]')];const first=items[0],last=items.at(-1);if(e.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){e.preventDefault();first?.focus();}});
document.querySelectorAll('[data-audience]').forEach(b=>b.addEventListener('click',()=>{state.audience=b.dataset.audience;clearTimeout(pushTimer);updateGuides();scheduleOffer();}));
window.addEventListener('resize',()=>requestAnimationFrame(repositionGuide));app.addEventListener('scroll',()=>{repositionGuide();scheduleCoach();},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')back();});
// Native Back closes transient layers or returns through the in-phone flow.
history.replaceState({temu:true},'');history.pushState({temu:true},'');
window.addEventListener('popstate',()=>{if(state.page==='home'&&!$('.rules-modal')&&!state.overlay){clearAsync();return;}back();history.pushState({temu:true},'');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(pushTimer);else scheduleOffer();});
render();scheduleOffer();
