// POST /functions/v1/payment-webhook
// BCEL (ຫຼື server ຮັບແຈ້ງເຕືອນຂອງທ່ານ) ເອີ້ນ URL ນີ້ ເມື່ອລູກຄ້າຈ່າຍສຳເລັດ.
// ຕ້ອງສົ່ງ header "x-webhook-secret" ທີ່ກົງກັບ ONEPAY_WEBHOOK_SECRET.
// Deploy ດ້ວຍ: supabase functions deploy payment-webhook --no-verify-jwt
import { adminClient, corsHeaders, json, safeEqual } from '../_shared/common.ts';
import { extractCallback } from '../_shared/onepay.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  const expected = Deno.env.get('ONEPAY_WEBHOOK_SECRET') ?? '';
  const got = req.headers.get('x-webhook-secret') ?? '';
  if (expected.length < 16 || !safeEqual(got, expected)) return json({ error: 'UNAUTHORIZED' }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'BAD_JSON' }, 400);
  }

  const cb = extractCallback(body);
  if (!cb) return json({ error: 'BAD_CALLBACK' }, 400);

  const db = adminClient();
  const { data: payment } = await db.from('payments').select('id, amount').eq('invoice_no', cb.invoiceNo).maybeSingle();
  if (!payment) return json({ error: 'PAYMENT_NOT_FOUND' }, 404);

  // ຖ້າ callback ມີຈຳນວນເງິນ, ຕ້ອງກົງກັບທີ່ເຮົາຕັ້ງໄວ້
  if (body.amount !== undefined && Math.round(Number(body.amount)) !== Number(payment.amount)) {
    return json({ error: 'AMOUNT_MISMATCH' }, 409);
  }

  const { data, error } = await db.rpc('mark_payment_paid', {
    p_payment_id: payment.id,
    p_provider_ref: cb.providerRef,
    p_raw: body,
  });
  if (error) return json({ error: 'DB_ERROR', detail: error.message }, 500);
  return json({ ok: true, status: data?.status });
});
