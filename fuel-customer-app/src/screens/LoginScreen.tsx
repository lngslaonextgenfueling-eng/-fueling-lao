import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { toLaoError } from '@/lib/errors';
import { colors, radius, spacing, typography } from '@/theme/theme';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const canSubmit =
    email.includes('@') && password.length >= 6 && (mode === 'signin' || (fullName.trim().length > 1 && phone.trim().length >= 8));

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        const { needsConfirm } = await signUp({ email, password, fullName, phone });
        if (needsConfirm) {
          setMessage({ text: 'ສະໝັກສຳເລັດ! ກະລຸນາກົດລິ້ງຢືນຢັນໃນອີເມວ ແລ້ວເຂົ້າສູ່ລະບົບ.', error: false });
          setMode('signin');
        }
      }
    } catch (e) {
      setMessage({ text: toLaoError(e), error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="water" size={32} color="#06210F" />
          </View>
          <Text style={styles.title}>LNGS Fueling</Text>
          <Text style={styles.subtitle}>ເຕີມນ້ຳມັນຜ່ານລະບົບ ງ່າຍ ແລະ ໄວ</Text>

          <View style={styles.toggle}>
            {(['signin', 'signup'] as const).map((m) => (
              <Pressable key={m} onPress={() => setMode(m)} style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}>
                <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                  {m === 'signin' ? 'ເຂົ້າສູ່ລະບົບ' : 'ສະໝັກໃໝ່'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Card style={{ gap: spacing.sm }}>
            {mode === 'signup' && (
              <>
                <Field label="ຊື່ ແລະ ນາມສະກຸນ" value={fullName} onChangeText={setFullName} />
                <Field label="ເບີໂທ" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </>
            )}
            <Field label="ອີເມວ" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Field label="ລະຫັດຜ່ານ (ຢ່າງໜ້ອຍ 6 ຕົວ)" value={password} onChangeText={setPassword} secureTextEntry />
          </Card>

          {message && <Text style={[styles.message, message.error && { color: colors.danger }]}>{message.text}</Text>}

          <PrimaryButton
            label={busy ? 'ກະລຸນາລໍຖ້າ...' : mode === 'signin' ? 'ເຂົ້າສູ່ລະບົບ' : 'ສະໝັກສະມາຊິກ'}
            onPress={submit}
            disabled={!canSubmit || busy}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...rest} style={styles.input} placeholderTextColor={colors.textMuted} />
    </View>
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
  toggle: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.pill, padding: 4,
    marginVertical: spacing.lg,
  },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: '#06210F' },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  input: {
    ...typography.body, color: colors.textPrimary, backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 10,
  },
  message: { ...typography.caption, color: colors.primary, marginTop: spacing.md, textAlign: 'center' },
});
