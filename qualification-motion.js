/* Qualification is a shopping milestone; only successful payment awards coupons. */
let qualificationReady=false,qualificationPage=null,qualificationPending=false;
let qualificationUntil=0,qualificationCleanup=null;
const renderBeforeQualification=render;
render=function(){
 const ready=eligibleCount()>=2;
 if(!ready){qualificationUntil=0;qualificationPending=false;}
 else if(!qualificationReady)qualificationPending=true;
 const visible=state.page==='venue'&&!state.overlay;
 if(ready&&visible&&(qualificationPending||qualificationPage!=='venue')){
  qualificationUntil=performance.now()+900;
  qualificationPending=false;
 }
 qualificationReady=ready;qualificationPage=state.page;
 renderBeforeQualification();
 clearTimeout(qualificationCleanup);
 const remaining=qualificationUntil-performance.now();
 if(!ready||!visible||remaining<=0||reduced())return;
 const coupon=app.querySelector('.venue-coupon');
 if(!coupon)return;
 coupon.style.setProperty('--qualification-delay',`${remaining-900}ms`);
 const confetti=document.createElement('div');
 confetti.className='qualification-confetti';confetti.setAttribute('aria-hidden','true');
 const colors=['#FF7858','#FFBA35','#58BFA5','#729CEB','#B887D8','#F18DB0'];
 for(let i=0;i<30;i++){
  const piece=document.createElement('i'),side=i%2?1:-1,spread=Math.floor(i/2);
  const x=side*(78+(spread%5)*10),y=-42+(spread%7)*6;
  piece.style.cssText=`--burst-x:${x}px;--burst-y:${y}px;--fall-x:${x+side*(12+spread%4*3)}px;--fall-y:${28+spread%6*6}px;--start-x:${side*48}px;--start-y:24px;--spin:${side*(180+spread*17)}deg;background:${colors[i%colors.length]};width:${i%3?4:3}px;height:${i%3?7:4}px;border-radius:${i%3?'1px':'50%'}`;
  confetti.appendChild(piece);
 }
 coupon.prepend(confetti);
 coupon.classList.add('qualification-emphasis');
 qualificationCleanup=setTimeout(()=>{coupon.classList.remove('qualification-emphasis');confetti.remove();},remaining);
};
