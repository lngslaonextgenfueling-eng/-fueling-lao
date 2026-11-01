// Shared types for the Customer app. Mapped from Supabase rows in
// src/context/AppContext.tsx (see supabase/migrations for the schema).

export type FuelType = '91' | '95' | 'Diesel' | 'E20';

export type FuelMode = 'amount' | 'liters' | 'full_tank';

export type PaymentMethod = 'wallet' | 'one_pay' | 'cash';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded';

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export type MemberTier = 'Silver' | 'Gold' | 'Platinum';

export interface Station {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null; // null = ບໍ່ຮູ້ຕຳແໜ່ງ GPS
}

export interface FuelPrice {
  type: FuelType;
  label: string;
  pricePerLiter: number; // ກີບ / ລິດ
}

export interface User {
  id: string;
  name: string;
  phone: string;
  walletBalance: number; // ກີບ
  points: number;
  tier: MemberTier;
  pointsToNextTier: number;
  nextTier: MemberTier | null;
}

export interface FuelOrderDraft {
  station: Station;
  fuelType: FuelType;
  mode: FuelMode;
  inputValue: number;
  amount: number; // ກີບ (ຄາດຄະເນ — server ຄິດໄລ່ຕົວຈິງ)
  liters: number;
  paymentMethod: PaymentMethod;
  discount: number;
  pointsEarned: number;
}

export interface ConfirmedOrder {
  orderId: string;
  stationId: string;
  stationName: string;
  fuelType: FuelType;
  liters: number;
  amount: number;
  discount: number;
  pointsEarned: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  pin: string; // 4-digit PIN
  qrPayload: string; // "LNGS:<token>" — staff app scans this
  pumpNumber: number | null;
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
}

export interface OnePayCharge {
  paymentId: string;
  qrString: string;
  amount: number;
  mode: 'sandbox' | 'onepay';
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  fuelType: FuelType;
  liters: number;
  amount: number;
  pointsEarned: number;
  stationName: string;
}

export interface Coupon {
  id: string;
  title: string;
  description: string;
  expiresOn: string;
}
