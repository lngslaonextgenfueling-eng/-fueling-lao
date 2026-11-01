-- ຂໍ້ມູນເລີ່ມຕົ້ນ — ແກ້ຊື່ປໍ້າ, ທີ່ຢູ່, ພິກັດ ແລະ ລາຄາໃຫ້ຖືກຕ້ອງກ່ອນເປີດໃຊ້ແທ້
insert into public.fuel_prices (fuel_type, label, price_per_liter) values
  ('91',     '91 (Regular)', 15800),
  ('95',     '95 (Premium)', 16900),
  ('Diesel', 'Diesel',       16200),
  ('E20',    'E20',          15400)
on conflict (fuel_type) do update set label = excluded.label, price_per_liter = excluded.price_per_liter;

-- ການເພີ່ມປໍ້າ ຈະສ້າງຫົວຈ່າຍ (pumps) ໃຫ້ອັດຕະໂນມັດຕາມ pump_count
insert into public.stations (id, name, address, lat, lng, pump_count) values
  ('STN-001', 'ປໍ້າ LNG - ຂົວລວມ', 'ຖະໜົນ 23 ສິງຫາ, ນະຄອນຫຼວງວຽງຈັນ', 17.9667, 102.6100, 6),
  ('STN-002', 'ປໍ້າ LNG - ທ່າເດື່ອ', 'ຖະໜົນທ່າເດື່ອ, ນະຄອນຫຼວງວຽງຈັນ',  17.9230, 102.6420, 6),
  ('STN-003', 'ປໍ້າ LNG - ໂພນທັນ', 'ບ້ານໂພນທັນ, ນະຄອນຫຼວງວຽງຈັນ',     17.9760, 102.6350, 6)
on conflict (id) do nothing;

insert into public.coupons (id, title, description, expires_on) values
  ('C1', 'ຫຼຸດ 5% ນ້ຳມັນ 95', 'ໃຊ້ໄດ້ກັບການເຕີມນ້ຳມັນ 95 ທຸກຄັ້ງ', '2026-12-31'),
  ('C2', 'ລ້າງລົດຟຣີ',        'ເມື່ອເຕີມນ້ຳມັນຄົບ 100,000 ກີບ',   '2026-11-30')
on conflict (id) do nothing;
