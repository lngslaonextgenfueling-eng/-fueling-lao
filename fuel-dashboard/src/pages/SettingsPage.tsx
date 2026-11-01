import React, { useEffect, useState } from 'react';
import { supabase, toLaoError } from '@/lib/supabase';
import { useDashboard } from '@/context/DashboardContext';
import { Card } from '@/components/Card';
import { PageHeader, SectionHeader } from './OverviewPage';
import { formatKip } from '@/utils/format';

const field: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-elevated)',
  color: 'var(--color-text-primary)',
  fontSize: 14,
};
const btn: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  background: 'var(--color-primary)',
  color: '#06210F',
  fontWeight: 700,
  cursor: 'pointer',
};

interface StaffRow {
  id: string;
  full_name: string;
  role: string;
  station_id: string | null;
}

export default function SettingsPage() {
  const { fuelPrices, stations, refreshAll } = useDashboard();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [stationId, setStationId] = useState('');
  const [team, setTeam] = useState<StaffRow[]>([]);

  useEffect(() => {
    setPrices(Object.fromEntries(fuelPrices.map((p) => [p.fuelType, String(p.pricePerLiter)])));
  }, [fuelPrices]);

  useEffect(() => {
    if (!stationId && stations[0]) setStationId(stations[0].id);
  }, [stations, stationId]);

  async function loadTeam() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, station_id')
      .neq('role', 'customer')
      .order('role');
    setTeam(data ?? []);
  }
  useEffect(() => {
    loadTeam();
  }, []);

  async function savePrice(fuelType: string) {
    setMsg(null);
    const value = Math.round(Number(prices[fuelType]));
    if (!(value > 0)) return setMsg({ text: 'ລາຄາບໍ່ຖືກຕ້ອງ', ok: false });
    const { error } = await supabase.rpc('set_fuel_price', { p_fuel_type: fuelType, p_price: value });
    if (error) return setMsg({ text: toLaoError(error), ok: false });
    setMsg({ text: `ບັນທຶກລາຄາ ${fuelType} = ${formatKip(value)} ແລ້ວ`, ok: true });
    refreshAll();
  }

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.rpc('assign_staff', {
      p_email: email.trim(),
      p_role: role,
      p_station_id: role === 'staff' ? stationId : null,
    });
    if (error) return setMsg({ text: toLaoError(error), ok: false });
    setMsg({ text: `ແຕ່ງຕັ້ງ ${email} ເປັນ ${role} ແລ້ວ`, ok: true });
    setEmail('');
    loadTeam();
  }

  const stationName = (id: string | null) => stations.find((s) => s.id === id)?.name ?? '-';

  return (
    <div>
      <PageHeader title="ຕັ້ງຄ່າ" subtitle="ລາຄານ້ຳມັນ ແລະ ການແຕ່ງຕັ້ງພະນັກງານ" />
      {msg && (
        <p style={{ color: msg.ok ? 'var(--color-primary)' : 'var(--color-danger)', fontSize: 14 }}>{msg.text}</p>
      )}

      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <SectionHeader title="ລາຄານ້ຳມັນ (ກີບ/ລິດ)" />
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>ລາຄາໃໝ່ມີຜົນທັນທີ ກັບອໍເດີທີ່ສ້າງຫຼັງຈາກນີ້.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {fuelPrices.map((p) => (
            <div key={p.fuelType} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 90, fontWeight: 600 }}>{p.label}</span>
              <input
                style={{ ...field, width: 100 }}
                inputMode="numeric"
                value={prices[p.fuelType] ?? ''}
                onChange={(e) => setPrices((s) => ({ ...s, [p.fuelType]: e.target.value }))}
              />
              <button style={btn} onClick={() => savePrice(p.fuelType)}>
                ບັນທຶກ
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <SectionHeader title="ແຕ່ງຕັ້ງພະນັກງານ" />
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          ຂັ້ນຕອນ: (1) ໃຫ້ພະນັກງານສະໝັກບັນຊີດ້ວຍອີເມວ (ຜ່ານແອັບລູກຄ້າ ຫຼື ສ້າງໃນ Supabase → Authentication) →
          (2) ໃສ່ອີເມວຢູ່ນີ້ ແລ້ວເລືອກປໍ້າປະຈຳ → (3) ໃຫ້ພະນັກງານເຂົ້າສູ່ລະບົບໃນແອັບ Staff.
        </p>
        <form onSubmit={assign} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...field, minWidth: 220 }} type="email" placeholder="ອີເມວພະນັກງານ" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <select style={field} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="staff">ພະນັກງານ (staff)</option>
            <option value="manager">ຜູ້ຈັດການ (manager)</option>
            <option value="customer">ຖອນສິດ → ລູກຄ້າ</option>
          </select>
          {role === 'staff' && (
            <select style={field} value={stationId} onChange={(e) => setStationId(e.target.value)}>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <button style={btn} type="submit">
            ບັນທຶກ
          </button>
        </form>

        <table style={{ width: '100%', marginTop: 16, fontSize: 14, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: 'var(--color-text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: 6 }}>ຊື່</th>
              <th style={{ padding: 6 }}>ບົດບາດ</th>
              <th style={{ padding: 6 }}>ປໍ້າ</th>
            </tr>
          </thead>
          <tbody>
            {team.map((t) => (
              <tr key={t.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: 6 }}>{t.full_name || '-'}</td>
                <td style={{ padding: 6 }}>{t.role}</td>
                <td style={{ padding: 6 }}>{stationName(t.station_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
