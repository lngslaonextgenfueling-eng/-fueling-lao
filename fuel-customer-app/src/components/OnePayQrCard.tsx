import React, { useState } from 'react';
import { ActivityIndicator, Text, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { toLaoError } from '@/lib/errors';
import { colors, spacing, typography } from '@/theme/theme';
import { formatKip } from '@/utils/format';
import { OnePayCharge } from '@/types';

// ສະແດງ QR ຂອງ BCEL OnePay ໃຫ້ລູກຄ້າສະແກນດ້ວຍແອັບ BCEL One.
// ເມື່ອເງິນເຂົ້າ, server ອັບເດດຖານຂໍ້ມູນ ແລະ ໜ້າຈໍປ່ຽນເອງຜ່ານ realtime.
export function OnePayQrCard({ charge, title }: { charge: OnePayCharge; title: string }) {
  const { sandboxConfirm } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function simulate() {
    setBusy(true);
    setError(null);
    try {
      await sandboxConfirm(charge.paymentId);
    } catch (e) {
      setError(toLaoError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.amount}>{formatKip(charge.amount)}</Text>
      <View style={styles.qrWrap}>
        <QRCode value={charge.qrString} size={200} backgroundColor={colors.white} />
      </View>
      <Text style={styles.hint}>ເປີດແອັບ BCEL One → ສະແກນ QR ນີ້ເພື່ອຈ່າຍ</Text>
      <View style={styles.waitingRow}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.waiting}>ກຳລັງລໍຖ້າການຢືນຢັນຈາກທະນາຄານ...</Text>
      </View>

      {charge.mode === 'sandbox' && (
        <View style={styles.sandbox}>
          <Text style={styles.sandboxText}>ໂໝດທົດສອບ (ຍັງບໍ່ເຊື່ອມ BCEL ແທ້)</Text>
          <PrimaryButton label={busy ? 'ກຳລັງຈຳລອງ...' : 'ຈຳລອງວ່າຈ່າຍສຳເລັດ'} variant="secondary" onPress={simulate} disabled={busy} />
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.bgElevated, paddingVertical: spacing.lg },
  title: { ...typography.h3, color: colors.textPrimary },
  amount: { ...typography.h1, color: colors.primary, marginTop: spacing.xs },
  qrWrap: { marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.white, borderRadius: 12 },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  waiting: { ...typography.caption, color: colors.textSecondary },
  sandbox: { alignSelf: 'stretch', marginTop: spacing.lg, gap: spacing.xs },
  sandboxText: { ...typography.caption, color: colors.accent, textAlign: 'center' },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
});
