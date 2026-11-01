import React from 'react';
import { Card } from './Card';

export function KpiCard({
  label,
  value,
  sublabel,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card style={{ background: 'var(--color-bg-elevated)', flex: 1, minWidth: 180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{label}</span>
        {icon && <span style={{ color: accent ?? 'var(--color-text-secondary)' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: accent ?? 'var(--color-text-primary)' }}>
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{sublabel}</div>
      )}
    </Card>
  );
}
