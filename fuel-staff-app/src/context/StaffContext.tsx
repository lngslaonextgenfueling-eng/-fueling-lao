import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CustomerOrder, Pump, StaffProfile, StaffShiftSummary } from '@/types';

// ---------------------------------------------------------------------------
// DATA LAYER — Supabase
//   (2) Scan & Dispense   -> lookup_order / approve_order / complete_order (RPC)
//   (3) Live Stream Feed  -> Supabase Realtime ຂອງຕາຕະລາງ orders + pumps
// ທຸກການກວດສິດ (ປໍ້າໃດ, ຈ່າຍແລ້ວບໍ, ໝົດອາຍຸບໍ) ເຮັດຢູ່ server.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOrder(r: any): CustomerOrder {
  return {
    orderId: r.id,
    customerName: r.customer_name || 'ລູກຄ້າ',
    customerId: r.customer_id,
    fuelType: r.fuel_type,
    liters: Number(r.liters),
    amount: Number(r.amount) - Number(r.discount ?? 0),
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    pin: r.pin,
    createdAt: new Date(r.created_at).getTime(),
    expiresAt: new Date(r.expires_at).getTime(),
    completedAt: r.completed_at ? new Date(r.completed_at).getTime() : null,
    status: r.status,
    pumpNumber: r.pump_number ?? undefined,
    staffName: r.staff_name ?? undefined,
  };
}

function mapPump(r: any): Pump {
  return {
    id: r.id,
    number: r.pump_number,
    label: `ຫົວ ${r.pump_number}`,
    status: r.status,
    currentOrderId: r.current_order_id ?? undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const VISIBLE_STATUSES = ['pending', 'in_progress', 'completed'];

interface StaffContextValue {
  staff: StaffProfile;
  orders: CustomerOrder[];
  pumps: Pump[];
  shiftSummaries: StaffShiftSummary[];
  connected: boolean;
  lookupOrder: (query: string) => Promise<CustomerOrder>;
  approveOrder: (orderId: string, pumpNumber: number) => Promise<CustomerOrder>;
  completeOrder: (orderId: string) => Promise<void>;
  setPumpStatus: (pumpId: string, status: 'idle' | 'offline') => Promise<void>;
  refresh: () => Promise<void>;
}

const StaffContext = createContext<StaffContextValue | undefined>(undefined);

export function StaffProvider({ staff, children }: { staff: StaffProfile; children: React.ReactNode }) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [shiftSummaries, setShiftSummaries] = useState<StaffShiftSummary[]>([]);
  const [connected, setConnected] = useState(false);

  const loadStats = useCallback(async () => {
    const { data } = await supabase.rpc('staff_stats_today', { p_station_id: staff.stationId });
    setShiftSummaries(
      (data ?? []).map((s: { staff_id: string; staff_name: string; orders_completed: number; total_sales: number }) => ({
        staffId: s.staff_id,
        staffName: s.staff_id === staff.id ? `${s.staff_name} (ທ່ານ)` : s.staff_name,
        ordersCompleted: Number(s.orders_completed),
        totalSales: Number(s.total_sales),
        shiftLabel: 'ມື້ນີ້',
      }))
    );
  }, [staff.id, staff.stationId]);

  const refresh = useCallback(async () => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const [{ data: orderRows }, { data: pumpRows }] = await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('station_id', staff.stationId)
        .in('status', VISIBLE_STATUSES)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('pumps').select('*').eq('station_id', staff.stationId).order('pump_number'),
    ]);
    setOrders((orderRows ?? []).map(mapOrder));
    setPumps((pumpRows ?? []).map(mapPump));
    await loadStats();
  }, [staff.stationId, loadStats]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- Realtime ----
  useEffect(() => {
    const channel = supabase
      .channel(`station-${staff.stationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `station_id=eq.${staff.stationId}` },
        (payload) => {
          const row = payload.new as { id?: string; status?: string };
          if (!row?.id) return;
          const order = mapOrder(payload.new);
          setOrders((prev) => {
            const rest = prev.filter((o) => o.orderId !== order.orderId);
            return VISIBLE_STATUSES.includes(order.status) ? [order, ...rest] : rest;
          });
          if (row.status === 'completed') loadStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pumps', filter: `station_id=eq.${staff.stationId}` },
        (payload) => {
          if (!(payload.new as { id?: string })?.id) return;
          const pump = mapPump(payload.new);
          setPumps((prev) => prev.map((p) => (p.id === pump.id ? pump : p)));
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') refresh(); // ດຶງຂໍ້ມູນໃໝ່ຫຼັງເຊື່ອມຕໍ່ຄືນ
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [staff.stationId, refresh, loadStats]);

  const lookupOrder = useCallback(async (query: string) => {
    const { data, error } = await supabase.rpc('lookup_order', { p_code: query.trim() });
    if (error) throw error;
    return mapOrder(data);
  }, []);

  const approveOrder = useCallback(async (orderId: string, pumpNumber: number) => {
    const { data, error } = await supabase.rpc('approve_order', { p_order_id: orderId, p_pump_number: pumpNumber });
    if (error) throw error;
    const order = mapOrder(data);
    setOrders((prev) => [order, ...prev.filter((o) => o.orderId !== orderId)]);
    return order;
  }, []);

  const completeOrder = useCallback(
    async (orderId: string) => {
      const { data, error } = await supabase.rpc('complete_order', { p_order_id: orderId });
      if (error) throw error;
      const order = mapOrder(data);
      setOrders((prev) => [order, ...prev.filter((o) => o.orderId !== orderId)]);
      loadStats();
    },
    [loadStats]
  );

  const setPumpStatus = useCallback(async (pumpId: string, status: 'idle' | 'offline') => {
    const { error } = await supabase.rpc('set_pump_status', { p_pump_id: pumpId, p_status: status });
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      staff,
      orders,
      pumps,
      shiftSummaries,
      connected,
      lookupOrder,
      approveOrder,
      completeOrder,
      setPumpStatus,
      refresh,
    }),
    [staff, orders, pumps, shiftSummaries, connected, lookupOrder, approveOrder, completeOrder, setPumpStatus, refresh]
  );

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff(): StaffContextValue {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error('useStaff must be used within StaffProvider');
  return ctx;
}
