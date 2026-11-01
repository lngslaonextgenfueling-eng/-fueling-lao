import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useStaff } from '@/context/StaffContext';
import { toLaoError } from '@/lib/errors';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { formatDateTime, formatKip, formatLiters } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SuccessRoute = RouteProp<RootStackParamList, 'Success'>;

// Builds a simple 58mm-receipt-shaped HTML doc. expo-print renders this to
// PDF and opens the system print sheet, which on most POS/handheld devices
// lists any paired Bluetooth thermal printer as a destination. For a printer
// that needs raw ESC/POS commands instead of a print-service driver, swap
// this for a dedicated Bluetooth-ESC/POS library and feed it the same data.
function buildReceiptHtml(args: {
  orderId: string;
  customerName: string;
  fuelType: string;
  liters: string;
  amount: string;
  time: string;
  pumpNumber?: number;
  stationName: string;
}) {
  return `
    <html>
      <body style="font-family: monospace; width: 280px; padding: 12px;">
        <h3 style="text-align:center;margin:0 0 8px;">LNGS FUELING</h3>
        <p style="text-align:center;margin:0 0 4px;">${args.stationName}</p>
        <p style="text-align:center;margin:0 0 12px;">ໃບບິນການເຕີມນ້ຳມັນ</p>
        <hr/>
        <p>ເລກທີ່ອໍເດີ: ${args.orderId}</p>
        <p>ລູກຄ້າ: ${args.customerName}</p>
        <p>ເວລາ: ${args.time}</p>
        ${args.pumpNumber ? `<p>ຫົວຈ່າຍ: ${args.pumpNumber}</p>` : ''}
        <hr/>
        <p>ປະເພດ: ${args.fuelType}</p>
        <p>ຈຳນວນ: ${args.liters}</p>
        <h3>ລວມ: ${args.amount}</h3>
        <hr/>
        <p style="text-align:center;">ຂອບໃຈທີ່ໃຊ້ບໍລິການ</p>
      </body>
    </html>
  `;
}

export default function SuccessScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<SuccessRoute>();
  const { orders, completeOrder, staff } = useStaff();
  const [printing, setPrinting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const order = orders.find((o) => o.orderId === route.params.orderId);
  const isDone = order?.status === 'completed';

  async function handlePrint() {
    if (!order) return;
    setPrinting(true);
    try {
      await Print.printAsync({
        html: buildReceiptHtml({
          orderId: order.orderId,
          customerName: order.customerName,
          fuelType: order.fuelType,
          liters: formatLiters(order.liters),
          amount: formatKip(order.amount),
          time: formatDateTime(order.completedAt ?? Date.now()),
          pumpNumber: order.pumpNumber,
          stationName: staff.stationName,
        }),
      });
    } catch {
      // User cancelled the print sheet, or no printer available — non-fatal.
    } finally {
      setPrinting(false);
    }
  }

  async function handleComplete() {
    if (!order) return;
    setBusy(true);
    setError(null);
    try {
      await completeOrder(order.orderId);
    } catch (e) {
      setError(toLaoError(e));
    } finally {
      setBusy(false);
    }
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: colors.textPrimary, padding: spacing.md }}>ບໍ່ພົບອໍເດີ.</Text>
        <PrimaryButton label="ກັບຄືນ" onPress={() => navigation.popToTop()} style={{ margin: spacing.md }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isDone ? 'checkmark-circle' : 'water'}
            size={72}
            color={isDone ? colors.primary : colors.blue}
          />
        </View>
        <Text style={styles.title}>{isDone ? 'ເຕີມນ້ຳມັນສຳເລັດແລ້ວ' : `ກຳລັງເຕີມ · ຫົວ ${order.pumpNumber ?? '-'}`}</Text>
        <Text style={styles.subtitle}>
          {isDone ? formatDateTime(order.completedAt ?? Date.now()) : 'ກົດ "ເຕີມສຳເລັດ" ເມື່ອຫົວຈ່າຍຢຸດແລ້ວ'}
        </Text>

        <Card style={{ marginTop: spacing.lg, width: '100%' }}>
          <Row label="ລູກຄ້າ" value={order.customerName} />
          <Row label="ເລກທີ່ອໍເດີ" value={order.orderId} />
          {order.pumpNumber ? <Row label="ຫົວຈ່າຍ" value={`ຫົວ ${order.pumpNumber}`} /> : null}
          <View style={styles.divider} />
          <Row label="ປະເພດນ້ຳມັນ" value={order.fuelType} />
          <Row label="ຈຳນວນລິດ" value={formatLiters(order.liters)} />
          <Row label="ຍອດລວມ" value={formatKip(order.amount)} big />
        </Card>

        {error && <Text style={{ color: colors.danger, marginTop: spacing.sm }}>{error}</Text>}

        {isDone ? (
          <>
            <PrimaryButton
              label={printing ? 'ກຳລັງພິມ...' : 'ອອກໃບບິນ (ພິມ)'}
              variant="secondary"
              onPress={handlePrint}
              disabled={printing}
              style={{ marginTop: spacing.lg, width: '100%' }}
            />
            <PrimaryButton label="ລູກຄ້າຕໍ່ໄປ" onPress={() => navigation.popToTop()} style={{ marginTop: spacing.sm, width: '100%' }} />
          </>
        ) : (
          <>
            <PrimaryButton
              label={busy ? 'ກຳລັງບັນທຶກ...' : 'ເຕີມສຳເລັດ'}
              onPress={handleComplete}
              disabled={busy}
              style={{ marginTop: spacing.lg, width: '100%' }}
            />
            <PrimaryButton
              label="ກັບໄປສະແກນ (ປິດໃນໜ້າຄິວພາຍຫຼັງ)"
              variant="secondary"
              onPress={() => navigation.popToTop()}
              style={{ marginTop: spacing.sm, width: '100%' }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={big ? styles.rowValueBig : styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, alignItems: 'center', padding: spacing.lg, justifyContent: 'center' },
  iconWrap: { marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  rowValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  rowValueBig: { ...typography.h3, color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
});
