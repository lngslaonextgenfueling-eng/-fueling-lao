export function formatKip(value: number): string {
  return `${Math.round(value).toLocaleString('lo-LA')} ₭`;
}

export function formatLiters(value: number): string {
  return `${value.toFixed(2)} ລິດ`;
}

export function formatTime(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toLocaleString('lo-LA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
