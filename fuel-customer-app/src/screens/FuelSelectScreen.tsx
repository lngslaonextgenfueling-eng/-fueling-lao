import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { formatKip, formatLiters } from '@/utils/format';
import { FuelMode, FuelType } from '@/types';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MODES: { key: FuelMode; label: string }[] = [
  { key: 'amount', label: 'ຈຳນວນເງິນ' },
  { key: 'liters', label: 'ຈຳນວນລິດ' },
  { key: 'full_tank', label: 'ເຕີມເຕັມ' },
];

export default function FuelSelectScreen() {
  const navigation = useNavigation<Nav>();
  const { fuelPrices, startDraft } = useApp();
  const [fuelType, setFuelType] = useState<FuelType>('95');
  const [mode, setMode] = useState<FuelMode>('amount');
  const [inputValue, setInputValue] = useState('100000');

  const selectedPrice = fuelPrices.find((p) => p.type === fuelType) ?? fuelPrices[0] ?? { type: fuelType, label: fuelType, pricePerLiter: 1 };

  const preview = useMemo(() => {
    const numeric = Number(inputValue.replace(/[^0-9.]/g, '')) || 0;
    if (mode === 'amount') {
      return { amount: numeric, liters: numeric / selectedPrice.pricePerLiter };
    }
    if (mode === 'liters') {
      return { amount: numeric * selectedPrice.pricePerLiter, liters: numeric };
    }
    const tankLiters = 40;
    return { amount: tankLiters * selectedPrice.pricePerLiter, liters: tankLiters };
  }, [inputValue, mode, selectedPrice]);

  function handleContinue() {
    const numeric = Number(inputValue.replace(/[^0-9.]/g, '')) || 0;
    startDraft(fuelType, mode, numeric);
    navigation.navigate('Payment');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>ເລືອກນໍ້າມັນ</Text>
        <Text style={styles.subtitle}>ເລືອກປະເພດນ້ຳມັນ ແລະ ຮູບແບບການລະບຸຈຳນວນ</Text>

        <Text style={styles.sectionLabel}>ປະເພດນ້ຳມັນ</Text>
        <View style={styles.fuelGrid}>
          {fuelPrices.map((p) => {
            const selected = p.type === fuelType;
            return (
              <Pressable
                key={p.type}
                onPress={() => setFuelType(p.type)}
                style={[styles.fuelOption, selected && styles.fuelOptionSelected]}
              >
                <Text style={[styles.fuelOptionLabel, selected && styles.fuelOptionLabelSelected]}>
                  {p.label}
                </Text>
                <Text style={styles.fuelOptionPrice}>{formatKip(p.pricePerLiter)}/ລິດ</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>ຮູບແບບການລະບຸ</Text>
        <View style={styles.modeRow}>
          {MODES.map((m) => {
            const selected = m.key === mode;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                style={[styles.modeChip, selected && styles.modeChipSelected]}
              >
                <Text style={[styles.modeChipLabel, selected && styles.modeChipLabelSelected]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mode !== 'full_tank' && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.inputLabel}>
              {mode === 'amount' ? 'ຈຳນວນເງິນ (ກີບ)' : 'ຈຳນວນລິດ'}
            </Text>
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor={colors.textMuted}
            />
          </Card>
        )}

        <Card style={{ marginTop: spacing.md, backgroundColor: colors.bgElevated }}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>ຈຳນວນລິດໂດຍປະມານ</Text>
            <Text style={styles.previewValue}>{formatLiters(preview.liters)}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>ລວມເປັນເງິນ</Text>
            <Text style={styles.previewValueBig}>{formatKip(preview.amount)}</Text>
          </View>
        </Card>

        <PrimaryButton label="ຕໍ່ໄປ" onPress={handleContinue} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
  fuelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fuelOption: {
    width: '47%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  fuelOptionSelected: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  fuelOptionLabel: { ...typography.h3, color: colors.textPrimary },
  fuelOptionLabelSelected: { color: colors.primary },
  fuelOptionPrice: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeChipLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  modeChipLabelSelected: { color: '#06210F' },
  inputLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    ...typography.h2,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  previewLabel: { ...typography.body, color: colors.textSecondary },
  previewValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  previewValueBig: { ...typography.h2, color: colors.primary },
});
