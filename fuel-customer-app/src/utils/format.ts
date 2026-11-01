export function formatKip(value: number): string {
  return `${Math.round(value).toLocaleString('lo-LA')} ₭`;
}

export function formatLiters(value: number): string {
  return `${value.toFixed(2)} ລິດ`;
}

export function pad4(n: number): string {
  return n.toString().padStart(4, '0');
}

export function generatePin(): string {
  return pad4(Math.floor(Math.random() * 10000));
}

export function generateOrderId(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

export function mmss(msRemaining: number): string {
  const totalSec = Math.max(0, Math.floor(msRemaining / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
