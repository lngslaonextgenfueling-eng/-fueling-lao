import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { OnePayQrCard } from '@/components/OnePayQrCard';
import { useApp } from '@/context/AppContext';
import { toLaoError } from '@/lib/errors';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { formatKip, formatLiters, mmss } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function QrVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const { confirmedOrder, onePayCharge, payOrderWithOnePay, cancelOrder, clearConfirmedOrder } = useApp();
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ເປີດໜ້ານີ້ຄືນ ຕອນອໍເດີ OnePay ຍັງບໍ່ຈ່າຍ → ດຶງ QR ຈ່າຍເງິນຄືນ
  const needsOnePay = confirmedOrder?.status === 'pending' && confirmedOrder.paymentStatus === 'pending';
  useEffect(() => {
    if (needsOnePay && !onePayCharge) payOrderWithOnePay().catch((e) => setError(toLaoError(e)));
  }, [needsOnePay, onePayCharge, payOrderWithOnePay]);

  function goHome() {
    clearConfirmedOrder();
    navigation.popToTop();
  }

  async function handleCancel() {
    setBusy(true);
    setError(null);
    try {
      await cancelOrder();
      navigation.popToTop();
    } catch (e) {
      setError(toLaoError(e));
    } finally {
      setBusy(false);
    }
  }

  if (!confirmedOrder) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="qr-code-outline" size={48} color={colors.textMuted} />
          <Text style={styles.subtitle}>ທ່ານຍັງບໍ່ມີອໍເດີທີ່ລໍຖ້າເຕີມ</Text>
          <PrimaryButton label="ກັບໜ້າຫຼັກ" onPress={() => navigation.popToTop()} style={styles.fullBtn} />
        </View>
      </SafeAreaView>
    );
  }

  const o = confirmedOrder;
  const remaining = o.expiresAt - now;
  const expired = o.status === 'expired' || (o.status === 'pending' && remaining <= 0);

  // ---- ສະຖານະ: ກຳລັງເຕີມ / ສຳເລັດ / ຍົກເລີກ ----
  if (o.status === 'in_progress' || o.status === 'completed' || o.status === 'cancelled' || expired) {
    const view =
      o.status === 'in_progress'
        ? { icon: 'water' as const, color: colors.blue, title: 'ກຳລັງເຕີມນ້ຳມັນ', sub: `ຫົວຈ່າຍທີ ${o.pumpNumber ?? '-'}` }
        : o.status === 'completed'
        ? { icon: 'checkmark-circle' as const, color: colors.primary, title: 'ເຕີມນ້ຳມັນສຳເລັດ', sub: `ໄດ້ຮັບ ${o.pointsEarned} ຄະແນນ` }
        : o.status === 'cancelled'
        ? { icon: 'close-circle' as const, color: colors.textMuted, title: 'ຍົກເລີກອໍເດີແລ້ວ', sub: 'ເງິນຄືນເຂົ້າ Wallet ແລ້ວ (ຖ້າຈ່າຍແລ້ວ)' }
        : { icon: 'time' as const, color: colors.danger, title: 'ອໍເດີໝົດອາຍຸ', sub: 'ເງິນທີ່ຈ່າຍແລ້ວ ຈະຄືນເຂົ້າ Wallet ອັດຕະໂນມັດ' };
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {o.status === 'in_progress' ? (
            <ActivityIndicator size="large" color={view.color} />
          ) : (
            <Ionicons name={view.icon} size={72} color={view.color} />
          )}
          <Text style={styles.title}>{view.title}</Text>
          <Text style={styles.subtitle}>{view.sub}</Text>
          <Card style={{ alignSelf: 'stretch', marginTop: spacing.lg }}>
            <Row label="ເລກທີ່ອໍເດີ" value={o.orderId} />
            <Row label="ປໍ້າ" value={o.stationName} />
            <Row label="ນ້ຳມັນ" value={`${o.fuelType} · ${formatLiters(o.liters)}`} />
            <Row label="ຍອດຈ່າຍ" value={formatKip(o.amount - o.discount)} />
          </Card>
          <PrimaryButton label="ກັບໜ້າຫຼັກ" onPress={goHome} style={styles.fullBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {needsOnePay ? (
          <>
            <Text style={styles.title}>ຈ່າຍເງິນກ່ອນ</Text>
            <Text style={styles.subtitle}>ຫຼັງຈ່າຍສຳເລັດ ລະຫັດຮັບນ້ຳມັນຈະສະແດງອັດຕະໂນມັດ</Text>
            {onePayCharge ? (
              <OnePayQrCard charge={onePayCharge} title="BCEL OnePay" />
            ) : (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
            )}
          </>
        ) : (
          <>
            <Text style={styles.title}>ສະແດງລະຫັດນີ້ໃຫ້ພະນັກງານ</Text>
            <Text style={styles.subtitle}>
              {o.paymentMethod === 'cash'
                ? 'ຈ່າຍເງິນສົດໃຫ້ພະນັກງານ ແລ້ວໃຫ້ສະແກນ QR ຫຼື ແຈ້ງ PIN 4 ໂຕ'
                : 'ສະແກນ QR ຫຼື ແຈ້ງ PIN 4 ໂຕ ໃຫ້ພະນັກງານປ້ອນໃສ່ Numpad'}
            </Text>

            <Card style={styles.qrCard}>
              <View style={styles.qrWrap}>
                <QRCode value={o.qrPayload} size={200} backgroundColor={colors.white} />
              </View>
              <Text style={styles.pinLabel}>PIN ສຳຮອງ</Text>
              <View style={styles.pinRow}>
                {o.pin.split('').map((digit, i) => (
                  <View key={i} style={styles.pinDigitBox}>
                    <Text style={styles.pinDigit}>{digit}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.timerPill}>
                <Text style={styles.timerText}>ໝົດອາຍຸໃນ {mmss(remaining)}</Text>
              </View>
            </Card>
          </>
        )}

        <Card style={{ marginTop: spacing.md }}>
          <Row label="ເລກທີ່ອໍເດີ" value={o.orderId} />
          <Row label="ປໍ້າ" value={o.stationName} />
          <Row label="ນ້ຳມັນ" value={`${o.fuelType} · ${formatLiters(o.liters)}`} />
          <Row label="ຍອດຈ່າຍ" value={formatKip(o.amount - o.discount)} />
        </Card>

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton label="ກັບໜ້າຫຼັກ (ອໍເດີຍັງຢູ່)" variant="secondary" onPress={goHome} style={{ marginTop: spacing.lg }} />
        <PrimaryButton
          label={busy ? 'ກຳລັງຍົກເລີກ...' : 'ຍົກເລີກອໍເດີ'}
          variant="danger"
          onPress={handleCancel}
          disabled={busy}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center' },
  fullBtn: { alignSelf: 'stretch', marginTop: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.sm },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  qrCard: { alignItems: 'center', backgroundColor: colors.bgElevated, paddingVertical: spacing.lg },
  qrWrap: { padding: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md },
  pinLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.lg },
  pinRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  pinDigitBox: {
    width: 44,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDigit: { ...typography.h2, color: colors.textPrimary },
  timerPill: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  timerText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  rowLabel: { ...typography.caption, color: colors.textSecondary },
  rowValue: { ...typography.caption, color: colors.textPrimary, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
