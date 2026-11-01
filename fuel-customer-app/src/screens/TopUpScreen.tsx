import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { OnePayQrCard } from '@/components/OnePayQrCard';
import { useApp } from '@/context/AppContext';
import { toLaoError } from '@/lib/errors';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { formatKip } from '@/utils/format';
import { OnePayCharge } from '@/types';

const PRESETS = [50_000, 100_000, 200_000, 500_000];

export default function TopUpScreen() {
  const navigation = useNavigation();
  const { user, createTopUp } = useApp();
  const [amount, setAmount] = useState('100000');
  const [charge, setCharge] = useState<OnePayCharge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const balanceAtStart = useRef(user.walletBalance);

  // ເມື່ອຍອດ wallet ເພີ່ມຂຶ້ນ (realtime) = ເຕີມເງິນສຳເລັດ
  useEffect(() => {
    if (charge && user.walletBalance >= balanceAtStart.current + charge.amount) setDone(true);
  }, [user.walletBalance, charge]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      balanceAtStart.current = user.walletBalance;
      setCharge(await createTopUp(Number(amount.replace(/\D/g, ''))));
    } catch (e) {
      setError(toLaoError(e));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.content, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
          <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
          <Text style={styles.title}>ເຕີມເງິນສຳເລັດ</Text>
          <Text style={styles.subtitle}>ຍອດຄົງເຫຼືອ {formatKip(user.walletBalance)}</Text>
          <PrimaryButton label="ກັບໜ້າຫຼັກ" onPress={() => navigation.goBack()} style={{ alignSelf: 'stretch', marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>ເຕີມເງິນເຂົ້າ Wallet</Text>
        <Text style={styles.subtitle}>ຍອດປັດຈຸບັນ {formatKip(user.walletBalance)}</Text>

        {charge ? (
          <OnePayQrCard charge={charge} title="ສະແກນຈ່າຍເພື່ອເຕີມເງິນ" />
        ) : (
          <>
            <View style={styles.presets}>
              {PRESETS.map((p) => (
                <Pressable key={p} onPress={() => setAmount(String(p))} style={[styles.preset, Number(amount) === p && styles.presetActive]}>
                  <Text style={[styles.presetText, Number(amount) === p && { color: colors.primary }]}>{formatKip(p)}</Text>
                </Pressable>
              ))}
            </View>
            <Card style={{ marginTop: spacing.md }}>
              <Text style={styles.label}>ຈຳນວນເງິນ (ກີບ)</Text>
              <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" style={styles.input} />
            </Card>
            {error && <Text style={styles.error}>{error}</Text>}
            <PrimaryButton
              label={busy ? 'ກຳລັງສ້າງ QR...' : 'ສ້າງ QR ຈ່າຍຜ່ານ BCEL OnePay'}
              onPress={start}
              disabled={busy || !(Number(amount) >= 10000)}
              style={{ marginTop: spacing.lg }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: {
    width: '47%', padding: spacing.md, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center',
  },
  presetActive: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  presetText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { ...typography.h2, color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.xs },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
});
