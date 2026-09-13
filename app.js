(() => {
  'use strict';
  const form=document.getElementById('requestForm');
  const msg=document.getElementById('formMessage');
  const btn=document.getElementById('submitBtn');
  const KEY='forsatk_v21_requests';
  const id=()=>`FST-${new Date().getFullYear()}-${Math.floor(10000+Math.random()*90000)}`;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function get(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
  function put(x){const a=get();a.push(x);localStorage.setItem(KEY,JSON.stringify(a));}
  form.addEventListener('submit',e=>{
    e.preventDefault(); if(!form.checkValidity()){form.reportValidity();return;}
    btn.disabled=true;btn.textContent='جاري إنشاء الطلب...';
    const d=new FormData(form), r={requestId:id(),createdAt:new Date().toISOString(),status:'NEW',paymentStatus:'NOT_STARTED',name:d.get('name').trim(),phone:d.get('phone').trim(),email:d.get('email').trim(),type:d.get('type'),country:d.get('country').trim(),message:d.get('message').trim(),consent:true};
    put(r);
    msg.className='form-message show';msg.innerHTML=`<div class="success-title">تم إنشاء طلبك بنجاح ✓</div><div>رقم الطلب: <strong>${esc(r.requestId)}</strong></div><div>الحالة: <strong>جديد</strong></div><div class="small-note">احتفظ برقم الطلب. الدفع غير مفعل في V2.1.</div>`;
    form.reset();btn.disabled=false;btn.textContent='إنشاء الطلب / Create Request';
  });
})();
