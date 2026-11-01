import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme/theme';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const TONE_COLORS: Record<Tone, string> = {
  success: colors.primary,
  warning: colors.warning,
  danger: colors.danger,
  neutral: colors.textMuted,
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const color = TONE_COLORS[tone];
  return (
    <View style={[styles.badge, { backgroundColor: `${color}26`, borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '700' },
});
