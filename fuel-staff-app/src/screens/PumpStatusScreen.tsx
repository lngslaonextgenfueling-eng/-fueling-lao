import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { useStaff } from '@/context/StaffContext';
import { toLaoError } from '@/lib/errors';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { formatKip } from '@/utils/format';
import { Pump, PumpStatus as PumpStatusType } from '@/types';

const STATUS_LABEL: Record<PumpStatusType, string> = {
  active: 'ກຳລັງໃຊ້',
  idle: 'ວ່າງ',
  offline: 'ອອຟລາຍ',
};

const STATUS_TONE: Record<PumpStatusType, 'success' | 'neutral' | 'danger'> = {
  active: 'success',
  idle: 'neutral',
  offline: 'danger',
};

export default function PumpStatusScreen() {
  const { pumps, shiftSummaries, orders, setPumpStatus } = useStaff();

  function togglePump(p: Pump) {
    if (p.status === 'active') return;
    const next = p.status === 'offline' ? 'idle' : 'offline';
    Alert.alert(p.label, next === 'offline' ? 'ປິດຫົວຈ່າຍນີ້ (ອອຟລາຍ)?' : 'ເປີດຫົວຈ່າຍນີ້ໃຫ້ໃຊ້ງານ?', [
      { text: 'ຍົກເລີກ', style: 'cancel' },
      { text: 'ຕົກລົງ', onPress: () => setPumpStatus(p.id, next).catch((e) => Alert.alert('ບໍ່ສຳເລັດ', toLaoError(e))) },
    ]);
  }

  const activeCount = pumps.filter((p) => p.status === 'active').length;
  const offlineCount = pumps.filter((p) => p.status === 'offline').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>ສະຖານະຫົວຈ່າຍ</Text>

        <View style={styles.summaryRow}>
          <SummaryPill label="ກຳລັງໃຊ້" value={activeCount} color={colors.primary} />
          <SummaryPill label="ວ່າງ" value={pumps.length - activeCount - offlineCount} color={colors.textSecondary} />
          <SummaryPill label="ອອຟລາຍ" value={offlineCount} color={colors.danger} />
        </View>

        <View style={styles.pumpGrid}>
          {pumps.map((p) => (
            <Pressable key={p.id} style={{ width: '47%' }} onLongPress={() => togglePump(p)}>
              <PumpCard pump={p} orderId={p.currentOrderId} orders={orders} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.hint}>ກົດຄ້າງທີ່ຫົວຈ່າຍ ເພື່ອເປີດ/ປິດ (ອອຟລາຍ)</Text>

        <Text style={styles.sectionLabel}>ຍອດຂາຍມື້ນີ້</Text>
        {shiftSummaries.length === 0 && <Text style={styles.hint}>ຍັງບໍ່ມີການຂາຍມື້ນີ້</Text>}
        <View style={{ gap: spacing.sm }}>
          {shiftSummaries.map((s) => (
            <Card key={s.staffId} style={styles.shiftRow}>
              <View style={styles.shiftIconWrap}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.staffName}>{s.staffName}</Text>
                <Text style={styles.shiftLabel}>{s.shiftLabel}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.staffSales}>{formatKip(s.totalSales)}</Text>
                <Text style={styles.staffOrders}>{s.ordersCompleted} ອໍເດີ</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function PumpCard({
  pump,
  orderId,
  orders,
}: {
  pump: Pump;
  orderId?: string;
  orders: ReturnType<typeof useStaff>['orders'];
}) {
  const relatedOrder = orderId ? orders.find((o) => o.orderId === orderId) : undefined;
  return (
    <Card style={styles.pumpCard}>
      <View style={styles.pumpHeader}>
        <Text style={styles.pumpLabel}>{pump.label}</Text>
        <Ionicons
          name="speedometer"
          size={18}
          color={pump.status === 'active' ? colors.primary : pump.status === 'offline' ? colors.danger : colors.textMuted}
        />
      </View>
      <StatusBadge label={STATUS_LABEL[pump.status]} tone={STATUS_TONE[pump.status]} />
      {relatedOrder && (
        <Text style={styles.pumpOrder} numberOfLines={1}>
          {relatedOrder.customerName} · {relatedOrder.fuelType}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryPill: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  summaryValue: { ...typography.h2 },
  summaryLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  pumpGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pumpCard: { width: '100%' },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  pumpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  pumpLabel: { ...typography.h3, color: colors.textPrimary },
  pumpOrder: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  shiftRow: { flexDirection: 'row', alignItems: 'center' },
  shiftIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  shiftLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  staffSales: { ...typography.body, color: colors.primary, fontWeight: '700' },
  staffOrders: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
