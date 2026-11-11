/* Canonical Pencil geometry. Native DOM text and controls; exported image/icon leaves. */
const catalogueKeys=['pants','cloth','cable','light','belts','tent','scraper','lounge'];
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function pencilTree(id){const rows=structuredClone(PENCIL.screens[id]),map=new Map(rows.map(e=>[e.node.id,{...e,children:[]}]));for(const e of map.values())if(e.parent)map.get(e.parent)?.children.push(e);return map.get(id);}
function pencilStyle(e){const n=e.node,b=e.bounds,css={position:'absolute',left:(e.depth?b.x:0)+'px',top:(e.depth?b.y:0)+'px',width:b.width+'px',height:b.height+'px',boxSizing:'border-box',margin:0,padding:0};
 if(n.enabled===false)css.display='none';if(n.opacity!=null)css.opacity=n.opacity;if(n.clip)css.overflow='hidden';
 const r=n.cornerRadius;if(r!=null)css.borderRadius=(Array.isArray(r)?r.map(x=>x+'px').join(' '):r+'px');if(n.type==='ellipse')css.borderRadius='50%';
 if(n.type==='text'){Object.assign(css,{fontFamily:`'${n.fontFamily||'Inter'}',sans-serif`,fontSize:(n.fontSize||14)+'px',fontWeight:n.fontWeight||400,lineHeight:n.lineHeight||1.2,color:typeof n.fill==='string'?n.fill:'#000',whiteSpace:!n.textGrowth||n.textGrowth==='auto'?'pre':'pre-wrap',textAlign:n.textAlign||'left',letterSpacing:(n.letterSpacing||0)+'px'});}
 else if(typeof n.fill==='string'&&n.type!=='icon')css.background=n.fill;
 else if(n.fill?.type==='gradient'&&n.type==='frame')css.background=`linear-gradient(${n.fill.rotation||0}deg,${n.fill.colors.map(c=>c.color+' '+c.position*100+'%').join(',')})`;
 else if(n.fill?.type==='image'&&n.type==='frame')Object.assign(css,{backgroundImage:`url('assets/raw/${n.fill.url}')`,backgroundSize:n.fill.mode==='stretch'?'100% 100%':n.fill.mode==='contain'?'contain':'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat'});
 if(n.stroke&& !PENCIL_ASSETS[n.id]){const color=typeof n.stroke==='string'?n.stroke:n.stroke.fill||'#ddd',sw=n.strokeWidth||1;if(typeof sw==='number')css.boxShadow=`inset 0 0 0 ${sw}px ${color}`;else{css.borderStyle='solid';css.borderColor=color;css.borderWidth=['top','right','bottom','left'].map(k=>(sw[k]||0)+'px').join(' ');}}
 return css;}
function cssString(o){return Object.entries(o).map(([k,v])=>k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+':'+v).join(';');}
function wheelArtwork(id,style){
 const cx=307.52,cy=311.24,r=274,src='assets/pencil/MPmnK.png';
 return `<div class="pnode wheel-wrap${state.spinning?' spinning':''}" data-node="${id}" style="${style}">
 <svg class="wheel-composite" viewBox="0 0 620 620" aria-label="Coupon wheel with fixed pointer" role="img">
 <defs>
  <clipPath id="wheel-disc-clip"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
  <mask id="wheel-rim-mask"><rect width="620" height="620" fill="white"/><circle cx="${cx}" cy="${cy}" r="${r-.5}" fill="black"/></mask>
  <clipPath id="wheel-pointer-repair"><path d="M307 174 Q312 174 318 183 L345 238 L270 238 L298 183 Q302 174 307 174Z"/></clipPath>
  <clipPath id="wheel-fixed-clip"><circle cx="${cx}" cy="${cy}" r="86.18"/><path d="M284.58 230.02 L303.18 185.38 Q308.76 176.7 313.72 188.48 L333.56 226.92 Q335.42 233.12 327.36 233.12 L289.54 233.12 Z"/></clipPath>
 </defs>
 <g class="wheel-disc" clip-path="url(#wheel-disc-clip)"><image href="${src}" width="620" height="620"/><g clip-path="url(#wheel-pointer-repair)"><svg x="270" y="174" width="75" height="64" viewBox="268 174 10 64" preserveAspectRatio="none"><image href="${src}" width="620" height="620"/></svg></g></g>
 <image class="wheel-fixed-rim" href="${src}" width="620" height="620" mask="url(#wheel-rim-mask)"/>
 <image class="wheel-fixed-center" href="${src}" width="620" height="620" clip-path="url(#wheel-fixed-clip)"/>
 </svg><button class="spin-center" data-action="spin" aria-label="Spin to reveal offer">SPIN</button></div>`;
}
function pencilMarkup(id,{dynamic=true,context='',overlayOnly=false}={}){
 const root=pencilTree(id),selected=state.overlay==='picker'?(state.draft||state.selected):state.selected;

 if(overlayOnly){root.children=root.children.filter(e=>context==='retention'?(e.node.name==='退出挽留遮罩'||e.node.name?.startsWith('挽留弹窗｜')):context==='bag'?(e.node.name==='背景遮罩'||e.node.name?.includes('活动购物车半屏')):context==='picker'?(e.node.name?.startsWith('半弹窗遮罩')||e.node.name?.startsWith('支付页内选品')):false);root.node.fill='transparent';}
 if(dynamic&&id==='p02eQk'&&state.selected.size){
  // Preserve the purchased screen; only replace the unpaid slot and checkout footer.
  const ready=pencilTree('K6snwU');
  const find=(e,name)=>e.node.name===name?e:e.children.map(c=>find(c,name)).find(Boolean);
  const progress=find(root,'已选商品进度｜6px间距');
  const next=find(ready,'商品进度位 1');
  if(progress&&next)progress.children[1]=structuredClone(next);
  const footerIndex=root.children.findIndex(e=>e.node.name.startsWith('统一底栏'));
  root.children[footerIndex]=structuredClone(ready.children.find(e=>e.node.name.startsWith('统一底栏')));
  const hint=find(root,'进度提示');if(hint)hint.node.content='Your first purchase counts. Pay for 1 more.';
 }
 if(dynamic){
 const picks=[...(state.purchased!=null?[state.purchased]:[]),...selectedUnits()];
 if(context==='bag'&&state.selected.size>2){const extend=e=>{if((e.node.name||'').startsWith('购物车商品列表')){const template=e.children.at(-1);for(let i=2;i<state.selected.size;i++){const copy=structuredClone(template);copy.bounds.y=i*121;copy.node.name=`购物车商品${i+1}｜图文与数量`;e.children.push(copy);}e.bounds.height=221;e.node.clip=true;e.node.scrollCart=true;}e.children.forEach(extend);};extend(root);}
 const candidates=products.filter(p=>!state.selected.has(p.id));let candidateIndex=0;const recommendation=candidates.find(p=>p.id===1)||candidates[0];
 function walk(e,product=null){const name=e.node.name||'';
 if(context==='retention'&&name==='解释'&&state.purchased!=null&&eligibleCount()>=2)e.node.content='Your first purchase counts. Pay for this item\nto receive your $300 coupon bundle.';
 if(context==='venue'&&name==='活动导航')e.node.content=eligibleCount()>=2?'Pay to unlock coupons.':'Buy 2. Unlock more.';
 if(context==='bag'&&recommendation){if(name==='推荐名称')e.node.content=recommendation.name;if(name==='推荐价格')e.node.content='$'+recommendation.price.toFixed(2);if(name==='第二件商品图')e.node.assetOverride=recommendation.img;if(name==='Add')e.recommendationId=recommendation.id;}
 if(context==='picker'&&name.startsWith('选品商品卡｜')){product=candidates[candidateIndex++];if(product)e.node.name='选品商品卡｜'+catalogueKeys[product.id];}
 if(name.startsWith('购物车商品')&&name.includes('图文')){const i=Number(name.match(/商品(\d)/)?.[1]||1)-1;product=products[[...state.selected][i]];if(product)product={...product,preserveAsset:product.id===i};e.productId=product?.id;if(!product)e.node.enabled=false;}
 if(product){if(name==='商品名称')e.node.content=product.name;if(['商品价格','价格'].includes(name))e.node.content='$'+product.price.toFixed(2);if(name==='商品头图'||name==='商品实拍贴图'&&!product.preserveAsset)e.node.assetOverride=product.img;}
 if(name==='原订单商品'&&[...state.selected][0]!==0)e.node.assetOverride=products[[...state.selected][0]]?.img;
 if(name==='已购买商品'&&state.receipt?.items[0]!==0)e.node.assetOverride=products[state.receipt?.items[0]]?.img;
 if(name==='已买商品')e.node.content=products[state.receipt?.items[0]]?.name||e.node.content;
 if(context==='bag'&&eligibleCount()>=2&&state.selected.size){if(name==='横幅条件文案')e.node.content='Pay to receive';if(name.startsWith('加一件入口'))e.node.enabled=false;}
 if(name==='支付状态')e.node.content=`Paid $${state.receipt?.total||'15.69'} · 1 eligible item`;
 if(/^已选商品[12]头图/.test(name)){const i=Number(name[4])-1;const p=products[picks[i]];if(p)e.node.assetOverride=p.img;}
 e.children.forEach(c=>walk(c,product));}walk(root);
 }
 function paint(e,anc=[]){const n=e.node,name=n.name||'',b=e.bounds;if(n.enabled===false||name==='默认支付方式｜Apple Pay'||(n.type==='frame'&&!n.fill&&e.children.length>0&&e.children.every(c=>c.node.enabled===false)))return '';let css=pencilStyle(e),attrs='',classes=['pnode'],action='',pid=null,content=n.content||'',children=e.children;const card=anc.findLast(a=>/^(商品卡|选品商品卡)｜/.test(a.node.name||''));if(card)pid=catalogueKeys.indexOf(card.node.name.split('｜')[1]);
 if(/^(商品卡|选品商品卡)｜/.test(name)){pid=catalogueKeys.indexOf(name.split('｜')[1]);attrs+=` data-product="${pid}"`;classes.push('product');}
 if(name==='数量'&&context==='bag'&&dynamic){const item=anc.findLast(a=>a.productId!=null);content=`−    ${state.quantities?.[item?.productId]||1}    +`;}
 if(name==='商品头图')classes.push('product-photo');
 if(context==='venue'&&name==='300美元金色券面｜同步A05')classes.push('venue-coupon');
 if(name==='数量步进器｜紧凑内边距'&&context==='bag'){const item=anc.findLast(a=>a.productId!=null);if(item){action='cart-quantity';attrs+=` data-id="${item.productId}"`;}}
 if(name==='商品选择'&&context==='bag'){const item=anc.findLast(a=>a.productId!=null);if(item){action='remove';attrs+=` data-id="${item.productId}"`;}}
 if(/^商品[12]圆形头图/.test(name)){const i=Number(name[2])-1;attrs+=` id="slot-${i}"`;if(dynamic&&selectedUnits()[i]!=null){action='remove-unit';attrs+=` data-id="${selectedUnits()[i]}"`;}}
 if(n.scrollCart){css.overflow='auto';classes.push('cart-items-scroll');}
 if(name.startsWith('会场商品列表视口')){classes.push('activity-scroll','products-section');css.overflow='auto';}
 if(name.startsWith('半弹窗商品视口')){css.overflow='auto';classes.push('picker-grid-scroll');}
 if(name.startsWith('统一底栏')||name.startsWith('底部固定结账栏'))classes.push('checkout-bar');
 if(name.includes('轻挽留横幅')||name.includes('领券确认横幅'))classes.push('benefit-banner');
 if(name==='用户提供的支付页面贴图')classes.push('payment-source');
 if(name.startsWith('支付页面裁剪')||name.includes('支付页面内容')||name==='真实支付页｜地址与支付方式')classes.push('checkout-body');
 if(name==='商品选择按钮'){
  const on=selected.has(pid);
  action=context==='picker'?'picker-add':on?'remove':'add';classes.push('add-button');attrs+=` data-id="${pid}"`;
  if(dynamic){
   css.border='none';css.background=on?'#FFFFFF':'#FF7900';css.boxShadow=on?'inset 0 0 0 1px #DCDCDC':'none';if(on)classes.push('added');
   const t=structuredClone(children.find(c=>c.node.type==='text'));children=[t];
   if(on){
    const source=PENCIL.screens[context==='picker'?'EVjZY':'BXFwP'],title=source.find(c=>c.node.content===(context==='picker'?'Selected':'Added'));
    t.node.content=title.node.content;t.node.fill='#555555';t.bounds={...title.bounds};
    const cross=structuredClone(source.find(c=>c.parent===title.parent&&c.node.name==='已加购移除图标'));
    cross.children=[];children.push(cross);
   }else{
    t.node.content=context==='picker'?'Add':'Add to pair';t.node.fill='#FFFFFF';t.bounds.x=context==='picker'?74:52;t.bounds.width=context==='picker'?26:70;
   }
  }
 }
 if(/^移除商品 [12]$/.test(name)){
  const i=Number(name.slice(-1))-1,chosen=selectedUnits()[i];if(chosen!=null){action='remove-unit';attrs+=` data-id="${chosen}"`;classes.push('item-remove');}
 }
 if(name==='移除商品标记'){
  const slot=anc.findLast(a=>a.node.name?.startsWith('商品进度位 ')),i=Number(slot?.node.name.slice(-1));
  const chosen=[...(state.purchased!=null?[state.purchased]:[]),...selectedUnits()][i];
  if(state.purchased!=null&&i===0)n.assetOverride=PENCIL_ASSETS['G5ZlLB'];
  if(chosen!=null&&!(state.purchased!=null&&i===0)){action='remove-unit';attrs+=` data-id="${chosen}"`;classes.push('item-remove');}
 }

 if(name==='返回')action='back';if(name==='规则入口'){action='rules';classes.push('rules');}if(name.startsWith('活动购物车入口')){action='bag';classes.push('nav-bag');}
 if(name.startsWith('Checkout｜')){
  action=context==='checkout'?'pay':'checkout';classes.push('checkout-cta');
  if(dynamic){
   const level=!state.selected.size?'disabled':eligibleCount()<2?'secondary':'primary';
   attrs+=` data-cta-level="${level}"`;
   css.background=level==='primary'?'#FF7900':'#EEEEEE';
   css.color=level==='primary'?'#FFFFFF':level==='secondary'?'#333333':'#B8B8B8';
   if(level==='disabled')attrs+=' disabled aria-disabled="true"';
  }
 }
 if(dynamic&&name==='Checkout按钮文字')css.color=!state.selected.size?'#B8B8B8':eligibleCount()<2?'#333333':'#FFFFFF';
 if(name.startsWith('加一件入口')){action=context==='checkout'?'open-picker':'locate-products';classes.push('add-item-link');}
 if(name.startsWith('商品进度位 ')){const i=+name.slice(-1);attrs+=` id="slot-${i}"`;const chosen=[...(state.purchased!=null?[state.purchased]:[]),...selectedUnits()][i];if(chosen!=null&&!(state.purchased!=null&&i===0)&&dynamic){action='remove-unit';attrs+=` data-id="${chosen}"`;}}
 if(name==='已选商品缩略图'&&dynamic){const slot=anc.at(-1)?.node.name;const i=+(slot?.slice(-1)||0),p=products[[...(state.purchased!=null?[state.purchased]:[]),...selectedUnits()][i]];if(p&&p.id!==i)n.assetOverride=p.img;}
 if(dynamic&&['实付金额','合计金额','商品合计金额','商品金额'].includes(name))content='$'+money();
 if(dynamic&&name==='购物车标题')content=`Your activity bag (${selectedUnits().length})`;
 if(name.includes('遮罩')&&['bag','picker','retention'].includes(context))action='close-layer';
 if(name.includes('关闭'))action=['spin','offer'].includes(context)?'close-offer':context==='retention'?'retention-dismiss':context==='success'?'continue-shopping':'close-layer';
 if(name==='首页入口Banner｜柔金丝绸氛围'){action='venue';classes.push('home-hotspot');}
 const label=e.children.map(c=>c.node.content||'').join('');
 if(n.type==='frame'&&label==='Reveal my offer'){action='spin';classes.push('primary');}
 if(n.type==='frame'&&label==='Choose my 2 items'){action='venue';classes.push('primary');}
 if(content==='Maybe later')action='close-offer';
 if(name==='原创七分区金色转盘｜生成资产')return wheelArtwork(n.id,cssString(css));
 if(name.startsWith('半屏选品')||n.id==='BydDd'||n.id==='zO7Ze')classes.push('picker-sheet');
 if(name.includes('活动购物车半屏'))classes.push('bag-sheet');
 if(name.includes('拖动条')||name.includes('拖拽'))attrs+=' data-drag-handle="true"';
 if(label==='Explore eligible items'){action='locate-products';classes.push('primary');}
 if(name==='Add'&&context==='bag'&&e.recommendationId!=null){action='bag-add';attrs+=` data-id="${e.recommendationId}"`;}
 if(context==='picker'&&n.type==='frame'&&/Back to checkout|Confirm item/.test(label)){action=state.draft.size>state.selected.size?'confirm-picker':'close-layer';classes.push('picker-confirm');if(action==='confirm-picker')classes.push('primary');}
 if(context==='picker'&&dynamic&&/^Confirm item/.test(content))content=`Confirm item · $${products.filter(p=>selected.has(p.id)).reduce((t,p)=>t+p.price,0).toFixed(2)}`;
 if(context==='success'&&n.type==='frame'&&label==='Done'){action='finish';classes.push('primary');}
 if(context==='success'&&n.type==='frame'&&label==='Choose my second item'){action='resume-purchase';classes.push('primary');}
 if(content==='Continue browsing')action='continue-shopping';if(content.startsWith('View order'))action='view-order';
 if(context==='retention'){
  if(n.type==='frame'&&['Choose my 2 items','Add one more item','Checkout','Continue payment'].includes(label)){action='retention-primary';classes.push('primary');}
  if(name==='次要操作'||name==='继续单件'){action='retention-secondary';if(state.page==='venue'&&state.purchased!=null&&!state.selected.size)content='Leave activity';}
  if(name==='退出挽留遮罩')action='retention-dismiss';
  if(name.startsWith('挽留弹窗｜')){classes.push('retention-card');attrs+=' role="dialog" aria-modal="true" aria-label="Keep your coupon offer"';}
  if(['一小时倒计时｜MM:SS:CC','两小时倒计时｜HH:MM:SS'].includes(name))attrs+=' role="timer" aria-live="off" aria-label="Time remaining"';
  const part={'倒计时分钟数值':'minutes','倒计时秒钟数值':'seconds','倒计时百分秒数值':'centiseconds','小时数值':'minutes','分钟数值':'seconds','秒钟数值':'centiseconds'}[name];
  if(part){classes.push('countdown-digit');attrs+=` data-clock-part="${part}"`;}
 }
 if(anc.some(a=>['真实支付底页面｜同步单件横幅结账'].includes(a.node.name)))action='';
 if(action)attrs+=` data-action="${action}" role="button" tabindex="0" aria-label="${escapeHTML(['remove','remove-unit'].includes(action)?'Remove '+(products[Number(attrs.match(/data-id="(\d+)"/)?.[1])]?.name||'item'):action==='picker-add'&&selected.has(pid)?'Remove '+products[pid]?.name:label||content||name)}"`;
 let inside=n.type==='text'?escapeHTML(content):'';
 const asset=n.assetOverride||PENCIL_ASSETS[n.id];if(asset&&n.type!=='frame')inside=`<img class="pencil-leaf" style="${n.type==='icon'&&ICON_BOUNDS[asset]?`width:${ICON_BOUNDS[asset][0]}px;height:${ICON_BOUNDS[asset][1]}px;left:${(b.width-ICON_BOUNDS[asset][0])/2}px;top:${(b.height-ICON_BOUNDS[asset][1])/2}px`:""}" draggable="false" src="${asset}" alt="${escapeHTML(name)}">`;
 inside+=children.map(c=>paint(c,[...anc,e])).join('');
 return `<div class="${classes.join(' ')}" data-node="${n.id}" data-name="${escapeHTML(name)}"${attrs} style="${cssString(css)}">${inside}</div>`;
 }
 return `<section class="pencil-screen ${context==='spin'||context==='offer'?'overlay':context==='success'?'receipt':''}" data-source="${id}">${paint(root)}</section>`;
}
function sourceScreen(ignoreOverlay=false){const n=Math.min(2,eligibleCount());if(!ignoreOverlay&&state.overlay==='retention')return RETENTION_SCREENS[retentionKey()];if(!ignoreOverlay&&state.overlay==='picker')return state.draft.size>state.selected.size?'EVjZY':'KLcTy';if(!ignoreOverlay&&state.overlay==='bag')return ['m857uC','U1DDl','Q4gOYM'][state.selected.size?n:0];if(state.page==='venue')return state.purchased!=null?'p02eQk':(state.variant==='progress'?['mYcG3','y4aaM1','IFgre']:['azMNM','BXFwP','K6snwU'])[n];return {home:'tLlRx',spin:'qwySl',offer:'YEZ8T',checkout:n>=2?'m3p8J':'wQch0',success:state.receipt?.earned?'y6RQ6':'M1YRw'}[state.page];}
function render(){screen.classList.remove('auto-offer');screen.classList.toggle('is-modal',['spin','offer'].includes(state.page));screen.style.setProperty('--host-status-bg',['spin','offer'].includes(state.page)?'#28241d':state.overlay==='retention'?(state.page==='venue'?'color-mix(in srgb, #18120B 76.8627%, #FFF4DA)':'color-mix(in srgb, #18120B 76.8627%, #FFFFFF)'):state.overlay==='picker'?'#999999':state.overlay==='bag'?'#bfb7a3':state.page==='home'?'#FFF9EC':state.page==='venue'?'#FFF4DA':'#FFFFFF');const id=sourceScreen();
 if(['retention','bag','picker'].includes(state.overlay)){
  app.innerHTML=pencilMarkup(sourceScreen(true),{context:state.page})+pencilMarkup(id,{context:state.overlay,overlayOnly:true});
  app.firstElementChild.inert=true;app.firstElementChild.setAttribute('aria-hidden','true');
  app.lastElementChild.classList.add('layer-modal');if(state.overlay==='retention')app.lastElementChild.classList.add('retention-layer');
 }else app.innerHTML=pencilMarkup(id,{context:state.overlay||state.page});
 app.dataset.source=id;if(state.page==='venue'){const sc=$('.activity-scroll');if(sc)sc.scrollTop=state.scroll;}if(state.page==='home'&&!state.overlay)app.insertAdjacentHTML('beforeend','<button class="home-nav-hit" data-action="bag" aria-label="Open shopping cart"></button>');
 // Transparent controls retain the exact payment screenshot while making payment selection native.
 if(state.page==='checkout'){
 const paymentBody=app.querySelector('[data-name="真实支付页｜地址与支付方式"]');
 paymentBody?.insertAdjacentHTML('beforeend',['Apple Pay','Visa','PayPal','Cash App Pay','Afterpay','Klarna','Affirm','Venmo'].map((x,i)=>`<input class="payment-radio" type="radio" name="payment-method" value="${x}" aria-label="${x}" ${state.paymentMethod===x?'checked':''} ${state.overlay?'disabled':''} style="top:${[246,296,397,448,502,561,619,675][i]}px">`).join(''));
 if(!state.overlay)app.insertAdjacentHTML('beforeend','<button class="pencil-hit payment-back" data-action="back" aria-label="Go back"></button>');
 }
 updateGuides();if(state.overlay==='retention')startRetentionClock();else stopRetentionClock();}
function patchSelection(){rememberScroll();render();}
function renderLayer(){const scroll=$('.picker-grid-scroll')?.scrollTop||0;render();if($('.picker-grid-scroll'))$('.picker-grid-scroll').scrollTop=scroll;}
function closeLayer(){if(state.overlay==='retention'){dismissRetention();return;}state.overlay=null;state.draft=null;render();scheduleOffer();}
function confirmPicker(){if(state.overlay!=='picker'||state.draft.size<=state.selected.size)return;state.selected=new Set(state.draft);state.overlay=null;state.draft=null;render();toast('Item added · Pay to receive your coupons');}
function locateProducts(){state.overlay=null;state.draft=null;go('venue');state.scroll=0;$('.activity-scroll')?.scrollTo({top:0,behavior:'smooth'});hint();}
function add(id){if(state.page!=='venue'||!products[id])return;if(state.selected.has(id)){remove(id);return;}const start=$(`[data-product="${id}"] .product-photo`)?.getBoundingClientRect();rememberScroll();clearAsync();state.selected.add(id);render();const target=$('#slot-'+Math.min(1,eligibleCount()-1))||$('.checkout-cta');if(start&&target)animateProduct(id,start,target.getBoundingClientRect(),{onFinish:()=>{target.classList.add('progress-flash');scheduleCoach();}});}
function remove(id){if(!state.selected.has(id))return;rememberScroll();clearAsync();state.selected.delete(id);if(state.quantities)delete state.quantities[id];if(state.page==='checkout'&&!state.selected.size){commitPage('venue',{remember:false});return;}render();}
const originalBack=back;
back=function(){if($('.rules-modal')){closeRules();return;}if(state.overlay){closeLayer();return;}if(state.page==='checkout'&&eligibleCount()>=2&&!state.paying&&openRetention())return;originalBack();};
const originalReset=reset;reset=function(){state.purchased=null;state.quantities={};resetRetentionClock();originalReset();};
function clickTarget(){if(state.overlay==='retention')return ['[data-action="retention-primary"]',retentionCount()>=2?'点击继续结账 / 支付':'点击补选商品'];if(state.overlay==='picker')return [state.draft.size>state.selected.size?'[data-action="confirm-picker"]':'[data-action="picker-add"]','选择并确认商品'];if(state.overlay==='bag')return [eligibleCount()===1?'.bag-sheet .add-item-link':state.selected.size?'.bag-sheet .checkout-cta':'[data-action="locate-products"]','继续选品或结账'];return {home:['.home-hotspot','点击 banner 进入选品'],spin:['[data-action="spin"].primary','点击开始转盘'],offer:['[data-action="venue"].primary','点击挑选商品'],venue:[eligibleCount()<2?'.add-button:not(.added)':'.checkout-cta','点击继续'],checkout:[eligibleCount()===1?'.add-item-link':'[data-action="pay"]','点击继续'],success:['.receipt .primary','点击查看权益']}[state.page];}
app.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;if(a==='cart-quantity'){const id=Number(el.dataset.id),ratio=(e.clientX-el.getBoundingClientRect().left)/el.getBoundingClientRect().width;state.quantities||={};const count=state.quantities[id]||1;if(ratio<.36){if(count===1)remove(id);else{state.quantities[id]=count-1;render();}}else if(ratio>.64){state.quantities[id]=count+1;render();}}if(a==='bag-add'){const id=Number(el.dataset.id);if(products[id]){state.selected.add(id);render();}}if(a==='remove-unit'){const id=Number(el.dataset.id),count=state.quantities?.[id]||1;if(count>1){state.quantities[id]=count-1;render();}else remove(id);}if(a==='retention-primary')retentionPrimary();if(a==='retention-secondary')retentionSecondary();if(a==='retention-leave')leaveRetention();if(a==='retention-dismiss')dismissRetention();if(a==='resume-purchase')resumePurchase();if(a==='view-order')toast(`Order confirmed · Paid $${state.receipt?.total||money()}`);});
app.addEventListener('keydown',e=>{const el=e.target.closest('[role="button"]');if(el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();el.click();}});
// Retire the review-only preselection URL: refresh must never silently add a product.
const cleanReviewURL=new URL(location.href);
if(cleanReviewURL.searchParams.has('scene')){
 cleanReviewURL.searchParams.delete('scene');history.replaceState(history.state,'',cleanReviewURL);
}
render();
