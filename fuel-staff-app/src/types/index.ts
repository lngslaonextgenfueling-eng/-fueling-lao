// Shared types for the Staff app. Mapped from Supabase rows in
// src/context/StaffContext.tsx (see supabase/migrations for the schema).

export type FuelType = '91' | '95' | 'Diesel' | 'E20';

export type QueueStatus = 'pending' | 'in_progress' | 'completed';

export type PumpStatus = 'active' | 'idle' | 'offline';

export type PaymentMethod = 'wallet' | 'one_pay' | 'cash';

export interface StaffProfile {
  id: string;
  name: string;
  role: 'staff' | 'manager' | 'admin';
  stationId: string;
  stationName: string;
}

export interface CustomerOrder {
  orderId: string;
  customerName: string;
  customerId: string;
  fuelType: FuelType;
  liters: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded';
  pin: string;
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
  completedAt: number | null;
  status: QueueStatus;
  pumpNumber?: number;
  staffName?: string;
}

export interface Pump {
  id: string; // 'STN-001-1'
  number: number; // 1..6
  label: string; // "ຫົວ 1"
  status: PumpStatus;
  currentOrderId?: string;
}

export interface StaffShiftSummary {
  staffId: string;
  staffName: string;
  ordersCompleted: number;
  totalSales: number; // ກີບ
  shiftLabel: string;
}
