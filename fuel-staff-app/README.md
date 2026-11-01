# Fuel Staff App (App 2)

React Native (Expo) implementation of the Staff / Handheld POS app from the
fuel-station architecture doc: QR/PIN scan → verification modal → approve &
dispense → success/receipt, plus Queue and Pump Status tabs.

## ການລັນ (Run)

```bash
npm install
npx expo start
```

Camera-based QR scanning (`expo-camera`) needs a physical device or a
simulator with camera support — press `a`/`i` and scan with the device
camera, or switch to **PIN** mode to test without a camera.

## ໂຄງສ້າງໂຟນເດີ (Structure)

```
App.tsx                        entry point: providers + navigation
src/
  theme/theme.ts                 shared design tokens (kept consistent with the Customer app)
  types/index.ts                 shared TypeScript types (match backend API shapes)
  utils/format.ts                currency / liters / time formatting
  context/StaffContext.tsx       app state + Supabase data layer (RPC + realtime)
  navigation/
    types.ts
    RootNavigator.tsx             tabs (Scan/Queue/Pumps) + Success stack screen
  components/
    Card.tsx, PrimaryButton.tsx, StatusBadge.tsx, Numpad.tsx
    VerificationModal.tsx         shows customer + order, pump picker, approve button
  screens/
    ScanScreen.tsx                camera QR scan or PIN numpad -> looks up order
    SuccessScreen.tsx             confirmation, receipt print (expo-print)
    QueueScreen.tsx                Pending / In-progress / Completed tabs
    PumpStatusScreen.tsx           6 pumps (Active/Idle/Offline) + per-staff shift sales
```

## ການເຊື່ອມຕໍ່ Backend

ເຊື່ອມກັບ Supabase ແລ້ວ (ບໍ່ມີຂໍ້ມູນສົມມຸດອີກ). ກ່ອນລັນ: `cp .env.example .env` ແລ້ວໃສ່ Project URL + anon key.
ຂັ້ນຕອນຕັ້ງຄ່າທັງໝົດ ເບິ່ງ [../DEPLOY.md](../DEPLOY.md).
