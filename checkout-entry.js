/* A single-item reminder is triggered by the payment-page Checkout action, never by rendering or entering that page. */
let checkoutEntrySeen=false;
const entryBaseRender=render;
render=function(){
 if(state.page!=='checkout'||eligibleCount()>=2)checkoutEntrySeen=false;
 entryBaseRender();
};
const paymentWithoutReminder=pay;
pay=function(){
 if(state.page!=='checkout'||state.paying||state.overlay||!state.selected.size)return;
 if(eligibleCount()===1&&!checkoutEntrySeen&&!retentionExpired()){
  checkoutEntrySeen=true;
  openRetention();
  return;
 }
 paymentWithoutReminder();
};
const checkoutReminderSecondary=retentionSecondary;
retentionSecondary=function(){
 if(state.page==='checkout'&&state.overlay==='retention'&&eligibleCount()===1){
  checkoutEntrySeen=true;
  dismissRetention();
  paymentWithoutReminder();
  return;
 }
 checkoutReminderSecondary();
};
