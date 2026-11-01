import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme/theme';

interface Props {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function Numpad({ value, onChange, maxLength = 4 }: Props) {
  function handlePress(key: string) {
    if (key === '') return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length < maxLength) {
      onChange(value + key);
    }
  }

  return (
    <View>
      <View style={styles.dotsRow}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
        ))}
      </View>
      <View style={styles.grid}>
        {KEYS.map((key, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [
              styles.key,
              key === '' && styles.keyGhost,
              pressed && key !== '' && styles.keyPressed,
            ]}
            onPress={() => handlePress(key)}
            disabled={key === ''}
          >
            {key === 'del' ? (
              <Ionicons name="backspace-outline" size={22} color={colors.textPrimary} />
            ) : (
              <Text style={styles.keyLabel}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.lg },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  key: {
    width: '30%',
    aspectRatio: 1.6,
    margin: '1.5%',
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyGhost: { backgroundColor: 'transparent', borderWidth: 0 },
  keyPressed: { backgroundColor: colors.cardAlt },
  keyLabel: { ...typography.h2, color: colors.textPrimary },
});
