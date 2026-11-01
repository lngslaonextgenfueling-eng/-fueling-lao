export function formatKip(value: number): string {
  return `${Math.round(value).toLocaleString('lo-LA')} ₭`;
}

export function formatKipShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ₭`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ₭`;
  return formatKip(value);
}

export function formatLiters(value: number): string {
  return `${value.toFixed(1)} ລິດ`;
}

export function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function timeAgo(epochMs: number, now: number): string {
  const diffSec = Math.max(0, Math.floor((now - epochMs) / 1000));
  if (diffSec < 60) return `${diffSec} ວິ`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ນທ`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr} ຊມ`;
}

export function orderStatusLabel(status: string): { label: string; tone: 'success' | 'neutral' | 'warning' | 'danger' } {
  switch (status) {
    case 'pending':
      return { label: 'ລໍຖ້າ', tone: 'warning' };
    case 'in_progress':
      return { label: 'ກຳລັງເຕີມ', tone: 'success' };
    case 'completed':
      return { label: 'ສຳເລັດ', tone: 'neutral' };
    case 'cancelled':
      return { label: 'ຍົກເລີກ', tone: 'danger' };
    default:
      return { label: 'ໝົດອາຍຸ', tone: 'danger' };
  }
}
