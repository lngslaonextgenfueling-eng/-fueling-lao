import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useDashboard } from '@/context/DashboardContext';
import { timeAgo } from '@/utils/format';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  { to: '/', label: 'ພາບລວມ', icon: '📊' },
  { to: '/live', label: 'Live Feed', icon: '🟢' },
  { to: '/pumps', label: 'ຫົວຈ່າຍ', icon: '⛽' },
  { to: '/sales', label: 'ຍອດຂາຍ', icon: '📈' },
  { to: '/staff', label: 'ພະນັກງານ', icon: '👷' },
  { to: '/settings', label: 'ຕັ້ງຄ່າ', icon: '⚙️' },
];

export function Layout({ email }: { email: string }) {
  const { connected, lastUpdatedAt } = useDashboard();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--color-bg-elevated)',
          borderRight: '1px solid var(--color-border)',
          padding: 'var(--space-md)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-lg)' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            ⛽
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>LNG Fueling</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Dashboard</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-card-alt)' : 'transparent',
              })}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', fontSize: 11, color: 'var(--color-text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}
            >
              ອອກ
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: connected ? 'var(--color-primary)' : 'var(--color-danger)',
              }}
            />
            {connected ? 'ເຊື່ອມຕໍ່ແລ້ວ' : 'ຂາດການເຊື່ອມຕໍ່'}
            <span style={{ marginLeft: 'auto' }}>ອັບເດດ {timeAgo(lastUpdatedAt, now)}</span>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 'var(--space-lg)', maxWidth: 1400 }}>
        <Outlet />
      </main>
    </div>
  );
}
