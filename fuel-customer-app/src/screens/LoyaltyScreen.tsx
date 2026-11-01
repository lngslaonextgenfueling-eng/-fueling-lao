import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { useApp } from '@/context/AppContext';
import { colors, radius, spacing, typography } from '@/theme/theme';

export default function LoyaltyScreen() {
  const { user, coupons } = useApp();
  const progress = Math.min(1, user.points / user.pointsToNextTier);
  const remaining = Math.max(0, user.pointsToNextTier - user.points);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Loyalty</Text>

        <Card style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <Ionicons name="medal" size={28} color={colors.accent} />
            <View style={{ marginLeft: spacing.sm }}>
              <Text style={styles.tierName}>{user.tier} Member</Text>
              <Text style={styles.tierSub}>
                {user.points.toLocaleString()} ຄະແນນ
                {user.nextTier ? ` · ອີກ ${remaining.toLocaleString()} ຄະແນນ ເຖິງ ${user.nextTier}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{user.tier}</Text>
            <Text style={styles.progressLabel}>{user.nextTier ?? 'Max Tier'}</Text>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>ສິດທິປະໂຫຍດ ແລະ ຄູປອງ</Text>
        <View style={{ gap: spacing.sm }}>
          {coupons.map((c) => (
            <Card key={c.id} style={styles.couponRow}>
              <View style={styles.couponIconWrap}>
                <Ionicons name="pricetag" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.couponTitle}>{c.title}</Text>
                <Text style={styles.couponDesc}>{c.description}</Text>
                <Text style={styles.couponExpiry}>ໝົດອາຍຸ {c.expiresOn}</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  tierCard: { backgroundColor: colors.bgElevated },
  tierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  tierName: { ...typography.h3, color: colors.textPrimary },
  tierSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  progressLabel: { ...typography.caption, color: colors.textSecondary },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  couponRow: { flexDirection: 'row', alignItems: 'flex-start' },
  couponIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  couponDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  couponExpiry: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
});
