import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { useApp } from '@/context/AppContext';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { formatKip, formatLiters } from '@/utils/format';
import { Transaction } from '@/types';

export default function HistoryScreen() {
  const { transactions } = useApp();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<Text style={styles.title}>ປະຫວັດການເຕີມນ້ຳມັນ</Text>}
        ListEmptyComponent={<Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>ຍັງບໍ່ມີປະຫວັດການເຕີມນ້ຳມັນ</Text>}
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </SafeAreaView>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <Card style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name="water" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <View style={styles.rowTop}>
          <Text style={styles.fuelType}>{transaction.fuelType}</Text>
          <Text style={styles.amount}>{formatKip(transaction.amount)}</Text>
        </View>
        <Text style={styles.stationName}>{transaction.stationName}</Text>
        <View style={styles.rowBottom}>
          <Text style={styles.meta}>
            {transaction.date} · {transaction.time}
          </Text>
          <Text style={styles.meta}>{formatLiters(transaction.liters)}</Text>
          <View style={styles.pointsTag}>
            <Ionicons name="star" size={10} color={colors.accent} />
            <Text style={styles.pointsTagText}>+{transaction.pointsEarned}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  fuelType: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  amount: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  stationName: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  meta: { ...typography.caption, color: colors.textMuted },
  pointsTag: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 'auto' },
  pointsTagText: { ...typography.caption, color: colors.accent, fontWeight: '600' },
});
