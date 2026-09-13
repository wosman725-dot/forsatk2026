(() => {
  const form = document.getElementById('requestForm');
  const statusBox = document.getElementById('status');
  const cfg = window.forsatkSupabaseConfig || {};
  const configured = cfg.url && cfg.anonKey && !cfg.url.includes('YOUR_') && !cfg.anonKey.includes('YOUR_');
  const show = (message, ok=false) => { statusBox.textContent = message; statusBox.className = `status ${ok ? 'ok' : 'err'}`; };
  const makeRequestId = () => `FST-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase()}`;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!configured) { show('قاعدة البيانات لم يتم ربطها بعد. ضع Supabase URL و Anon Key في supabase-client.js.'); return; }
    const fd = new FormData(form);
    const requestId = makeRequestId();
    const payload = {
      request_id: requestId,
      name: String(fd.get('name')).trim(), phone: String(fd.get('phone')).trim(),
      email: String(fd.get('email')).trim(), request_type: String(fd.get('request_type')),
      country: String(fd.get('country')).trim(), message: String(fd.get('message') || '').trim(),
      status: 'NEW', payment_status: 'NOT_STARTED'
    };
    const button = form.querySelector('button'); button.disabled = true; button.textContent = 'جاري إنشاء الطلب...';
    try {
      const r = await fetch(`${cfg.url.replace(/\/$/,'')}/rest/v1/requests`, {
        method:'POST', headers:{'Content-Type':'application/json','apikey':cfg.anonKey,'Authorization':`Bearer ${cfg.anonKey}`,'Prefer':'return=minimal'}, body:JSON.stringify(payload)
      });
      if (!r.ok) { let detail=''; try{detail=await r.text()}catch{} throw new Error(detail || `HTTP ${r.status}`); }
      form.reset(); form.querySelector('[name="country"]').value='مصر';
      show(`تم إنشاء طلبك بنجاح. رقم الطلب: ${requestId} — احتفظ بهذا الرقم للمتابعة.`, true);
    } catch(err) { console.error(err); show('تعذر حفظ الطلب الآن. تأكد من إعداد Supabase وRLS ثم جرّب مرة أخرى.'); }
    finally { button.disabled=false; button.textContent='إنشاء الطلب / Create Request'; }
  });
})();
