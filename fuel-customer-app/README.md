# Fuel Customer App (App 1)

React Native (Expo) implementation of the Customer app described in the
fuel-station architecture doc: Home → Fuel Selection → Payment → QR
Verification, plus Loyalty and History tabs.

## ການລັນ (Run)

```bash
npm install
npx expo start
```

Then press `a` (Android emulator), `i` (iOS simulator), or `w` (web), or
scan the QR with the **Expo Go** app on your phone.

## ໂຄງສ້າງໂຟນເດີ (Structure)

```
App.tsx                      entry point: providers + navigation
src/
  theme/theme.ts              colors, spacing, radius, typography tokens
  types/index.ts               shared TypeScript types (match backend API shapes)
  utils/format.ts              currency / liters / PIN / countdown formatting
  context/AppContext.tsx       app state + Supabase data layer (RPC + realtime)
  navigation/
    types.ts                   React Navigation param lists
    RootNavigator.tsx           stack (Home tabs → FuelSelect → Payment → QR)
  components/
    Card.tsx, PrimaryButton.tsx shared UI primitives
  screens/
    HomeScreen.tsx              wallet card, points, nearest station (GPS), quick actions
    FuelSelectScreen.tsx        fuel type (91/95/Diesel/E20) + amount/liters/full-tank
    PaymentScreen.tsx           payment method, summary, points earned
    QrVerificationScreen.tsx    dynamic QR + 4-digit PIN + 30-min countdown
    LoyaltyScreen.tsx           tier progress bar + coupons
    HistoryScreen.tsx           transaction history list
```

## ການເຊື່ອມຕໍ່ Backend

ເຊື່ອມກັບ Supabase ແລ້ວ (ບໍ່ມີຂໍ້ມູນສົມມຸດອີກ). ກ່ອນລັນ: `cp .env.example .env` ແລ້ວໃສ່ Project URL + anon key.
ຂັ້ນຕອນຕັ້ງຄ່າທັງໝົດ ເບິ່ງ [../DEPLOY.md](../DEPLOY.md).
