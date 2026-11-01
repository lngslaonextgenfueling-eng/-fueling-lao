# ຄູ່ມືເປີດໃຊ້ງານຈິງ — LNGS Fueling

ຄູ່ມືນີ້ພາທ່ານເຮັດແຕ່ລະຂັ້ນຕອນ ຕັ້ງແຕ່ສ້າງຖານຂໍ້ມູນ ຈົນໄດ້ແອັບໃນມືຖື.
ໃຊ້ເວລາປະມານ 1–2 ຊົ່ວໂມງ (ບໍ່ລວມເວລາລໍຖ້າທະນາຄານ).

```
lngs-fueling/
  supabase/            ຖານຂໍ້ມູນ + ລະບົບຈ່າຍເງິນ (server)
  fuel-customer-app/   ແອັບລູກຄ້າ (Android/iOS)
  fuel-staff-app/      ແອັບພະນັກງານ (Android)
  fuel-dashboard/      ເວັບຜູ້ຈັດການ
```

ສິ່ງທີ່ຕ້ອງມີ: ຄອມພິວເຕີທີ່ຕິດຕັ້ງ **Node.js 20+** (nodejs.org) ແລະ ບັນຊີ **GitHub**.

---

## ຂັ້ນຕອນ 1 — ສ້າງ Supabase (ຖານຂໍ້ມູນ) · ຟຣີ

1. ໄປ <https://supabase.com> → **Start your project** → ເຂົ້າດ້ວຍ GitHub.
2. **New project**: ຕັ້ງຊື່ `lngs-fueling`, ຕັ້ງລະຫັດຜ່ານຖານຂໍ້ມູນ (ຈົດໄວ້), Region ເລືອກ **Southeast Asia (Singapore)**.
3. ລໍຖ້າ 1–2 ນາທີ ຈົນ project ພ້ອມ.

### 1.1 ສ້າງຕາຕະລາງ
1. ເມນູຊ້າຍ → **SQL Editor** → **New query**.
2. ເປີດໄຟລ໌ `supabase/migrations/20261101000001_init.sql` → copy ທັງໝົດ → ວາງ → ກົດ **Run**. ຕ້ອງຂຶ້ນ `Success`.
3. New query ອີກ → ວາງເນື້ອໃນ `supabase/seed.sql` → **Run**.
   *(ແກ້ຊື່ປໍ້າ, ທີ່ຢູ່, ພິກັດ GPS ແລະ ລາຄານ້ຳມັນ ໃນໄຟລ໌ນີ້ໃຫ້ຖືກກ່ອນ — ພິກັດເອົາຈາກ Google Maps: ກົດຄ້າງຈຸດປໍ້າ → copy ຕົວເລກ)*
4. **Database → Extensions** → ຊອກ `pg_cron` → ເປີດ. ແລ້ວ SQL Editor → ວາງ `supabase/migrations/20261101000002_cron.sql` → **Run**.
   *(ອັນນີ້ເຮັດໃຫ້ອໍເດີທີ່ເກີນ 30 ນາທີ ໝົດອາຍຸເອງ ແລະ ຄືນເງິນເຂົ້າ wallet)*

### 1.2 ຕັ້ງຄ່າການເຂົ້າສູ່ລະບົບ
- **Authentication → Providers → Email**: ເປີດໄວ້.
- ຊ່ວງທົດສອບ: ປິດ **Confirm email** ເພື່ອສະໝັກແລ້ວໃຊ້ໄດ້ທັນທີ. ກ່ອນເປີດໃຫ້ລູກຄ້າແທ້ ຄວນເປີດຄືນ ແລະ ຕັ້ງ SMTP (Authentication → Emails).

### 1.3 ເອົາກະແຈ API
**Project Settings → API** → ຈົດ 2 ຄ່າ:
- `Project URL` (ເຊັ່ນ `https://abcd.supabase.co`)
- `anon public` key

> ⚠️ ຫ້າມເອົາ `service_role` key ໃສ່ແອັບ ຫຼື ເວັບ ເດັດຂາດ.

---

## ຂັ້ນຕອນ 2 — ສ້າງບັນຊີ Admin ຄົນທຳອິດ

1. **Authentication → Users → Add user → Create new user**: ໃສ່ອີເມວ + ລະຫັດຜ່ານຂອງທ່ານ, ໝາຍ **Auto Confirm User**.
2. SQL Editor → ລັນ (ປ່ຽນອີເມວ):
   ```sql
   update public.profiles set role = 'admin', full_name = 'ຊື່ຂອງທ່ານ'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

ຈາກນີ້ໄປ ທ່ານແຕ່ງຕັ້ງພະນັກງານ ແລະ ແກ້ລາຄານ້ຳມັນໄດ້ຈາກ Dashboard → **ຕັ້ງຄ່າ**.

---

## ຂັ້ນຕອນ 3 — ລະບົບຈ່າຍເງິນ (Edge Functions)

ຕິດຕັ້ງ Supabase CLI ແລ້ວເຊື່ອມ project (ເປີດ Terminal ໃນໂຟນເດີ `lngs-fueling`):

```bash
npm install -g supabase
supabase login
supabase link --project-ref <ref>        # <ref> = ສ່ວນໜ້າ .supabase.co ໃນ Project URL
supabase functions deploy payment-create
supabase functions deploy payment-sandbox-confirm
supabase functions deploy payment-webhook --no-verify-jwt
```

### 3.1 ໂໝດທົດສອບ (ໃຊ້ໄດ້ທັນທີ)
```bash
supabase secrets set PAYMENT_MODE=sandbox
```
ໃນໂໝດນີ້ ໜ້າຈ່າຍ OnePay ຈະມີປຸ່ມ **"ຈຳລອງວ່າຈ່າຍສຳເລັດ"** — ທົດລອງທຸກຂັ້ນຕອນໄດ້ໂດຍບໍ່ຕ້ອງໃຊ້ເງິນແທ້.
ການຈ່າຍດ້ວຍ **Wallet** ແລະ **ເງິນສົດຢູ່ປໍ້າ** ໃຊ້ງານໄດ້ເຕັມຮູບແບບແລ້ວ.

### 3.2 ເຊື່ອມ BCEL OnePay ແທ້ (ເມື່ອໄດ້ສັນຍາ merchant)
1. ຕິດຕໍ່ BCEL ຂໍເປີດ **OnePay Merchant** ສຳລັບທຸລະກິດ. ຂໍໃຫ້ທະນາຄານມອບ:
   - Merchant ID (mcid) ແລະ ຂໍ້ມູນ QR (tag 33 / Application ID)
   - **ເອກະສານ API** ການແຈ້ງເຕືອນເມື່ອຈ່າຍສຳເລັດ (callback / webhook)
2. ຕັ້ງຄ່າ:
   ```bash
   supabase secrets set PAYMENT_MODE=onepay \
     ONEPAY_MCID=<merchant id> ONEPAY_AID=<ຈາກທະນາຄານ> \
     ONEPAY_MERCHANT_NAME="LNGS FUELING" ONEPAY_MERCHANT_CITY=VIENTIANE \
     ONEPAY_WEBHOOK_SECRET=<ລະຫັດລັບຍາວ 32 ຕົວຂຶ້ນໄປ>
   ```
3. ແຈ້ງ URL ນີ້ໃຫ້ທະນາຄານເປັນ callback:
   `https://<ref>.supabase.co/functions/v1/payment-webhook`
4. ⚠️ **ໃຫ້ນັກພັດທະນາກວດ** `supabase/functions/_shared/onepay.ts` ກັບເອກະສານ BCEL — ຮູບແບບ QR (tag 33) ແລະ ວິທີກວດລາຍເຊັນ callback
   ອາດຕ້ອງປັບຕາມສະເປັກຈິງ. ທົດສອບດ້ວຍເງິນໜ້ອຍໆ (1,000 ກີບ) ກ່ອນເປີດໃຊ້.

---

## ຂັ້ນຕອນ 4 — Dashboard (ເວັບຜູ້ຈັດການ) · Vercel ຟຣີ

1. Push ໂຄດທັງໝົດຂຶ້ນ GitHub (ຖ້າຍັງ).
2. ໄປ <https://vercel.com> → ເຂົ້າດ້ວຍ GitHub → **Add New → Project** → ເລືອກ repo.
3. **Root Directory**: `fuel-dashboard` · Framework: **Vite**.
4. **Environment Variables**:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon key
5. **Deploy** → ໄດ້ລິ້ງ ເຊັ່ນ `https://lngs-dashboard.vercel.app` → ເຂົ້າດ້ວຍບັນຊີ admin ຈາກຂັ້ນຕອນ 2.

ທົດລອງໃນຄອມກ່ອນກໍໄດ້: `cd fuel-dashboard && cp .env.example .env` (ແກ້ຄ່າ) → `npm install && npm run dev`.

---

## ຂັ້ນຕອນ 5 — ແອັບມືຖື (ລູກຄ້າ ແລະ ພະນັກງານ)

ເຮັດຊ້ຳສຳລັບທັງ `fuel-customer-app` ແລະ `fuel-staff-app`:

### 5.1 ທົດລອງໃນມືຖືຂອງທ່ານ (Expo Go)
```bash
cd fuel-customer-app
cp .env.example .env        # ແລ້ວແກ້ 2 ຄ່າໃນ .env
npm install
npx expo install --fix      # ປັບເວີຊັນ package ໃຫ້ກົງກັບ Expo
npx expo start
```
ຕິດຕັ້ງແອັບ **Expo Go** ໃນມືຖື → ສະແກນ QR ທີ່ຂຶ້ນໃນ Terminal.

### 5.2 ສ້າງໄຟລ໌ APK ສຳລັບ Android
```bash
npm install -g eas-cli
eas login                   # ສະໝັກຟຣີທີ່ expo.dev
eas init
npm run build:apk
```
ກ່ອນ build: ເປີດໄຟລ໌ `eas.json` ແລ້ວແທນ `EXPO_PUBLIC_SUPABASE_URL` ແລະ `EXPO_PUBLIC_SUPABASE_ANON_KEY`
ດ້ວຍຄ່າຈາກຂັ້ນຕອນ 1.3 (anon key ເປີດເຜີຍໄດ້ — ຄວາມປອດໄພຢູ່ທີ່ RLS ໃນຖານຂໍ້ມູນ).
ລໍຖ້າ 10–20 ນາທີ → ໄດ້ລິ້ງດາວໂຫຼດ `.apk` → ສົ່ງໃຫ້ພະນັກງານ/ລູກຄ້າຕິດຕັ້ງ.

### 5.3 ລົງ Google Play Store (ສຳລັບລູກຄ້າທົ່ວໄປ)
1. ສະໝັກ Google Play Console ($25 ຄັ້ງດຽວ).
2. `npm run build:prod` → ໄດ້ໄຟລ໌ `.aab` → ອັບໂຫຼດໃນ Play Console.
3. ຕ້ອງມີ: ໄອຄອນແອັບ, ຮູບໜ້າຈໍ, ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ (privacy policy URL).

> iOS (App Store) ຕ້ອງມີບັນຊີ Apple Developer ($99/ປີ) ແລະ ໃຊ້ `eas build -p ios`.

---

## ຂັ້ນຕອນ 6 — ແຕ່ງຕັ້ງພະນັກງານ

1. ພະນັກງານສະໝັກບັນຊີດ້ວຍອີເມວ (ຜ່ານແອັບລູກຄ້າ ຫຼື ທ່ານສ້າງໃຫ້ໃນ Supabase → Authentication → Add user).
2. Dashboard → **ຕັ້ງຄ່າ → ແຕ່ງຕັ້ງພະນັກງານ** → ໃສ່ອີເມວ → ເລືອກ "ພະນັກງານ" + ປໍ້າປະຈຳ → ບັນທຶກ.
3. ພະນັກງານເຂົ້າສູ່ລະບົບໃນແອັບ **LNGS Staff**.

---

## ຂັ້ນຕອນ 7 — ທົດສອບກ່ອນເປີດໃຊ້ (Checklist)

- [ ] ລູກຄ້າສະໝັກ → ເຂົ້າສູ່ລະບົບໄດ້
- [ ] ເຕີມເງິນ wallet (sandbox) → ຍອດເພີ່ມຂຶ້ນທັນທີ
- [ ] ສັ່ງນ້ຳມັນ ຈ່າຍດ້ວຍ Wallet → ໄດ້ QR + PIN
- [ ] ພະນັກງານສະແກນ QR (ຫຼື ປ້ອນ PIN) → ເລືອກຫົວຈ່າຍ → ອະນຸມັດ
- [ ] ໜ້າຈໍລູກຄ້າປ່ຽນເປັນ "ກຳລັງເຕີມ" ເອງ (real-time)
- [ ] ພະນັກງານກົດ "ເຕີມສຳເລັດ" → ລູກຄ້າໄດ້ຄະແນນ, ຫົວຈ່າຍກັບເປັນ "ວ່າງ"
- [ ] Dashboard ເຫັນອໍເດີ ແລະ ຍອດຂາຍອັບເດດທັນທີ
- [ ] ສັ່ງແບບເງິນສົດ → ພະນັກງານເຫັນແຈ້ງເຕືອນ "ຮັບເງິນສົດ"
- [ ] ສັ່ງແລ້ວປ່ອຍໃຫ້ກາຍ 30 ນາທີ → ອໍເດີໝົດອາຍຸ, ເງິນຄືນເຂົ້າ wallet
- [ ] ພະນັກງານປໍ້າ A ບໍ່ເຫັນ/ສະແກນອໍເດີຂອງປໍ້າ B ບໍ່ໄດ້

---

## ຄວາມປອດໄພທີ່ສ້າງໄວ້ແລ້ວ

- ລາຄາ ແລະ ຍອດເງິນ ຄິດໄລ່ຢູ່ server ເທົ່ານັ້ນ — ແກ້ແອັບກໍປອມລາຄາບໍ່ໄດ້
- ຜູ້ໃຊ້ແກ້ wallet, ຄະແນນ ຫຼື ສິດ (role) ຂອງຕົນເອງບໍ່ໄດ້
- ລູກຄ້າເຫັນສະເພາະອໍເດີຂອງຕົນ, ພະນັກງານເຫັນສະເພາະປໍ້າຂອງຕົນ
- QR ໃຊ້ token ສຸ່ມ (ເດົາບໍ່ໄດ້), PIN ບໍ່ຊ້ຳກັນໃນປໍ້າດຽວກັນ, ໝົດອາຍຸ 30 ນາທີ
- Webhook ການຈ່າຍເງິນ ກວດລະຫັດລັບ ແລະ ຈຳນວນເງິນ, ເອີ້ນຊ້ຳກໍບໍ່ເພີ່ມເງິນຊ້ຳ

## ຍັງບໍ່ໄດ້ເຮັດ (ແຜນຕໍ່ໄປ)

- ຄູປອງສ່ວນຫຼຸດ: ສະແດງໄດ້ ແຕ່ຍັງບໍ່ຫັກເງິນອັດຕະໂນມັດ
- ແຈ້ງເຕືອນ (push notification)
- ເຂົ້າສູ່ລະບົບດ້ວຍເບີໂທ + OTP (ຕ້ອງມີຜູ້ໃຫ້ບໍລິການ SMS)
- ລາຍງານຍ້ອນຫຼັງ (ເລືອກວັນທີ) ໃນ Dashboard
