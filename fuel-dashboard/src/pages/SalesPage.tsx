import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useDashboard } from '@/context/DashboardContext';
import { Card } from '@/components/Card';
import { KpiCard } from '@/components/KpiCard';
import { PageHeader, SectionHeader } from './OverviewPage';
import { formatKip, formatKipShort, formatLiters } from '@/utils/format';

const FUEL_COLORS: Record<string, string> = {
  '91': '#22C55E',
  '95': '#FACC15',
  Diesel: '#3B82F6',
  E20: '#F97316',
};

export default function SalesPage() {
  const { hourlySales, fuelShare, completedToday } = useDashboard();

  const totalAmount = hourlySales.reduce((sum, h) => sum + h.amount, 0);
  const totalLiters = hourlySales.reduce((sum, h) => sum + h.liters, 0);
  const avgTicket = totalAmount / Math.max(1, completedToday);

  return (
    <div>
      <PageHeader title="ຍອດຂາຍ" subtitle="ສະຫຼຸບຍອດຂາຍມື້ນີ້ ແຍກຕາມຊົ່ວໂມງ ແລະ ປະເພດນ້ຳມັນ" />

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <KpiCard label="ຍອດຂາຍລວມ" value={formatKip(totalAmount)} accent="var(--color-primary)" />
        <KpiCard label="ນ້ຳມັນລວມ" value={formatLiters(totalLiters)} />
        <KpiCard label="ຄ່າສະເລ່ຍ/ອໍເດີ" value={formatKipShort(avgTicket)} />
      </div>

      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <SectionHeader title="ຍອດຂາຍຕາມຊົ່ວໂມງ" />
        <div style={{ height: 280, marginTop: 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="hour" stroke="var(--color-text-muted)" fontSize={12} />
              <YAxis
                stroke="var(--color-text-muted)"
                fontSize={12}
                tickFormatter={(v) => formatKipShort(v)}
                width={60}
              />
              <Tooltip
                contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
                formatter={(value: number) => formatKip(value)}
              />
              <Line type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        <Card>
          <SectionHeader title="ລິດ ແຍກຕາມປະເພດນ້ຳມັນ" />
          <div style={{ height: 260, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelShare}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="fuelType" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
                  formatter={(value: number) => formatLiters(value)}
                />
                <Bar dataKey="liters" radius={[6, 6, 0, 0]}>
                  {fuelShare.map((entry) => (
                    <Cell key={entry.fuelType} fill={FUEL_COLORS[entry.fuelType]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeader title="ສ່ວນແບ່ງຍອດຂາຍ (ກີບ)" />
          <div style={{ height: 260, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fuelShare}
                  dataKey="amount"
                  nameKey="fuelType"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {fuelShare.map((entry) => (
                    <Cell key={entry.fuelType} fill={FUEL_COLORS[entry.fuelType]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
                  formatter={(value: number) => formatKip(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
