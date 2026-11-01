// =============================================================================
// BCEL OnePay adapter
//
// ⚠️ ສຳຄັນ: BCEL ບໍ່ມີເອກະສານ API ສາທາລະນະ. ຄ່າ tag ສະເພາະຂອງ BCEL ຂ້າງລຸ່ມ
// ຕ້ອງກວດກັບເອກະສານທີ່ທະນາຄານມອບໃຫ້ ຫຼັງເຊັນສັນຍາ merchant. ໂຄງສ້າງ QR ນີ້
// ແມ່ນມາດຕະຖານ EMVCo Merchant-Presented QR (ທີ່ QR ທະນາຄານລາວ/LAPNet ໃຊ້) ພ້ອມ
// CRC16 ຖືກຕ້ອງ — ສ່ວນທີ່ອາດຕ້ອງປ່ຽນແມ່ນ ONEPAY_* env vars ແລະ tag 33.
//
// Env vars (ຕັ້ງໃນ Supabase → Edge Functions → Secrets):
//   ONEPAY_MCID          Merchant ID ທີ່ BCEL ອອກໃຫ້ (ເຊັ່ນ mch5c2f0404102fb)
//   ONEPAY_MCC           Merchant Category Code (5541 = ປໍ້ານ້ຳມັນ)
//   ONEPAY_MERCHANT_NAME ຊື່ຮ້ານ (ພາສາອັງກິດ, ≤25 ຕົວ)
//   ONEPAY_MERCHANT_CITY ເມືອງ (ເຊັ່ນ VIENTIANE)
//   ONEPAY_AID           Application ID ຂອງ BCEL ໃນ tag 33 (ຖາມທະນາຄານ)
// =============================================================================

function tlv(tag: string, value: string): string {
  return tag + value.length.toString().padStart(2, '0') + value;
}

// CRC-16/CCITT-FALSE, ຕາມມາດຕະຖານ EMVCo
export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface OnePayQrInput {
  amountKip: number;
  invoiceId: string;     // payments.invoice_no (16 ຕົວ) — BCEL ຈະສົ່ງຄືນໃນ callback
  description: string;
}

export function buildOnePayQr({ amountKip, invoiceId, description }: OnePayQrInput): string {
  const mcid = Deno.env.get('ONEPAY_MCID');
  if (!mcid) throw new Error('ONEPAY_MCID is not configured');
  const aid = Deno.env.get('ONEPAY_AID') ?? 'BCEL';
  const mcc = Deno.env.get('ONEPAY_MCC') ?? '5541';
  const name = (Deno.env.get('ONEPAY_MERCHANT_NAME') ?? 'LNGS FUELING').slice(0, 25);
  const city = (Deno.env.get('ONEPAY_MERCHANT_CITY') ?? 'VIENTIANE').slice(0, 15);

  const merchantAccount = tlv('00', aid) + tlv('01', 'ONEPAY') + tlv('02', mcid);
  const additional = tlv('01', invoiceId.slice(0, 25)) + tlv('08', description.slice(0, 25));

  const body =
    tlv('00', '01') +                 // payload format
    tlv('01', '12') +                 // 12 = dynamic QR (ໃຊ້ໄດ້ເທື່ອດຽວ)
    tlv('33', merchantAccount) +      // BCEL merchant account info
    tlv('52', mcc) +
    tlv('53', '418') +                // 418 = LAK
    tlv('54', String(Math.round(amountKip))) +
    tlv('58', 'LA') +
    tlv('59', name) +
    tlv('60', city) +
    tlv('62', additional) +
    '6304';
  return body + crc16(body);
}

/**
 * ກວດ callback ຈາກ BCEL. ຕອນນີ້ໃຊ້ shared secret ໃນ header "x-webhook-secret".
 * ຖ້າ BCEL ໃຊ້ລາຍເຊັນ (signature/HMAC) ແບບອື່ນ, ແກ້ສະເພາະ function ນີ້.
 */
export function extractCallback(body: Record<string, unknown>): { invoiceNo: string; providerRef: string } | null {
  const invoiceNo = String(body.invoiceId ?? body.invoice_id ?? body.invoiceNo ?? body.billNumber ?? '').trim();
  const providerRef = String(body.ticket ?? body.fccref ?? body.transactionId ?? body.ref ?? '');
  if (!/^P[0-9A-F]{15}$/.test(invoiceNo)) return null;
  return { invoiceNo, providerRef };
}
