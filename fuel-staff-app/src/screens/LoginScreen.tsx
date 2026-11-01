import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { toLaoError } from '@/lib/errors';
import { colors, radius, spacing, typography } from '@/theme/theme';

// ພະນັກງານບໍ່ສະໝັກເອງ — ຜູ້ຈັດການສ້າງບັນຊີ ແລະ ແຕ່ງຕັ້ງໃຫ້ຈາກ Dashboard
export default function LoginScreen({ notice }: { notice?: string }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(toLaoError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="person-circle" size={34} color="#06210F" />
          </View>
          <Text style={styles.title}>LNGS Staff</Text>
          <Text style={styles.subtitle}>ເຂົ້າສູ່ລະບົບສຳລັບພະນັກງານປໍ້າ</Text>

          {notice && <Text style={styles.notice}>{notice}</Text>}

          <Card style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <Text style={styles.label}>ອີເມວ</Text>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
            <Text style={styles.label}>ລະຫັດຜ່ານ</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
          </Card>

          {error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton
            label={busy ? 'ກະລຸນາລໍຖ້າ...' : 'ເຂົ້າສູ່ລະບົບ'}
            onPress={submit}
            disabled={busy || !email.includes('@') || password.length < 6}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingTop: spacing.xl },
  logo: {
    width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md },
  subtitle: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  notice: {
    ...typography.caption, color: colors.danger, textAlign: 'center', marginTop: spacing.md,
    backgroundColor: 'rgba(239,68,68,0.12)', padding: spacing.sm, borderRadius: radius.md,
  },
  label: { ...typography.caption, color: colors.textSecondary },
  input: {
    ...typography.body, color: colors.textPrimary, backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10,
  },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.md, textAlign: 'center' },
});
