// ແປລະຫັດ error ຈາກ server ເປັນຂໍ້ຄວາມພາສາລາວ
const MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: 'ກະລຸນາເຂົ້າສູ່ລະບົບໃໝ່',
  ONLY_CUSTOMERS_CAN_ORDER: 'ບັນຊີນີ້ບໍ່ແມ່ນບັນຊີລູກຄ້າ',
  STATION_NOT_FOUND: 'ບໍ່ພົບປໍ້ານ້ຳມັນ',
  FUEL_TYPE_NOT_FOUND: 'ບໍ່ພົບປະເພດນ້ຳມັນ',
  AMOUNT_TOO_SMALL: 'ຈຳນວນເງິນຕ້ອງຢ່າງໜ້ອຍ 1,000 ກີບ',
  LITERS_TOO_SMALL: 'ຈຳນວນລິດຕ້ອງຢ່າງໜ້ອຍ 0.5 ລິດ',
  AMOUNT_TOO_LARGE: 'ຈຳນວນເງິນເກີນກຳນົດ',
  ALREADY_HAS_PENDING_ORDER: 'ທ່ານມີອໍເດີທີ່ລໍຖ້າຢູ່ແລ້ວ — ເປີດ "QR ຂອງຂ້ອຍ" ເພື່ອເບິ່ງ',
  INSUFFICIENT_WALLET: 'ຍອດເງິນໃນ Wallet ບໍ່ພຽງພໍ',
  ORDER_NOT_FOUND: 'ບໍ່ພົບອໍເດີ',
  ORDER_NOT_CANCELLABLE: 'ອໍເດີນີ້ຍົກເລີກບໍ່ໄດ້ແລ້ວ',
  ORDER_NOT_PAYABLE: 'ອໍເດີນີ້ຈ່າຍບໍ່ໄດ້',
  ORDER_EXPIRED: 'ອໍເດີໝົດອາຍຸແລ້ວ',
  BAD_AMOUNT: 'ຈຳນວນເງິນເຕີມ ຕ້ອງຢູ່ລະຫວ່າງ 10,000 – 10,000,000 ກີບ',
  ONEPAY_NOT_CONFIGURED: 'ລະບົບ OnePay ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ',
  'Invalid login credentials': 'ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ',
  'User already registered': 'ອີເມວນີ້ສະໝັກແລ້ວ',
  'Email not confirmed': 'ກະລຸນາຢືນຢັນອີເມວກ່ອນ (ເບິ່ງໃນກ່ອງອີເມວ)',
};

export function toLaoError(err: unknown): string {
  const raw =
    typeof err === 'string'
      ? err
      : (err as { message?: string; error?: string })?.message ?? (err as { error?: string })?.error ?? '';
  for (const key of Object.keys(MESSAGES)) {
    if (raw.includes(key)) return MESSAGES[key];
  }
  if (/network|fetch/i.test(raw)) return 'ບໍ່ສາມາດເຊື່ອມຕໍ່ອິນເຕີເນັດໄດ້';
  return raw || 'ເກີດຂໍ້ຜິດພາດ, ກະລຸນາລອງໃໝ່';
}
