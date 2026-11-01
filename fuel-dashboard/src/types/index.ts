// Shared types for the Dashboard app.
// These mirror what the Backend API & Database (Node.js/Python + Firebase/
// Supabase + WebSockets) is expected to push over the "Live Stream Feed"
// channel (every 3s per the architecture doc), plus REST summaries for
// sales and staff. Swap the mock generator in src/context/DashboardContext
// for a real WebSocket subscription / polling fetch that resolves to these
// same shapes and the UI needs no changes.

export type FuelType = '91' | '95' | 'Diesel' | 'E20';
export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
export type PumpStatus = 'active' | 'idle' | 'offline';

export interface Station {
  id: string;
  name: string;
}

export interface Pump {
  id: string; // `${stationId}-${pumpNumber}`
  stationId: string;
  pumpNumber: number;
  status: PumpStatus;
  currentOrderId?: string;
}

export interface LiveOrder {
  orderId: string;
  stationId: string;
  customerName: string;
  staffName: string;
  paymentMethod: 'wallet' | 'one_pay' | 'cash';
  fuelType: FuelType;
  liters: number;
  amount: number;
  status: OrderStatus;
  pumpNumber?: number;
  createdAt: number; // epoch ms
}

export interface FuelPrice {
  fuelType: FuelType;
  label: string;
  pricePerLiter: number;
}

export interface StaffShiftStat {
  staffId: string;
  staffName: string;
  stationId: string;
  ordersCompleted: number;
  totalSales: number;
}

export interface HourlySales {
  hour: string; // "08:00"
  amount: number;
  liters: number;
}

export interface FuelTypeShare {
  fuelType: FuelType;
  liters: number;
  amount: number;
}

export interface DashboardSnapshot {
  stations: Station[];
  pumps: Pump[];
  liveOrders: LiveOrder[]; // newest first
  staffStats: StaffShiftStat[];
  hourlySales: HourlySales[];
  fuelShare: FuelTypeShare[];
}
