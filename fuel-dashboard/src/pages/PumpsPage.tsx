import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader } from './OverviewPage';
import { Pump, PumpStatus } from '@/types';

const STATUS_LABEL: Record<PumpStatus, string> = {
  active: 'ກຳລັງໃຊ້',
  idle: 'ວ່າງ',
  offline: 'ອອຟລາຍ',
};

const STATUS_TONE: Record<PumpStatus, 'success' | 'neutral' | 'danger'> = {
  active: 'success',
  idle: 'neutral',
  offline: 'danger',
};

const STATUS_COLOR: Record<PumpStatus, string> = {
  active: 'var(--color-primary)',
  idle: 'var(--color-text-muted)',
  offline: 'var(--color-danger)',
};

export default function PumpsPage() {
  const { stations, pumps, liveOrders } = useDashboard();

  return (
    <div>
      <PageHeader title="ສະຖານະຫົວຈ່າຍ" subtitle="ທຸກປໍ້າ, ອັບເດດ Real-time ຈາກ Live Stream Feed" />

      {stations.map((station) => {
        const stationPumps = pumps.filter((p) => p.stationId === station.id);
        return (
          <Card key={station.id} style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>{station.name}</h3>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                <LegendDot color={STATUS_COLOR.active} label="ກຳລັງໃຊ້" />
                <LegendDot color={STATUS_COLOR.idle} label="ວ່າງ" />
                <LegendDot color={STATUS_COLOR.offline} label="ອອຟລາຍ" />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 10,
                marginTop: 'var(--space-md)',
              }}
            >
              {stationPumps.map((p) => (
                <PumpTile key={p.id} pump={p} orders={liveOrders} />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function PumpTile({ pump, orders }: { pump: Pump; orders: ReturnType<typeof useDashboard>['liveOrders'] }) {
  const order = pump.currentOrderId ? orders.find((o) => o.orderId === pump.currentOrderId) : undefined;
  return (
    <div
      style={{
        border: `1px solid ${pump.status === 'offline' ? 'var(--color-danger)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 12,
        background: 'var(--color-bg-elevated)',
        minHeight: 90,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>ຫົວ {pump.pumpNumber}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <StatusBadge label={STATUS_LABEL[pump.status]} tone={STATUS_TONE[pump.status]} />
      </div>
      {order && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-secondary)' }}>
          <div>{order.customerName}</div>
          <div>{order.fuelType}</div>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
      {label}
    </span>
  );
}
