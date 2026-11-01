import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { useStaff } from '@/context/StaffContext';
import { toLaoError } from '@/lib/errors';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { formatKip, formatLiters, formatTime } from '@/utils/format';
import { CustomerOrder, QueueStatus } from '@/types';

const TABS: { key: QueueStatus; label: string }[] = [
  { key: 'pending', label: 'ລໍຖ້າ' },
  { key: 'in_progress', label: 'ກຳລັງດຳເນີນການ' },
  { key: 'completed', label: 'ສຳເລັດແລ້ວ' },
];

export default function QueueScreen() {
  const { orders, completeOrder, refresh } = useStaff();
  const [tab, setTab] = useState<QueueStatus>('pending');
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function handleComplete(orderId: string) {
    completeOrder(orderId).catch((e) => Alert.alert('ບໍ່ສຳເລັດ', toLaoError(e)));
  }

  const filtered = useMemo(() => orders.filter((o) => o.status === tab), [orders, tab]);
  const counts = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === 'pending').length,
      in_progress: orders.filter((o) => o.status === 'in_progress').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    }),
    [orders]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>ຄິວ</Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label} ({counts[t.key]})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.orderId}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<Text style={styles.empty}>ບໍ່ມີລາຍການ</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <QueueRow order={item} onComplete={() => handleComplete(item.orderId)} />
        )}
      />
    </SafeAreaView>
  );
}

function QueueRow({ order, onComplete }: { order: CustomerOrder; onComplete: () => void }) {
  const tone = order.status === 'pending' ? 'warning' : order.status === 'in_progress' ? 'success' : 'neutral';
  const statusLabel =
    order.status === 'pending' ? 'ລໍຖ້າ' : order.status === 'in_progress' ? 'ກຳລັງດຳເນີນການ' : 'ສຳເລັດແລ້ວ';

  return (
    <Card style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.customerName}>{order.customerName}</Text>
        <StatusBadge label={statusLabel} tone={tone as any} />
      </View>
      <Text style={styles.orderId}>{order.orderId}</Text>
      <View style={styles.detailsRow}>
        <Detail icon="water-outline" value={`${order.fuelType} · ${formatLiters(order.liters)}`} />
        <Detail icon="cash-outline" value={formatKip(order.amount)} />
      </View>
      <View style={styles.detailsRow}>
        <Detail icon="time-outline" value={formatTime(order.createdAt)} />
        {order.pumpNumber && <Detail icon="speedometer-outline" value={`ຫົວ ${order.pumpNumber}`} />}
      </View>

      {order.status === 'in_progress' && (
        <Pressable style={styles.completeButton} onPress={onComplete}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.completeButtonText}>ໝາຍວ່າສຳເລັດ</Text>
        </Pressable>
      )}
    </Card>
  );
}

function Detail({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.detailText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  title: { ...typography.h1, color: colors.textPrimary },
  tabRow: { flexDirection: 'row', paddingHorizontal: spacing.md, marginTop: spacing.md, gap: spacing.xs },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: '#06210F' },
  listContent: { padding: spacing.md, paddingTop: spacing.md },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  row: {},
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { ...typography.h3, color: colors.textPrimary },
  orderId: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  detailsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { ...typography.caption, color: colors.textSecondary },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  completeButtonText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
