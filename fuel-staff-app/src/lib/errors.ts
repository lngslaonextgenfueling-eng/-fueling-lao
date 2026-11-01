// ແປລະຫັດ error ຈາກ server ເປັນຂໍ້ຄວາມພາສາລາວ (ສຳລັບພະນັກງານ)
const MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: 'ກະລຸນາເຂົ້າສູ່ລະບົບໃໝ່',
  STAFF_ONLY: 'ບັນຊີນີ້ບໍ່ມີສິດພະນັກງານ',
  ORDER_NOT_FOUND: 'ບໍ່ພົບອໍເດີ, ຫຼື ໝົດອາຍຸແລ້ວ',
  ORDER_NOT_PAID: 'ລູກຄ້າຍັງບໍ່ໄດ້ຈ່າຍເງິນຜ່ານ OnePay',
  ORDER_NOT_PENDING: 'ອໍເດີນີ້ຖືກອະນຸມັດ ຫຼື ຍົກເລີກໄປແລ້ວ',
  ORDER_EXPIRED: 'ອໍເດີໝົດອາຍຸແລ້ວ',
  ORDER_NOT_IN_PROGRESS: 'ອໍເດີນີ້ບໍ່ໄດ້ຢູ່ໃນສະຖານະກຳລັງເຕີມ',
  WRONG_STATION: 'ອໍເດີນີ້ເປັນຂອງປໍ້າອື່ນ',
  PUMP_NOT_FOUND: 'ບໍ່ພົບຫົວຈ່າຍ',
  PUMP_NOT_AVAILABLE: 'ຫົວຈ່າຍນີ້ບໍ່ວ່າງ — ເລືອກຫົວອື່ນ',
  PUMP_IN_USE: 'ຫົວຈ່າຍກຳລັງໃຊ້ຢູ່',
  'Invalid login credentials': 'ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ',
};

export function toLaoError(err: unknown): string {
  const raw = typeof err === 'string' ? err : (err as { message?: string })?.message ?? '';
  for (const key of Object.keys(MESSAGES)) {
    if (raw.includes(key)) return MESSAGES[key];
  }
  if (/network|fetch/i.test(raw)) return 'ບໍ່ສາມາດເຊື່ອມຕໍ່ອິນເຕີເນັດໄດ້';
  return raw || 'ເກີດຂໍ້ຜິດພາດ, ກະລຸນາລອງໃໝ່';
}
