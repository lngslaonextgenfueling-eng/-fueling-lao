import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  throw new Error('ຍັງບໍ່ໄດ້ຕັ້ງ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ໃນໄຟລ໌ .env');
}

export const supabase = createClient(url, anonKey);

const MESSAGES: Record<string, string> = {
  MANAGER_ONLY: 'ສະເພາະຜູ້ຈັດການ',
  ADMIN_ONLY: 'ສະເພາະ admin',
  USER_NOT_FOUND: 'ບໍ່ພົບອີເມວນີ້ — ໃຫ້ພະນັກງານສະໝັກບັນຊີກ່ອນ (ຜ່ານແອັບລູກຄ້າ ຫຼື Supabase)',
  STATION_NOT_FOUND: 'ບໍ່ພົບປໍ້າ',
  BAD_ROLE: 'ບົດບາດບໍ່ຖືກຕ້ອງ',
  FUEL_TYPE_NOT_FOUND: 'ບໍ່ພົບປະເພດນ້ຳມັນ',
  'Invalid login credentials': 'ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ',
};

export function toLaoError(err: unknown): string {
  const raw = (err as { message?: string })?.message ?? String(err ?? '');
  for (const k of Object.keys(MESSAGES)) if (raw.includes(k)) return MESSAGES[k];
  return raw || 'ເກີດຂໍ້ຜິດພາດ';
}
