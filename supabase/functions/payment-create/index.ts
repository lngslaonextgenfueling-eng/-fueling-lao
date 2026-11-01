// POST /functions/v1/payment-create
// body: { purpose: 'order', orderId: string } | { purpose: 'topup', amount: number }
// ສ້າງລາຍການຈ່າຍເງິນ + QR ຂອງ BCEL OnePay ໃຫ້ລູກຄ້າສະແກນດ້ວຍແອັບ BCEL One.
import { adminClient, corsHeaders, getCaller, json, paymentMode } from '../_shared/common.ts';
import { buildOnePayQr } from '../_shared/onepay.ts';

const MIN_TOPUP = 10_000;
const MAX_TOPUP = 10_000_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  const caller = await getCaller(req);
  if (!caller) return json({ error: 'NOT_AUTHENTICATED' }, 401);

  let body: { purpose?: string; orderId?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'BAD_JSON' }, 400);
  }

  const db = adminClient();
  let amount: number;
  let orderId: string | null = null;
  let description: string;

  if (body.purpose === 'order') {
    const { data: order } = await db
      .from('orders')
      .select('id, customer_id, amount, discount, payment_method, payment_status, status, expires_at')
      .eq('id', body.orderId ?? '')
      .maybeSingle();
    if (!order || order.customer_id !== caller.id) return json({ error: 'ORDER_NOT_FOUND' }, 404);
    if (order.payment_method !== 'one_pay' || order.payment_status !== 'pending' || order.status !== 'pending') {
      return json({ error: 'ORDER_NOT_PAYABLE' }, 409);
    }
    if (new Date(order.expires_at).getTime() <= Date.now()) return json({ error: 'ORDER_EXPIRED' }, 409);
    amount = order.amount - order.discount;
    orderId = order.id;
    description = `FUEL ${order.id}`;

    // ໃຊ້ QR ເກົ່າຄືນ ຖ້າຍັງບໍ່ໝົດອາຍຸ (ກັນສ້າງຊ້ຳເມື່ອເປີດໜ້າຈໍໃໝ່)
    const { data: existing } = await db
      .from('payments')
      .select('id, qr_string, amount, created_at')
      .eq('order_id', order.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      return json({ paymentId: existing.id, qrString: existing.qr_string, amount: existing.amount, mode: paymentMode() });
    }
  } else if (body.purpose === 'topup') {
    amount = Math.round(Number(body.amount));
    if (!Number.isFinite(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
      return json({ error: 'BAD_AMOUNT', min: MIN_TOPUP, max: MAX_TOPUP }, 400);
    }
    description = 'WALLET TOPUP';
  } else {
    return json({ error: 'BAD_PURPOSE' }, 400);
  }

  const { data: payment, error } = await db
    .from('payments')
    .insert({ purpose: body.purpose, order_id: orderId, user_id: caller.id, amount, provider: 'one_pay' })
    .select('id, invoice_no')
    .single();
  if (error || !payment) return json({ error: 'DB_ERROR', detail: error?.message }, 500);

  let qrString: string;
  try {
    qrString =
      paymentMode() === 'onepay'
        ? buildOnePayQr({ amountKip: amount, invoiceId: payment.invoice_no, description })
        : `SANDBOX:${payment.invoice_no}:${amount}`;
  } catch (e) {
    return json({ error: 'ONEPAY_NOT_CONFIGURED', detail: String(e) }, 500);
  }

  await db.from('payments').update({ qr_string: qrString }).eq('id', payment.id);
  return json({ paymentId: payment.id, qrString, amount, mode: paymentMode() });
});
