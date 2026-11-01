import React, { useEffect, useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { formatKip, formatLiters, timeAgo, orderStatusLabel } from '@/utils/format';
import { PageHeader } from './OverviewPage';

export default function LiveFeedPage() {
  const { liveOrders, stations } = useDashboard();
  const [now, setNow] = useState(Date.now());
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [justArrived, setJustArrived] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (liveOrders.length === 0) return;
    const newestId = liveOrders[0].orderId;
    setJustArrived(newestId);
    const timeout = setTimeout(() => setJustArrived(null), 2000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveOrders[0]?.orderId]);

  const filtered =
    stationFilter === 'all' ? liveOrders : liveOrders.filter((o) => o.stationId === stationFilter);

  return (
    <div>
      <PageHeader
        title="Live Feed"
        subtitle="ອັບເດດທຸກໆ 3 ວິນາທີ ຈາກ Backend (ຈຳລອງ WebSocket feed)"
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-md)' }}>
        <FilterChip label="ທຸກປໍ້າ" active={stationFilter === 'all'} onClick={() => setStationFilter('all')} />
        {stations.map((s) => (
          <FilterChip
            key={s.id}
            label={s.name}
            active={stationFilter === s.id}
            onClick={() => setStationFilter(s.id)}
          />
        ))}
      </div>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: 12 }}>
              <th style={headStyle}>ລູກຄ້າ / ອໍເດີ</th>
              <th style={headStyle}>ປໍ້າ</th>
              <th style={headStyle}>ພະນັກງານ</th>
              <th style={headStyle}>ນ້ຳມັນ</th>
              <th style={headStyle}>ຍອດເງິນ</th>
              <th style={headStyle}>ສະຖານະ</th>
              <th style={headStyle}>ເວລາ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const station = stations.find((s) => s.id === o.stationId);
              const isNew = o.orderId === justArrived;
              return (
                <tr
                  key={o.orderId}
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    background: isNew ? 'rgba(34,197,94,0.08)' : 'transparent',
                    transition: 'background 1.5s ease',
                  }}
                >
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{o.orderId}</div>
                  </td>
                  <td style={cellStyle}>
                    {station?.name ?? o.stationId}
                    {o.pumpNumber && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>ຫົວ {o.pumpNumber}</div>
                    )}
                  </td>
                  <td style={cellStyle}>{o.staffName}</td>
                  <td style={cellStyle}>
                    {o.fuelType} · {formatLiters(o.liters)}
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 700 }}>{formatKip(o.amount)}</td>
                  <td style={cellStyle}>
                    <StatusBadge
                      label={orderStatusLabel(o.status).label}
                      tone={orderStatusLabel(o.status).tone}
                    />
                  </td>
                  <td style={{ ...cellStyle, color: 'var(--color-text-muted)', fontSize: 12 }}>
                    {timeAgo(o.createdAt, now)} ກ່ອນ
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 'var(--radius-pill)',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: active ? 'var(--color-primary)' : 'var(--color-card)',
        color: active ? '#06210F' : 'var(--color-text-secondary)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

const headStyle: React.CSSProperties = { padding: '6px 4px', fontWeight: 600 };
const cellStyle: React.CSSProperties = { padding: '10px 4px', fontSize: 13 };
