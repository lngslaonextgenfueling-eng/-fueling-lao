import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { toLaoError } from '@/lib/errors';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { formatKip, formatLiters } from '@/utils/format';
import { PaymentMethod } from '@/types';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const METHODS: { key: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap; sub: string }[] = [
  { key: 'wallet', label: 'Fuel Wallet', icon: 'wallet-outline', sub: 'ຕັດເງິນທັນທີຈາກ wallet' },
  { key: 'one_pay', label: 'One Pay (BCEL QR)', icon: 'qr-code-outline', sub: 'ສະແກນຈ່າຍຜ່ານແອັບທະນາຄານ' },
  { key: 'cash', label: 'ຈ່າຍເງິນສົດຢູ່ປໍ້າ', icon: 'cash-outline', sub: 'ຈ່າຍໃຫ້ພະນັກງານ ກ່ອນເຕີມນ້ຳມັນ' },
];

export default function PaymentScreen() {
  const navigation = useNavigation<Nav>();
  const { draft, user, setPaymentMethod, confirmOrder } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!draft) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: colors.textPrimary, padding: spacing.md }}>ບໍ່ພົບລາຍການສັ່ງຊື້.</Text>
      </SafeAreaView>
    );
  }

  const total = draft.amount - draft.discount;
  const insufficientWallet = draft.paymentMethod === 'wallet' && user.walletBalance < total;

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await confirmOrder();
      navigation.navigate('QrVerification');
    } catch (e) {
      setError(toLaoError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>ສະຫຼຸບການຈ່າຍເງິນ</Text>

        <Card style={{ marginTop: spacing.md }}>
          <SummaryRow label="ປໍ້າ" value={draft.station.name} />
          <SummaryRow label="ປະເພດນ້ຳມັນ" value={draft.fuelType} />
          <SummaryRow label="ຈຳນວນລິດ" value={formatLiters(draft.liters)} />
          <SummaryRow label="ລາຄາລວມ" value={formatKip(draft.amount)} />
          <SummaryRow label="ສ່ວນຫຼຸດ" value={`- ${formatKip(draft.discount)}`} />
          <View style={styles.divider} />
          <SummaryRow label="ຍອດຕ້ອງຈ່າຍ" value={formatKip(total)} big />
          <View style={styles.pointsRow}>
            <Ionicons name="star" size={14} color={colors.accent} />
            <Text style={styles.pointsText}>ຈະໄດ້ຮັບ {draft.pointsEarned} ຄະແນນ</Text>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>ຊ່ອງທາງການຈ່າຍເງິນ</Text>
        <View style={{ gap: spacing.sm }}>
          {METHODS.map((m) => {
            const selected = draft.paymentMethod === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setPaymentMethod(m.key)}
                style={[styles.methodRow, selected && styles.methodRowSelected]}
              >
                <View style={styles.methodIconWrap}>
                  <Ionicons name={m.icon} size={20} color={selected ? colors.primary : colors.textSecondary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Text style={styles.methodSub}>
                    {m.key === 'wallet' ? `ຍອດຄົງເຫຼືອ ${formatKip(user.walletBalance)}` : m.sub}
                  </Text>
                </View>
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selected ? colors.primary : colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>

        {insufficientWallet && (
          <Text style={styles.warning}>ຍອດເງິນໃນ Wallet ບໍ່ພຽງພໍ, ກະລຸນາເຕີມເງິນ ຫຼື ເລືອກຊ່ອງທາງອື່ນ.</Text>
        )}

        {error && <Text style={styles.warning}>{error}</Text>}

        <Text style={styles.note}>* ຍອດສຸດທ້າຍຄິດໄລ່ຕາມລາຄານ້ຳມັນປັດຈຸບັນຂອງປໍ້າ</Text>

        <PrimaryButton
          label={busy ? 'ກຳລັງດຳເນີນການ...' : `ຢືນຢັນ ແລະ ຈ່າຍ ${formatKip(total)}`}
          onPress={handleConfirm}
          disabled={insufficientWallet || busy}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={big ? styles.summaryValueBig : styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  summaryValueBig: { ...typography.h2, color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  pointsText: { ...typography.caption, color: colors.textSecondary },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  methodRowSelected: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  methodIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  methodSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  warning: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  note: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
});
