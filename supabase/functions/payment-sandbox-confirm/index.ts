// POST /functions/v1/payment-sandbox-confirm   body: { paymentId }
// ສຳລັບທົດສອບເທົ່ານັ້ນ (PAYMENT_MODE=sandbox): ຈຳລອງວ່າລູກຄ້າຈ່າຍສຳເລັດ
// ເພື່ອທົດລອງລະບົບທັງໝົດ ກ່ອນໄດ້ສັນຍາ merchant ຈາກ BCEL.
// ເມື່ອປ່ຽນເປັນ PAYMENT_MODE=onepay, function ນີ້ຈະປະຕິເສດທຸກຄຳຂໍ.
import { adminClient, corsHeaders, getCaller, json, paymentMode } from '../_shared/common.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (paymentMode() !== 'sandbox') return json({ error: 'SANDBOX_DISABLED' }, 403);

  const caller = await getCaller(req);
  if (!caller) return json({ error: 'NOT_AUTHENTICATED' }, 401);

  const { paymentId } = await req.json().catch(() => ({}));
  const db = adminClient();
  const { data: payment } = await db.from('payments').select('id, user_id').eq('id', paymentId ?? '').maybeSingle();
  if (!payment || payment.user_id !== caller.id) return json({ error: 'PAYMENT_NOT_FOUND' }, 404);

  const { data, error } = await db.rpc('mark_payment_paid', {
    p_payment_id: payment.id,
    p_provider_ref: `SANDBOX-${Date.now()}`,
    p_raw: { sandbox: true },
  });
  if (error) return json({ error: 'DB_ERROR', detail: error.message }, 500);
  return json({ ok: true, status: data?.status });
});
