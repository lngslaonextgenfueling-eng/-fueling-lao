import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// ຄ່າເຫຼົ່ານີ້ມາຈາກໄຟລ໌ .env (ເບິ່ງ .env.example)
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('ຍັງບໍ່ໄດ້ຕັ້ງ EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY ໃນໄຟລ໌ .env');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ຢຸດ/ເລີ່ມ refresh token ຕາມສະຖານະແອັບ (ແນະນຳໂດຍ Supabase ສຳລັບ React Native)
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
