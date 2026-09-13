(() => {
  const form = document.getElementById('requestForm');
  const statusBox = document.getElementById('status');
  const cfg = window.forsatkSupabaseConfig || {};

  const configured =
    cfg.url &&
    cfg.anonKey &&
    !cfg.url.includes('YOUR_') &&
    !cfg.anonKey.includes('YOUR_');

  const show = (message, ok = false) => {
    statusBox.innerHTML = message;
    statusBox.className = `status ${ok ? 'ok' : 'err'}`;
  };

  const makeRequestId = () =>
    `FST-${new Date().getFullYear()}-${crypto
      .randomUUID()
      .replaceAll('-', '')
      .slice(0, 8)
      .toUpperCase()}`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!configured) {
      show(
        'قاعدة البيانات لم يتم ربطها بعد. ضع Supabase URL و Anon Key في supabase-client.js.'
      );
      return;
    }

    const fd = new FormData(form);
    const requestId = makeRequestId();

    const payload = {
      request_id: requestId,
      name: String(fd.get('name')).trim(),
      phone: String(fd.get('phone')).trim(),
      email: String(fd.get('email')).trim(),
      request_type: String(fd.get('request_type')),
      country: String(fd.get('country')).trim(),
      message: String(fd.get('message') || '').trim(),
      status: 'NEW',
      payment_status: 'NOT_STARTED'
    };

    const button = form.querySelector('button');
    button.disabled = true;
    button.textContent = 'جاري إنشاء الطلب...';

    try {
      // 1. Create request in Supabase
      const r = await fetch(
        `${cfg.url.replace(/\/$/, '')}/rest/v1/requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': cfg.anonKey,
            'Authorization': `Bearer ${cfg.anonKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!r.ok) {
        let detail = '';
        try {
          detail = await r.text();
        } catch {}

        throw new Error(detail || `HTTP ${r.status}`);
      }

      form.reset();

      const countryField = form.querySelector('[name="country"]');
      if (countryField) {
        countryField.value = 'مصر';
      }

      // 2. Show successful request + payment button
      show(
        `
        <div>
          <strong>تم إنشاء طلبك بنجاح.</strong><br>
          رقم الطلب: <strong>${requestId}</strong><br>
          <small>احتفظ بهذا الرقم للمتابعة.</small>
          <br><br>

          <button
            type="button"
            id="payButton"
            style="
              padding:12px 20px;
              border:0;
              border-radius:8px;
              cursor:pointer;
              font-size:16px;
            "
          >
            💳 دفع رسوم الطلب — 3.65 AED
          </button>
        </div>
        `,
        true
      );

      // 3. Stripe Checkout
      const payButton = document.getElementById('payButton');

      payButton.addEventListener('click', async () => {
        payButton.disabled = true;
        payButton.textContent = 'جاري تجهيز الدفع...';

        try {
          const checkoutResponse = await fetch(
            `${cfg.url.replace(/\/$/, '')}/functions/v1/create-checkout`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': cfg.anonKey,
                'Authorization': `Bearer ${cfg.anonKey}`
              },
              body: JSON.stringify({
                request_id: requestId
              })
            }
          );

          const data = await checkoutResponse.json();

          if (!checkoutResponse.ok || !data.checkout_url) {
            throw new Error(data.error || 'تعذر إنشاء عملية الدفع');
          }

          // 4. Open Stripe Checkout
          window.location.href = data.checkout_url;

        } catch (err) {
          console.error(err);

          payButton.disabled = false;
          payButton.textContent = '💳 إعادة محاولة الدفع — 3.65 AED';

          show(
            `
            <strong>تم إنشاء الطلب:</strong> ${requestId}<br>
            لكن تعذر تجهيز الدفع حاليًا.<br>
            <small>${err.message || ''}</small>
            `,
            false
          );
        }
      });

    } catch (err) {
      console.error(err);

      show(
        'تعذر حفظ الطلب الآن. تأكد من إعداد Supabase وRLS ثم جرّب مرة أخرى.'
      );
    } finally {
      button.disabled = false;
      button.textContent = 'إنشاء الطلب / Create Request';
    }
  });
})();
