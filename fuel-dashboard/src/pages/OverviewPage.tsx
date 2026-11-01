import React, { useMemo } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { KpiCard } from '@/components/KpiCard';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { formatKip, formatLiters, timeAgo, orderStatusLabel } from '@/utils/format';
import { Link } from 'react-router-dom';

export default function OverviewPage() {
  const { pumps, liveOrders, hourlySales, stations } = useDashboard();
  const now = Date.now();

  const totalSalesToday = useMemo(() => hourlySales.reduce((sum, h) => sum + h.amount, 0), [hourlySales]);
  const totalLitersToday = useMemo(() => hourlySales.reduce((sum, h) => sum + h.liters, 0), [hourlySales]);
  const activeOrders = liveOrders.filter((o) => o.status === 'in_progress').length;
  const activePumps = pumps.filter((p) => p.status === 'active').length;
  const offlinePumps = pumps.filter((p) => p.status === 'offline').length;

  return (
    <div>
      <PageHeader title="ພາບລວມ" subtitle="ສະຫຼຸບການເຄື່ອນໄຫວຂອງທຸກປໍ້າ, ອັບເດດແບບ Real-time" />

      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
        <KpiCard label="ຍອດຂາຍມື້ນີ້" value={formatKip(totalSalesToday)} accent="var(--color-primary)" icon="₭" />
        <KpiCard label="ນ້ຳມັນຂາຍແລ້ວ" value={formatLiters(totalLitersToday)} icon="⛽" />
        <KpiCard
          label="ອໍເດີກຳລັງດຳເນີນການ"
          value={String(activeOrders)}
          accent="var(--color-blue)"
          icon="🔄"
        />
        <KpiCard
          label="ຫົວຈ່າຍກຳລັງໃຊ້"
          value={`${activePumps} / ${pumps.length}`}
          sublabel={offlinePumps > 0 ? `${offlinePumps} ຫົວອອຟລາຍ` : 'ທຸກຫົວພ້ອມໃຊ້'}
          accent={offlinePumps > 0 ? 'var(--color-warning)' : 'var(--color-primary)'}
          icon="📶"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 'var(--space-lg)' }}>
        <Card>
          <SectionHeader title="ອໍເດີຫຼ້າສຸດ" link={{ to: '/live', label: 'ເບິ່ງທັງໝົດ →' }} />
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
            <tbody>
              {liveOrders.slice(0, 6).map((o) => (
                <tr key={o.orderId} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{o.orderId}</div>
                  </td>
                  <td style={cellStyle}>
                    {o.fuelType} · {formatLiters(o.liters)}
                  </td>
                  <td style={cellStyle}>{formatKip(o.amount)}</td>
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
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionHeader title="ສະຖານະປໍ້າ" link={{ to: '/pumps', label: 'ເບິ່ງທັງໝົດ →' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {stations.map((station) => {
              const stationPumps = pumps.filter((p) => p.stationId === station.id);
              const active = stationPumps.filter((p) => p.status === 'active').length;
              const offline = stationPumps.filter((p) => p.status === 'offline').length;
              return (
                <div
                  key={station.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-elevated)',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{station.name}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <StatusBadge label={`${active} ກຳລັງໃຊ້`} tone="success" />
                    {offline > 0 && <StatusBadge label={`${offline} ອອຟລາຍ`} tone="danger" />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 'var(--space-lg)' }}>
      <h1 style={{ fontSize: 26, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--color-text-secondary)', marginTop: 6, fontSize: 14 }}>{subtitle}</p>}
    </div>
  );
}

export function SectionHeader({ title, link }: { title: string; link?: { to: string; label: string } }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
      {link && (
        <Link to={link.to} style={{ fontSize: 12, color: 'var(--color-primary)' }}>
          {link.label}
        </Link>
      )}
    </div>
  );
}

const cellStyle: React.CSSProperties = { padding: '8px 4px', fontSize: 13 };
