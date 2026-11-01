import React from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const TONE_COLORS: Record<Tone, string> = {
  success: 'var(--color-primary)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  neutral: 'var(--color-text-muted)',
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const color = TONE_COLORS[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        border: `1px solid ${color}`,
        background: `${color}22`,
        color,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}
