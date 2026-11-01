import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Card } from '@/components/Card';
import { PageHeader } from './OverviewPage';
import { formatKip } from '@/utils/format';

export default function StaffPage() {
  const { staffStats, stations } = useDashboard();
  const ranked = [...staffStats].sort((a, b) => b.totalSales - a.totalSales);
  const topSales = ranked[0]?.totalSales ?? 1;

  return (
    <div>
      <PageHeader title="ພະນັກງານ" subtitle="ອັນດັບຍອດຂາຍປະຈຳກະ, ແຍກຕາມປໍ້າ" />

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ranked.map((s, i) => {
            const station = stations.find((st) => st.id === s.stationId);
            const widthPct = Math.max(8, (s.totalSales / topSales) * 100);
            return (
              <div key={s.staffId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <RankBadge rank={i + 1} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{s.staffName}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {station?.name ?? s.stationId} · {s.ordersCompleted} ອໍເດີ
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatKip(s.totalSales)}</div>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: 'var(--color-bg-elevated)',
                    marginTop: 8,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${widthPct}%`,
                      background: i === 0 ? 'var(--color-accent)' : 'var(--color-primary)',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const bg = rank === 1 ? 'var(--color-accent)' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--color-card-alt)';
  const color = rank <= 3 ? '#1a1a1a' : 'var(--color-text-secondary)';
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        background: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {rank}
    </div>
  );
}
