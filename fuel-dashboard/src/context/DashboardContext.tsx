import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DashboardSnapshot,
  FuelPrice,
  FuelTypeShare,
  HourlySales,
  LiveOrder,
  Pump,
  Station,
  StaffShiftStat,
} from '@/types';

// ---------------------------------------------------------------------------
// DATA LAYER — Supabase
// "(3) Live Stream Feed": Supabase Realtime ສົ່ງການປ່ຽນແປງຂອງ orders/pumps ມາ
// ທັນທີ (ໄວກວ່າ 3 ວິນາທີ). ລາຍງານຍອດຂາຍ ດຶງຈາກ RPC ທຸກ 60 ວິ ແລະ ທຸກເທື່ອ
// ທີ່ມີອໍເດີສຳເລັດ.
// ---------------------------------------------------------------------------

const MAX_LIVE_ORDERS = 50;
const REPORT_POLL_MS = 60_000;

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapOrder = (r: any): LiveOrder => ({
  orderId: r.id,
  stationId: r.station_id,
  customerName: r.customer_name || 'ລູກຄ້າ',
  staffName: r.staff_name ?? '-',
  paymentMethod: r.payment_method,
  fuelType: r.fuel_type,
  liters: Number(r.liters),
  amount: Number(r.amount) - Number(r.discount ?? 0),
  status: r.status,
  pumpNumber: r.pump_number ?? undefined,
  createdAt: new Date(r.created_at).getTime(),
});

const mapPump = (r: any): Pump => ({
  id: r.id,
  stationId: r.station_id,
  pumpNumber: r.pump_number,
  status: r.status,
  currentOrderId: r.current_order_id ?? undefined,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

interface DashboardContextValue extends DashboardSnapshot {
  connected: boolean;
  lastUpdatedAt: number;
  completedToday: number;
  fuelPrices: FuelPrice[];
  refreshAll: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [staffStats, setStaffStats] = useState<StaffShiftStat[]>([]);
  const [hourlySales, setHourlySales] = useState<HourlySales[]>([]);
  const [fuelShare, setFuelShare] = useState<FuelTypeShare[]>([]);
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [connected, setConnected] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(Date.now());
  const reportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadReports = useCallback(async () => {
    const [hourly, byFuel, staff, completed] = await Promise.all([
      supabase.rpc('sales_hourly', {}),
      supabase.rpc('sales_by_fuel', {}),
      supabase.rpc('staff_stats_today', {}),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', startOfTodayIso()),
    ]);
    setHourlySales(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((hourly.data ?? []) as any[])
        .filter((h) => h.hour >= 5 && h.hour <= 23)
        .map((h) => ({ hour: `${String(h.hour).padStart(2, '0')}:00`, amount: Number(h.amount), liters: Number(h.liters) }))
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFuelShare(((byFuel.data ?? []) as any[]).map((f) => ({ fuelType: f.fuel_type, liters: Number(f.liters), amount: Number(f.amount) })));
    setStaffStats(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((staff.data ?? []) as any[]).map((s) => ({
        staffId: s.staff_id,
        staffName: s.staff_name,
        stationId: s.station_id,
        ordersCompleted: Number(s.orders_completed),
        totalSales: Number(s.total_sales),
      }))
    );
    setCompletedToday(completed.count ?? 0);
    setLastUpdatedAt(Date.now());
  }, []);

  // ລວມການເອີ້ນລາຍງານຫຼາຍເທື່ອຕິດກັນ ໃຫ້ເຫຼືອເທື່ອດຽວ
  const scheduleReports = useCallback(() => {
    if (reportTimer.current) clearTimeout(reportTimer.current);
    reportTimer.current = setTimeout(loadReports, 1500);
  }, [loadReports]);

  const refreshAll = useCallback(async () => {
    const [st, pu, ord, pr] = await Promise.all([
      supabase.from('stations').select('id, name').order('id'),
      supabase.from('pumps').select('*').order('station_id').order('pump_number'),
      supabase
        .from('orders')
        .select('*')
        .gte('created_at', startOfTodayIso())
        .order('created_at', { ascending: false })
        .limit(MAX_LIVE_ORDERS),
      supabase.from('fuel_prices').select('*').order('fuel_type'),
    ]);
    setStations(st.data ?? []);
    setPumps((pu.data ?? []).map(mapPump));
    setLiveOrders((ord.data ?? []).map(mapOrder));
    setFuelPrices((pr.data ?? []).map((p) => ({ fuelType: p.fuel_type, label: p.label, pricePerLiter: p.price_per_liter })));
    await loadReports();
  }, [loadReports]);

  useEffect(() => {
    refreshAll();
    const id = setInterval(loadReports, REPORT_POLL_MS);
    return () => clearInterval(id);
  }, [refreshAll, loadReports]);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (!(payload.new as { id?: string })?.id) return;
        const order = mapOrder(payload.new);
        setLiveOrders((prev) =>
          [order, ...prev.filter((o) => o.orderId !== order.orderId)]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, MAX_LIVE_ORDERS)
        );
        if (order.status === 'completed') scheduleReports();
        setLastUpdatedAt(Date.now());
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pumps' }, (payload) => {
        if (!(payload.new as { id?: string })?.id) return;
        const pump = mapPump(payload.new);
        setPumps((prev) => (prev.some((p) => p.id === pump.id) ? prev.map((p) => (p.id === pump.id ? pump : p)) : [...prev, pump]));
        setLastUpdatedAt(Date.now());
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') refreshAll();
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshAll, scheduleReports]);

  const value = useMemo(
    () => ({
      stations,
      pumps,
      liveOrders,
      staffStats,
      hourlySales,
      fuelShare,
      fuelPrices,
      completedToday,
      connected,
      lastUpdatedAt,
      refreshAll,
    }),
    [stations, pumps, liveOrders, staffStats, hourlySales, fuelShare, fuelPrices, completedToday, connected, lastUpdatedAt, refreshAll]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
