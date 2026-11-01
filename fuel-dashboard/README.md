# Fuel Dashboard (App 3)

React + Vite + TypeScript desktop web dashboard for the fuel-station
architecture doc's "(3) Live Stream Feed (Every 3s)" — a station-ops view
showing live orders, pump status, sales, and staff performance.

## ການລັນ (Run)

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. `npm run build` produces a static
`dist/` folder you can deploy to any web host.

## ໂຄງສ້າງໂຟນເດີ (Structure)

```
src/
  theme/theme.css               CSS variables (kept consistent with the Customer/Staff apps)
  types/index.ts                 shared TypeScript types (match backend push/REST shapes)
  utils/format.ts                currency / liters / time formatting
  context/DashboardContext.tsx   app state + Supabase realtime feed + report RPCs
  components/
    Layout.tsx                    sidebar nav + connection/last-updated indicator
    Card.tsx, StatusBadge.tsx, KpiCard.tsx
  pages/
    OverviewPage.tsx               KPIs + latest orders + per-station pump summary
    LiveFeedPage.tsx                full live order table, station filter, "new row" highlight
    PumpsPage.tsx                   6-pump grid per station (Active/Idle/Offline)
    SalesPage.tsx                   hourly sales line chart, fuel-type bar + pie charts (recharts)
    StaffPage.tsx                   shift sales leaderboard, ranked
```

## ການເຊື່ອມຕໍ່ Backend

ເຊື່ອມກັບ Supabase ແລ້ວ (ບໍ່ມີຂໍ້ມູນສົມມຸດອີກ). ກ່ອນລັນ: `cp .env.example .env` ແລ້ວໃສ່ Project URL + anon key.
ຂັ້ນຕອນຕັ້ງຄ່າທັງໝົດ ເບິ່ງ [../DEPLOY.md](../DEPLOY.md).
