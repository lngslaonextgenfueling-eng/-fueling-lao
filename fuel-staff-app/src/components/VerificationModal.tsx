import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useStaff } from '@/context/StaffContext';
import { toLaoError } from '@/lib/errors';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { formatKip, formatLiters } from '@/utils/format';
import { CustomerOrder } from '@/types';

interface Props {
  order: CustomerOrder | null;
  onClose: () => void;
  onApproved: (orderId: string) => void;
}

export function VerificationModal({ order, onClose, onApproved }: Props) {
  const { pumps, approveOrder } = useStaff();
  const [selectedPump, setSelectedPump] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const availablePumps = pumps.filter((p) => p.status !== 'offline');
  const isCash = order.paymentMethod === 'cash';

  async function handleApprove() {
    if (!order || selectedPump === null) return;
    setBusy(true);
    setError(null);
    try {
      await approveOrder(order.orderId, selectedPump);
      setSelectedPump(null);
      onApproved(order.orderId);
    } catch (e) {
      setError(toLaoError(e));
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    setSelectedPump(null);
    setError(null);
    onClose();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>ຢືນຢັນການສັ່ງຊື້</Text>
              <Pressable onPress={handleClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Card style={{ marginTop: spacing.md }}>
              <Row label="ລູກຄ້າ" value={order.customerName} />
              <Row label="ເລກທີ່ອໍເດີ" value={order.orderId} />
              <View style={styles.divider} />
              <Row label="ປະເພດນ້ຳມັນ" value={order.fuelType} big />
              <Row label="ຈຳນວນລິດ" value={formatLiters(order.liters)} />
              <Row label="ຍອດເງິນ" value={formatKip(order.amount)} big />
              <Row
                label="ການຈ່າຍ"
                value={isCash ? 'ເງິນສົດ (ຍັງບໍ່ຈ່າຍ)' : order.paymentMethod === 'wallet' ? 'Wallet (ຈ່າຍແລ້ວ)' : 'OnePay (ຈ່າຍແລ້ວ)'}
              />
            </Card>

            {isCash && (
              <View style={styles.cashBanner}>
                <Ionicons name="cash-outline" size={18} color={colors.accent} />
                <Text style={styles.cashText}>ຮັບເງິນສົດ {formatKip(order.amount)} ຈາກລູກຄ້າ ກ່ອນກົດອະນຸມັດ</Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>ເລືອກຫົວຈ່າຍ (Pump)</Text>
            <View style={styles.pumpGrid}>
              {availablePumps.map((p) => {
                const selected = selectedPump === p.number;
                const inUse = p.status === 'active';
                return (
                  <Pressable
                    key={p.id}
                    disabled={inUse}
                    onPress={() => setSelectedPump(p.number)}
                    style={[
                      styles.pumpOption,
                      selected && styles.pumpOptionSelected,
                      inUse && styles.pumpOptionBusy,
                    ]}
                  >
                    <Text style={[styles.pumpLabel, selected && styles.pumpLabelSelected]}>{p.label}</Text>
                    <Text style={styles.pumpStatus}>{inUse ? 'ກຳລັງໃຊ້' : 'ວ່າງ'}</Text>
                  </Pressable>
                );
              })}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <PrimaryButton
              label={busy ? 'ກຳລັງອະນຸມັດ...' : isCash ? 'ຮັບເງິນແລ້ວ · ເລີ່ມເຕີມນ້ຳມັນ' : 'ອະນຸມັດ · ເລີ່ມເຕີມນ້ຳມັນ'}
              onPress={handleApprove}
              disabled={selectedPump === null || busy}
              style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={big ? styles.rowValueBig : styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h2, color: colors.textPrimary },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  rowValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  rowValueBig: { ...typography.h3, color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  pumpGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pumpOption: {
    width: '30%',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  pumpOptionSelected: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  pumpOptionBusy: { opacity: 0.5 },
  pumpLabel: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  pumpLabelSelected: { color: colors.primary },
  pumpStatus: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  cashBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md,
    padding: spacing.sm, borderRadius: radius.md, backgroundColor: 'rgba(250,204,21,0.12)',
  },
  cashText: { ...typography.caption, color: colors.accent, flex: 1, fontWeight: '600' },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.md, textAlign: 'center' },
});
