import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import {
  ConfirmedOrder,
  Coupon,
  FuelOrderDraft,
  FuelPrice,
  FuelType,
  MemberTier,
  OnePayCharge,
  PaymentMethod,
  Station,
  Transaction,
  User,
} from '@/types';

// ---------------------------------------------------------------------------
// DATA LAYER — Supabase
// ທຸກໜ້າຈໍອ່ານຂໍ້ມູນຜ່ານ useApp(). ລາຄາ ແລະ ຍອດເງິນຕົວຈິງ ຄິດໄລ່ຢູ່ server
// (function create_order) — ຕົວເລກຢູ່ແອັບເປັນພຽງການຄາດຄະເນໃຫ້ລູກຄ້າເຫັນ.
// ---------------------------------------------------------------------------

const TANK_CAPACITY_LITERS = 40; // ຕ້ອງກົງກັບ c_tank_liters ໃນ create_order

const TIERS: { tier: MemberTier; min: number }[] = [
  { tier: 'Silver', min: 0 },
  { tier: 'Gold', min: 2000 },
  { tier: 'Platinum', min: 5000 },
];

function tierFor(points: number) {
  let idx = 0;
  TIERS.forEach((t, i) => {
    if (points >= t.min) idx = i;
  });
  const next = TIERS[idx + 1];
  return { tier: TIERS[idx].tier, nextTier: next?.tier ?? null, pointsToNextTier: next?.min ?? TIERS[idx].min };
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOrder(row: any, stations: Station[]): ConfirmedOrder {
  return {
    orderId: row.id,
    stationId: row.station_id,
    stationName: stations.find((s) => s.id === row.station_id)?.name ?? row.station_id,
    fuelType: row.fuel_type,
    liters: Number(row.liters),
    amount: Number(row.amount),
    discount: Number(row.discount),
    pointsEarned: row.points_earned,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    pin: row.pin,
    qrPayload: `LNGS:${row.qr_token}`,
    pumpNumber: row.pump_number,
    createdAt: new Date(row.created_at).getTime(),
    expiresAt: new Date(row.expires_at).getTime(),
  };
}

function mapTransaction(row: any, stations: Station[]): Transaction {
  const d = new Date(row.completed_at ?? row.created_at);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return {
    id: row.id,
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    fuelType: row.fuel_type,
    liters: Number(row.liters),
    amount: Number(row.amount) - Number(row.discount),
    pointsEarned: row.points_earned,
    stationName: stations.find((s) => s.id === row.station_id)?.name ?? row.station_id,
  };
}

async function invokeFn<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // ອ່ານລະຫັດ error ຈາກ response body ຖ້າມີ
    const ctx = (error as any).context;
    if (ctx && typeof ctx.json === 'function') {
      const payload = await ctx.json().catch(() => null);
      if (payload?.error) throw new Error(payload.error);
    }
    throw error;
  }
  return data as T;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface AppContextValue {
  loading: boolean;
  user: User;
  station: Station | null; // ປໍ້າທີ່ເລືອກ (ໃກ້ສຸດ ຕາມ GPS)
  stations: Station[];
  locationStatus: 'loading' | 'granted' | 'denied';
  fuelPrices: FuelPrice[];
  transactions: Transaction[];
  coupons: Coupon[];
  draft: FuelOrderDraft | null;
  confirmedOrder: ConfirmedOrder | null; // ອໍເດີທີ່ກຳລັງດຳເນີນ
  onePayCharge: OnePayCharge | null;
  selectStation: (stationId: string) => void;
  startDraft: (fuelType: FuelType, mode: FuelOrderDraft['mode'], inputValue: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  confirmOrder: () => Promise<ConfirmedOrder>;
  payOrderWithOnePay: () => Promise<OnePayCharge>;
  createTopUp: (amount: number) => Promise<OnePayCharge>;
  sandboxConfirm: (paymentId: string) => Promise<void>;
  cancelOrder: () => Promise<void>;
  clearConfirmedOrder: () => void;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: '', phone: '', walletBalance: 0, points: 0 });
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [draft, setDraft] = useState<FuelOrderDraft | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [onePayCharge, setOnePayCharge] = useState<OnePayCharge | null>(null);
  const stationsRef = useRef<Station[]>([]);
  stationsRef.current = stations;

  // ---- GPS ----
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return setLocationStatus('denied');
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      } catch {
        setLocationStatus('denied');
      }
    })();
  }, []);

  const stationsWithDistance = useMemo<Station[]>(() => {
    const list = stations.map((s) => ({
      ...s,
      distanceKm:
        coords && s.lat != null && s.lng != null
          ? Math.round(haversineKm(coords.lat, coords.lng, s.lat, s.lng) * 10) / 10
          : null,
    }));
    return list.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  }, [stations, coords]);

  const station =
    stationsWithDistance.find((s) => s.id === selectedStationId) ?? stationsWithDistance[0] ?? null;

  // ---- Loaders ----
  const loadProfile = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone, wallet_balance, points')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile({
        name: data.full_name,
        phone: data.phone,
        walletBalance: Number(data.wallet_balance),
        points: data.points,
      });
    }
  }, [userId]);

  const loadOrders = useCallback(
    async (stationList: Station[], includeActive = true) => {
      const [{ data: active }, { data: history }] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('customer_id', userId)
          .in('status', ['pending', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('orders')
          .select('*')
          .eq('customer_id', userId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(50),
      ]);
      const activeRow = active?.[0];
      const stillActive =
        !!activeRow &&
        (activeRow.status === 'in_progress' || new Date(activeRow.expires_at).getTime() > Date.now());
      if (includeActive) setConfirmedOrder(stillActive ? mapOrder(activeRow, stationList) : null);
      setTransactions((history ?? []).map((r) => mapTransaction(r, stationList)));
    },
    [userId]
  );

  const refresh = useCallback(async () => {
    const [{ data: prices }, { data: stationRows }, { data: couponRows }] = await Promise.all([
      supabase.from('fuel_prices').select('*').order('fuel_type'),
      supabase.from('stations').select('*').eq('active', true),
      supabase.from('coupons').select('*').order('expires_on'),
    ]);
    const stationList: Station[] = (stationRows ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      distanceKm: null,
    }));
    setFuelPrices(
      (prices ?? []).map((p) => ({ type: p.fuel_type, label: p.label, pricePerLiter: p.price_per_liter }))
    );
    setStations(stationList);
    setCoupons(
      (couponRows ?? []).map((c) => ({ id: c.id, title: c.title, description: c.description, expiresOn: c.expires_on }))
    );
    await Promise.all([loadProfile(), loadOrders(stationList)]);
  }, [loadProfile, loadOrders]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // ---- Realtime: wallet/points + ສະຖານະອໍເດີ (ພະນັກງານສະແກນ → ປ່ຽນທັນທີ) ----
  useEffect(() => {
    const channel = supabase
      .channel(`customer-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () =>
        loadProfile()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${userId}` }, (payload) => {
        const row = payload.new as { id?: string; status?: string; payment_status?: string };
        if (!row?.id) return;
        setConfirmedOrder((prev) =>
          prev && prev.orderId === row.id ? mapOrder(payload.new, stationsRef.current) : prev
        );
        if (row.payment_status === 'paid') setOnePayCharge(null);
        if (row.status === 'completed') loadOrders(stationsRef.current, false); // ອັບເດດປະຫວັດ, ຄົງໜ້າ "ສຳເລັດ" ໄວ້
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadProfile, loadOrders]);

  // ---- Actions ----
  const startDraft = useCallback(
    (fuelType: FuelType, mode: FuelOrderDraft['mode'], inputValue: number) => {
      if (!station) return;
      const price = fuelPrices.find((p) => p.type === fuelType)?.pricePerLiter ?? 0;
      let amount: number;
      let liters: number;
      if (mode === 'amount') {
        amount = Math.round(inputValue);
        liters = price ? amount / price : 0;
      } else if (mode === 'liters') {
        liters = inputValue;
        amount = Math.round(liters * price);
      } else {
        liters = TANK_CAPACITY_LITERS;
        amount = Math.round(liters * price);
      }
      setDraft({
        station,
        fuelType,
        mode,
        inputValue,
        amount,
        liters,
        paymentMethod: 'wallet',
        discount: 0,
        pointsEarned: Math.floor(amount / 1000),
      });
    },
    [station, fuelPrices]
  );

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setDraft((prev) => (prev ? { ...prev, paymentMethod: method } : prev));
  }, []);

  const payOrderWithOnePay = useCallback(async (): Promise<OnePayCharge> => {
    const orderId = confirmedOrder?.orderId;
    if (!orderId) throw new Error('ORDER_NOT_FOUND');
    const charge = await invokeFn<OnePayCharge>('payment-create', { purpose: 'order', orderId });
    setOnePayCharge(charge);
    return charge;
  }, [confirmedOrder?.orderId]);

  const confirmOrder = useCallback(async (): Promise<ConfirmedOrder> => {
    if (!draft) throw new Error('No draft order to confirm');
    const { data, error } = await supabase.rpc('create_order', {
      p_station_id: draft.station.id,
      p_fuel_type: draft.fuelType,
      p_mode: draft.mode,
      p_input: draft.mode === 'full_tank' ? 0 : draft.inputValue,
      p_payment_method: draft.paymentMethod,
    });
    if (error) throw error;
    const order = mapOrder(data, stationsRef.current);
    setConfirmedOrder(order);
    if (order.paymentMethod === 'one_pay') {
      const charge = await invokeFn<OnePayCharge>('payment-create', { purpose: 'order', orderId: order.orderId });
      setOnePayCharge(charge);
    }
    loadProfile();
    return order;
  }, [draft, loadProfile]);

  const createTopUp = useCallback(
    (amount: number) => invokeFn<OnePayCharge>('payment-create', { purpose: 'topup', amount }),
    []
  );

  const sandboxConfirm = useCallback(async (paymentId: string) => {
    await invokeFn('payment-sandbox-confirm', { paymentId });
  }, []);

  const cancelOrder = useCallback(async () => {
    if (!confirmedOrder) return;
    const { error } = await supabase.rpc('cancel_order', { p_order_id: confirmedOrder.orderId });
    if (error) throw error;
    setConfirmedOrder(null);
    setOnePayCharge(null);
    setDraft(null);
    loadProfile();
  }, [confirmedOrder, loadProfile]);

  const clearConfirmedOrder = useCallback(() => {
    setConfirmedOrder((prev) => (prev && ['pending', 'in_progress'].includes(prev.status) ? prev : null));
    setDraft(null);
  }, []);

  const user: User = useMemo(() => ({ id: userId, ...profile, ...tierFor(profile.points) }), [userId, profile]);

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      user,
      station,
      stations: stationsWithDistance,
      locationStatus,
      fuelPrices,
      transactions,
      coupons,
      draft,
      confirmedOrder,
      onePayCharge,
      selectStation: setSelectedStationId,
      startDraft,
      setPaymentMethod,
      confirmOrder,
      payOrderWithOnePay,
      createTopUp,
      sandboxConfirm,
      cancelOrder,
      clearConfirmedOrder,
      refresh,
    }),
    [
      loading, user, station, stationsWithDistance, locationStatus, fuelPrices, transactions, coupons, draft,
      confirmedOrder, onePayCharge, startDraft, setPaymentMethod, confirmOrder, payOrderWithOnePay, createTopUp,
      sandboxConfirm, cancelOrder, clearConfirmedOrder, refresh,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
