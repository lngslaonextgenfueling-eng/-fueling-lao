import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Numpad } from '@/components/Numpad';
import { VerificationModal } from '@/components/VerificationModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useStaff } from '@/context/StaffContext';
import { useAuth } from '@/context/AuthContext';
import { toLaoError } from '@/lib/errors';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { CustomerOrder } from '@/types';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type InputMode = 'camera' | 'pin';

export default function ScanScreen() {
  const navigation = useNavigation<Nav>();
  const { lookupOrder, staff, connected } = useStaff();
  const [searching, setSearching] = useState(false);
  const { signOut } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<InputMode>('camera');
  const [pin, setPin] = useState('');
  const [scanLocked, setScanLocked] = useState(false);
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'camera' && !permission?.granted) {
      requestPermission();
    }
  }, [mode, permission]);

  async function find(code: string) {
    setSearching(true);
    try {
      const found = await lookupOrder(code);
      setError(null);
      setActiveOrder(found);
      return true;
    } catch (e) {
      setError(toLaoError(e));
      return false;
    } finally {
      setSearching(false);
    }
  }

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanLocked || activeOrder) return;
    setScanLocked(true);
    await find(data);
    setTimeout(() => setScanLocked(false), 1500);
  }

  async function handlePinSubmit() {
    if (await find(pin)) setPin('');
  }

  function handleApproved(orderId: string) {
    setActiveOrder(null);
    navigation.navigate('Success', { orderId });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.title}>ສະແກນລູກຄ້າ</Text>
          <Pressable onPress={signOut} hitSlop={10}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={styles.stationLine}>
          {staff.stationName} · {staff.name} · {connected ? '🟢 ອອນລາຍ' : '🔴 ກຳລັງເຊື່ອມຕໍ່...'}
        </Text>
        <View style={styles.modeToggle}>
          <ModeButton label="ກ້ອງ" icon="camera-outline" active={mode === 'camera'} onPress={() => setMode('camera')} />
          <ModeButton label="PIN" icon="keypad-outline" active={mode === 'pin'} onPress={() => setMode('pin')} />
        </View>
      </View>

      {mode === 'camera' ? (
        <View style={styles.cameraWrap}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          ) : (
            <View style={styles.permissionWrap}>
              <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
              <Text style={styles.permissionText}>ຕ້ອງການອະນຸຍາດໃຊ້ກ້ອງ</Text>
              <PrimaryButton label="ອະນຸຍາດ" onPress={requestPermission} style={{ marginTop: spacing.md }} />
            </View>
          )}
          <View style={styles.scanFrame} pointerEvents="none" />
        </View>
      ) : (
        <View style={styles.pinWrap}>
          <Text style={styles.pinPrompt}>ປ້ອນ PIN 4 ໂຕ ຂອງລູກຄ້າ</Text>
          <Numpad value={pin} onChange={setPin} maxLength={4} />
          <PrimaryButton
            label={searching ? 'ກຳລັງຄົ້ນຫາ...' : 'ຄົ້ນຫາ'}
            onPress={handlePinSubmit}
            disabled={pin.length < 4 || searching}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <VerificationModal order={activeOrder} onClose={() => setActiveOrder(null)} onApproved={handleApproved} />
    </SafeAreaView>
  );
}

function ModeButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.modeButton, active && styles.modeButtonActive]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={active ? '#06210F' : colors.textSecondary} />
      <Text style={[styles.modeButtonLabel, active && styles.modeButtonLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  title: { ...typography.h1, color: colors.textPrimary },
  stationLine: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: 4,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  modeButtonActive: { backgroundColor: colors.primary },
  modeButtonLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  modeButtonLabelActive: { color: '#06210F' },
  cameraWrap: {
    flex: 1,
    margin: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  scanFrame: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    right: '15%',
    bottom: '35%',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.lg,
  },
  permissionWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  permissionText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  pinWrap: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  pinPrompt: { ...typography.h3, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.lg },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(239,68,68,0.12)',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  errorText: { ...typography.caption, color: colors.danger },
});
