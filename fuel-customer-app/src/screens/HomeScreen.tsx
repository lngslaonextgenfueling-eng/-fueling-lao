import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { formatKip } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, station, stations, selectStation, locationStatus, confirmedOrder, loading } = useApp();
  const { signOut } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const hasActiveOrder = !!confirmedOrder && ['pending', 'in_progress'].includes(confirmedOrder.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>ສະບາຍດີ,</Text>
            <Text style={styles.userName}>{user.name || 'ລູກຄ້າ'}</Text>
          </View>
          <View style={styles.tierBadge}>
            <Ionicons name="medal-outline" size={14} color={colors.accent} />
            <Text style={styles.tierBadgeText}>{user.tier} Member</Text>
          </View>
          <Pressable onPress={signOut} hitSlop={10} style={{ marginLeft: spacing.sm }}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {hasActiveOrder && (
          <Pressable onPress={() => navigation.navigate('QrVerification')}>
            <Card style={styles.activeBanner}>
              <Ionicons name={confirmedOrder!.status === 'in_progress' ? 'water' : 'qr-code'} size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.activeTitle}>
                  {confirmedOrder!.status === 'in_progress' ? 'ກຳລັງເຕີມນ້ຳມັນ' : 'ທ່ານມີອໍເດີລໍຖ້າເຕີມ'}
                </Text>
                <Text style={styles.stationAddress}>ແຕະເພື່ອເປີດ QR / ເບິ່ງສະຖານະ</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Card>
          </Pressable>
        )}

        {/* Fuel Wallet Card */}
        <Card style={styles.walletCard}>
          <View style={styles.walletTopRow}>
            <Text style={styles.walletLabel}>Fuel Wallet</Text>
            <Ionicons name="wallet-outline" size={20} color={colors.textSecondary} />
          </View>
          <Text style={styles.walletBalance}>{formatKip(user.walletBalance)}</Text>
          <View style={styles.pointsRow}>
            <Ionicons name="star" size={14} color={colors.accent} />
            <Text style={styles.pointsText}>{user.points.toLocaleString()} ຄະແນນ</Text>
          </View>

          <View style={styles.walletActions}>
            <PrimaryButton label="ເຕີມເງິນ" variant="secondary" style={{ flex: 1 }} onPress={() => navigation.navigate('TopUp')} />
            <View style={{ width: spacing.sm }} />
            <PrimaryButton
              label="ເຕີມນ້ຳມັນ"
              style={{ flex: 1 }}
              disabled={!station || hasActiveOrder}
              onPress={() => navigation.navigate('FuelSelect')}
            />
          </View>
        </Card>

        {/* Stations — nearest first */}
        <Text style={styles.sectionLabel}>
          {locationStatus === 'granted' ? 'ປໍ້າໃກ້ທ່ານ' : 'ເລືອກປໍ້າ'}
        </Text>
        {stations.length === 0 && <Text style={styles.stationAddress}>ຍັງບໍ່ມີປໍ້າໃນລະບົບ</Text>}
        {stations.map((s) => {
          const selected = s.id === station?.id;
          return (
            <Pressable key={s.id} onPress={() => selectStation(s.id)}>
              <Card style={[{ marginBottom: spacing.sm }, selected && { borderColor: colors.primary }]}>
                <View style={styles.stationRow}>
                  <View style={styles.stationIconWrap}>
                    <Ionicons name={selected ? 'checkmark-circle' : 'location'} size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.stationName}>{s.name}</Text>
                    <Text style={styles.stationAddress}>{s.address}</Text>
                  </View>
                  {s.distanceKm != null && (
                    <View style={styles.distancePill}>
                      <Text style={styles.distanceText}>{s.distanceKm} ກມ</Text>
                    </View>
                  )}
                </View>
              </Card>
            </Pressable>
          );
        })}

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <QuickAction icon="qr-code-outline" label="QR ຂອງຂ້ອຍ" onPress={() => navigation.navigate('QrVerification')} />
          <QuickAction icon="pricetags-outline" label="ຄູປອງ" onPress={() => navigation.navigate('Tabs', { screen: 'Loyalty' })} />
          <QuickAction icon="time-outline" label="ປະຫວັດ" onPress={() => navigation.navigate('Tabs', { screen: 'History' })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickIconWrap}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greeting: { ...typography.caption, color: colors.textSecondary },
  userName: { ...typography.h2, color: colors.textPrimary, marginTop: 2 },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    gap: 4,
  },
  tierBadgeText: { ...typography.caption, color: colors.accent, fontWeight: '600' },
  walletCard: { backgroundColor: colors.bgElevated },
  activeBanner: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, borderColor: colors.primary },
  activeTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  walletTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { ...typography.body, color: colors.textSecondary },
  walletBalance: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xs },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  pointsText: { ...typography.caption, color: colors.textSecondary },
  walletActions: { flexDirection: 'row', marginTop: spacing.md },
  stationRow: { flexDirection: 'row', alignItems: 'center' },
  stationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationName: { ...typography.h3, color: colors.textPrimary },
  stationAddress: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  distancePill: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  distanceText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  quickAction: { alignItems: 'center', flex: 1 },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
