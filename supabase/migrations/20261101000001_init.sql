-- =============================================================================
-- LNGS Fueling Platform — ຖານຂໍ້ມູນຫຼັກ (Supabase / PostgreSQL)
-- ລັນໄຟລ໌ນີ້ໃນ Supabase → SQL Editor (ຫຼື `supabase db push`)
--
-- ຫຼັກການ: ແອັບຕ່າງໆ ບໍ່ຂຽນຂໍ້ມູນສຳຄັນ (ລາຄາ, ເງິນ, ສະຖານະອໍເດີ) ໂດຍກົງ.
-- ທຸກການກະທຳທີ່ກ່ຽວກັບເງິນ ຫຼື ສະຖານະ ຜ່ານ function (RPC) ທີ່ກວດສິດ ແລະ
-- ຄິດໄລ່ລາຄາຢູ່ຝັ່ງ server ເທົ່ານັ້ນ, ເພື່ອບໍ່ໃຫ້ຜູ້ໃຊ້ປອມລາຄາ ຫຼື ຍອດເງິນໄດ້.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ຕາຕະລາງ
-- ---------------------------------------------------------------------------

create table public.stations (
  id          text primary key,                 -- 'STN-001'
  name        text not null,
  address     text not null default '',
  lat         double precision,
  lng         double precision,
  pump_count  int  not null default 6 check (pump_count between 1 and 50),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.fuel_prices (
  fuel_type        text primary key check (fuel_type in ('91','95','Diesel','E20')),
  label            text not null,
  price_per_liter  int  not null check (price_per_liter > 0),   -- ກີບ / ລິດ
  updated_at       timestamptz not null default now()
);

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null default '',
  phone           text not null default '',
  role            text not null default 'customer'
                    check (role in ('customer','staff','manager','admin')),
  station_id      text references public.stations(id),   -- ສຳລັບພະນັກງານ
  wallet_balance  bigint not null default 0 check (wallet_balance >= 0),
  points          int    not null default 0 check (points >= 0),
  created_at      timestamptz not null default now()
);

create table public.pumps (
  id                text primary key,           -- 'STN-001-1'
  station_id        text not null references public.stations(id) on delete cascade,
  pump_number       int  not null,
  status            text not null default 'idle' check (status in ('active','idle','offline')),
  current_order_id  text,
  updated_at        timestamptz not null default now(),
  unique (station_id, pump_number)
);

create table public.orders (
  id              text primary key,             -- 'ORD-XXXXXXXX'
  customer_id     uuid not null references public.profiles(id),
  customer_name   text not null default '',
  station_id      text not null references public.stations(id),
  fuel_type       text not null references public.fuel_prices(fuel_type),
  mode            text not null check (mode in ('amount','liters','full_tank')),
  price_per_liter int    not null,
  liters          numeric(10,2) not null check (liters > 0),
  amount          bigint not null check (amount > 0),
  discount        bigint not null default 0 check (discount >= 0),
  points_earned   int    not null default 0,
  payment_method  text not null check (payment_method in ('wallet','one_pay','cash')),
  payment_status  text not null default 'unpaid'
                    check (payment_status in ('unpaid','pending','paid','refunded')),
  status          text not null default 'pending'
                    check (status in ('pending','in_progress','completed','cancelled','expired')),
  pin             text not null check (pin ~ '^\d{4}$'),
  qr_token        text not null unique,
  pump_number     int,
  staff_id        uuid references public.profiles(id),
  staff_name      text,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  approved_at     timestamptz,
  completed_at    timestamptz
);

-- PIN ຕ້ອງບໍ່ຊ້ຳກັນ ໃນບັນດາອໍເດີທີ່ລໍຖ້າຢູ່ປໍ້າດຽວກັນ
create unique index orders_pending_pin_uniq
  on public.orders (station_id, pin) where status = 'pending';
create index orders_customer_idx on public.orders (customer_id, created_at desc);
create index orders_station_idx  on public.orders (station_id, created_at desc);
create index orders_status_idx   on public.orders (status, expires_at);

create table public.coupons (
  id          text primary key,
  title       text not null,
  description text not null default '',
  expires_on  date not null,
  active      boolean not null default true
);

-- ການຈ່າຍເງິນຜ່ານ BCEL OnePay (ທັງຈ່າຍອໍເດີ ແລະ ເຕີມ wallet)
create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  -- ເລກອ້າງອີງສັ້ນ (16 ຕົວ) ທີ່ໃສ່ໃນ QR — EMVCo ຈຳກັດ 25 ຕົວ ຈຶ່ງໃຊ້ uuid ບໍ່ໄດ້
  invoice_no    text not null unique
                  default ('P' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 15))),
  purpose       text not null check (purpose in ('order','topup')),
  order_id      text references public.orders(id),
  user_id       uuid not null references public.profiles(id),
  provider      text not null default 'one_pay',
  amount        bigint not null check (amount > 0),
  status        text not null default 'pending' check (status in ('pending','paid','failed','expired')),
  provider_ref  text,
  qr_string     text,
  raw_callback  jsonb,
  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);
create index payments_user_idx on public.payments (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Helper functions
-- ---------------------------------------------------------------------------

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.my_station() returns text
language sql stable security definer set search_path = public as $$
  select station_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('manager','admin') from public.profiles where id = auth.uid()), false)
$$;

-- ສ້າງ profile ອັດຕະໂນມັດ ເມື່ອມີຄົນສະໝັກ (role ເລີ່ມຕົ້ນ = customer ສະເໝີ)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', new.phone, '')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ສ້າງຫົວຈ່າຍອັດຕະໂນມັດ ເມື່ອເພີ່ມປໍ້າໃໝ່
create or replace function public.handle_new_station() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.pumps (id, station_id, pump_number)
  select new.id || '-' || n, new.id, n from generate_series(1, new.pump_count) n
  on conflict do nothing;
  return new;
end $$;

create trigger on_station_created
  after insert on public.stations
  for each row execute function public.handle_new_station();

-- ---------------------------------------------------------------------------
-- 3. RPC: ລູກຄ້າ
-- ---------------------------------------------------------------------------

-- ສ້າງອໍເດີ. ລາຄາ ແລະ ຍອດເງິນ ຄິດໄລ່ຢູ່ server ເທົ່ານັ້ນ.
create or replace function public.create_order(
  p_station_id     text,
  p_fuel_type      text,
  p_mode           text,
  p_input          numeric,
  p_payment_method text
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_profile public.profiles;
  v_price   int;
  v_liters  numeric;
  v_amount  bigint;
  v_pin     text;
  v_order   public.orders;
  v_tries   int := 0;
  c_tank_liters constant numeric := 40;    -- "ເຕັມຖັງ" = ສູງສຸດ 40 ລິດ
  c_max_amount  constant bigint := 10000000;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_profile from profiles where id = v_uid for update;
  if v_profile.role <> 'customer' then raise exception 'ONLY_CUSTOMERS_CAN_ORDER'; end if;

  if not exists (select 1 from stations where id = p_station_id and active) then
    raise exception 'STATION_NOT_FOUND';
  end if;
  select price_per_liter into v_price from fuel_prices where fuel_type = p_fuel_type;
  if v_price is null then raise exception 'FUEL_TYPE_NOT_FOUND'; end if;
  if p_payment_method not in ('wallet','one_pay','cash') then raise exception 'BAD_PAYMENT_METHOD'; end if;

  if p_mode = 'amount' then
    if p_input is null or p_input < 1000 then raise exception 'AMOUNT_TOO_SMALL'; end if;
    v_amount := round(p_input);
    v_liters := round(v_amount::numeric / v_price, 2);
  elsif p_mode = 'liters' then
    if p_input is null or p_input < 0.5 then raise exception 'LITERS_TOO_SMALL'; end if;
    v_liters := round(p_input, 2);
    v_amount := round(v_liters * v_price);
  elsif p_mode = 'full_tank' then
    v_liters := c_tank_liters;
    v_amount := round(v_liters * v_price);
  else
    raise exception 'BAD_MODE';
  end if;
  if v_amount > c_max_amount then raise exception 'AMOUNT_TOO_LARGE'; end if;

  -- ລູກຄ້າມີອໍເດີທີ່ລໍຖ້າໄດ້ພຽງອັນດຽວ
  if exists (select 1 from orders where customer_id = v_uid and status = 'pending' and expires_at > now()) then
    raise exception 'ALREADY_HAS_PENDING_ORDER';
  end if;

  if p_payment_method = 'wallet' then
    if v_profile.wallet_balance < v_amount then raise exception 'INSUFFICIENT_WALLET'; end if;
    update profiles set wallet_balance = wallet_balance - v_amount where id = v_uid;
  end if;

  loop
    v_tries := v_tries + 1;
    v_pin := lpad((floor(random() * 10000))::int::text, 4, '0');
    begin
      insert into orders (
        id, customer_id, customer_name, station_id, fuel_type, mode, price_per_liter,
        liters, amount, discount, points_earned, payment_method, payment_status,
        pin, qr_token, expires_at
      ) values (
        'ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
        v_uid, v_profile.full_name, p_station_id, p_fuel_type, p_mode, v_price,
        v_liters, v_amount, 0, floor(v_amount / 1000.0)::int, p_payment_method,
        case p_payment_method when 'wallet' then 'paid' when 'one_pay' then 'pending' else 'unpaid' end,
        v_pin, replace(gen_random_uuid()::text, '-', ''), now() + interval '30 minutes'
      ) returning * into v_order;
      exit;
    exception when unique_violation then
      if v_tries > 20 then raise exception 'COULD_NOT_ALLOCATE_PIN'; end if;
    end;
  end loop;

  return v_order;
end $$;

-- ລູກຄ້າຍົກເລີກອໍເດີທີ່ຍັງບໍ່ໄດ້ເຕີມ → ຄືນເງິນເຂົ້າ wallet ຖ້າຈ່າຍແລ້ວ
create or replace function public.cancel_order(p_order_id text) returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  select * into v_order from orders where id = p_order_id for update;
  if v_order.id is null or v_order.customer_id <> auth.uid() then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status <> 'pending' then raise exception 'ORDER_NOT_CANCELLABLE'; end if;

  if v_order.payment_status = 'paid' then
    update profiles set wallet_balance = wallet_balance + (v_order.amount - v_order.discount)
      where id = v_order.customer_id;
    update orders set status = 'cancelled', payment_status = 'refunded' where id = p_order_id returning * into v_order;
  else
    update orders set status = 'cancelled' where id = p_order_id returning * into v_order;
  end if;
  return v_order;
end $$;

-- ---------------------------------------------------------------------------
-- 4. RPC: ພະນັກງານ
-- ---------------------------------------------------------------------------

create or replace function public.assert_staff() returns public.profiles
language plpgsql stable security definer set search_path = public as $$
declare v public.profiles;
begin
  select * into v from profiles where id = auth.uid();
  if v.id is null or v.role not in ('staff','manager','admin') then raise exception 'STAFF_ONLY'; end if;
  return v;
end $$;

-- ຊອກອໍເດີຈາກ QR ຫຼື PIN. QR ມີຮູບແບບ "LNGS:<qr_token>".
create or replace function public.lookup_order(p_code text) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_staff public.profiles := assert_staff();
  v_code  text := btrim(coalesce(p_code, ''));
  v_order public.orders;
begin
  if v_code ~ '^\d{4}$' then
    select * into v_order from orders
      where pin = v_code and status = 'pending' and expires_at > now()
        and (station_id = v_staff.station_id or v_staff.role in ('manager','admin'))
      order by created_at desc limit 1;
  else
    if v_code like 'LNGS:%' then v_code := substr(v_code, 6); end if;
    select * into v_order from orders
      where qr_token = v_code and status = 'pending' and expires_at > now()
        and (station_id = v_staff.station_id or v_staff.role in ('manager','admin'));
  end if;

  if v_order.id is null then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.payment_status = 'pending' then raise exception 'ORDER_NOT_PAID'; end if;
  return v_order;
end $$;

-- ອະນຸມັດ ແລະ ເລີ່ມເຕີມ. ຖ້າເປັນເງິນສົດ, ການອະນຸມັດ = ພະນັກງານຮັບເງິນແລ້ວ.
create or replace function public.approve_order(p_order_id text, p_pump_number int) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_staff public.profiles := assert_staff();
  v_order public.orders;
  v_pump  public.pumps;
begin
  select * into v_order from orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_staff.role = 'staff' and v_order.station_id is distinct from v_staff.station_id then
    raise exception 'WRONG_STATION';
  end if;
  if v_order.status <> 'pending' then raise exception 'ORDER_NOT_PENDING'; end if;
  if v_order.expires_at <= now() then raise exception 'ORDER_EXPIRED'; end if;
  if v_order.payment_status = 'pending' then raise exception 'ORDER_NOT_PAID'; end if;

  select * into v_pump from pumps
    where station_id = v_order.station_id and pump_number = p_pump_number for update;
  if v_pump.id is null then raise exception 'PUMP_NOT_FOUND'; end if;
  if v_pump.status <> 'idle' then raise exception 'PUMP_NOT_AVAILABLE'; end if;

  update pumps set status = 'active', current_order_id = v_order.id, updated_at = now()
    where id = v_pump.id;

  update orders set
    status = 'in_progress',
    pump_number = p_pump_number,
    staff_id = v_staff.id,
    staff_name = v_staff.full_name,
    approved_at = now(),
    payment_status = case when payment_method = 'cash' then 'paid' else payment_status end
  where id = p_order_id
  returning * into v_order;
  return v_order;
end $$;

-- ເຕີມສຳເລັດ → ປົດຫົວຈ່າຍ + ໃຫ້ຄະແນນລູກຄ້າ
create or replace function public.complete_order(p_order_id text) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_staff public.profiles := assert_staff();
  v_order public.orders;
begin
  select * into v_order from orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_staff.role = 'staff' and v_order.station_id is distinct from v_staff.station_id then
    raise exception 'WRONG_STATION';
  end if;
  if v_order.status <> 'in_progress' then raise exception 'ORDER_NOT_IN_PROGRESS'; end if;

  update pumps set status = 'idle', current_order_id = null, updated_at = now()
    where station_id = v_order.station_id and current_order_id = v_order.id;
  update profiles set points = points + v_order.points_earned where id = v_order.customer_id;
  update orders set status = 'completed', completed_at = now() where id = p_order_id returning * into v_order;
  return v_order;
end $$;

create or replace function public.set_pump_status(p_pump_id text, p_status text) returns public.pumps
language plpgsql security definer set search_path = public as $$
declare
  v_staff public.profiles := assert_staff();
  v_pump  public.pumps;
begin
  if p_status not in ('idle','offline') then raise exception 'BAD_STATUS'; end if;
  select * into v_pump from pumps where id = p_pump_id for update;
  if v_pump.id is null then raise exception 'PUMP_NOT_FOUND'; end if;
  if v_staff.role = 'staff' and v_pump.station_id is distinct from v_staff.station_id then
    raise exception 'WRONG_STATION';
  end if;
  if v_pump.status = 'active' then raise exception 'PUMP_IN_USE'; end if;
  update pumps set status = p_status, updated_at = now() where id = p_pump_id returning * into v_pump;
  return v_pump;
end $$;

-- ຍອດຂາຍຂອງພະນັກງານໃນມື້ນີ້ (ເວລາລາວ)
create or replace function public.staff_stats_today(p_station_id text default null)
returns table (staff_id uuid, staff_name text, station_id text, orders_completed bigint, total_sales bigint)
language plpgsql stable security definer set search_path = public as $$
declare v_staff public.profiles := assert_staff();
begin
  return query
    select o.staff_id, max(o.staff_name), o.station_id, count(*), sum(o.amount - o.discount)::bigint
    from orders o
    where o.status = 'completed'
      and (o.completed_at at time zone 'Asia/Vientiane')::date = (now() at time zone 'Asia/Vientiane')::date
      and o.station_id = case when v_staff.role = 'staff' then v_staff.station_id
                              else coalesce(p_station_id, o.station_id) end
    group by o.staff_id, o.station_id
    order by 5 desc;
end $$;

-- ---------------------------------------------------------------------------
-- 5. RPC: ຜູ້ຈັດການ (Dashboard)
-- ---------------------------------------------------------------------------

create or replace function public.sales_hourly(p_date date default null, p_station_id text default null)
returns table (hour int, amount bigint, liters numeric)
language plpgsql stable security definer set search_path = public as $$
declare v_date date := coalesce(p_date, (now() at time zone 'Asia/Vientiane')::date);
begin
  if not is_manager() then raise exception 'MANAGER_ONLY'; end if;
  return query
    select h.h, coalesce(sum(o.amount - o.discount), 0)::bigint, coalesce(sum(o.liters), 0)
    from generate_series(0, 23) h(h)
    left join orders o
      on o.status = 'completed'
     and (o.completed_at at time zone 'Asia/Vientiane')::date = v_date
     and extract(hour from o.completed_at at time zone 'Asia/Vientiane') = h.h
     and (p_station_id is null or o.station_id = p_station_id)
    group by h.h order by h.h;
end $$;

create or replace function public.sales_by_fuel(p_date date default null, p_station_id text default null)
returns table (fuel_type text, liters numeric, amount bigint)
language plpgsql stable security definer set search_path = public as $$
declare v_date date := coalesce(p_date, (now() at time zone 'Asia/Vientiane')::date);
begin
  if not is_manager() then raise exception 'MANAGER_ONLY'; end if;
  return query
    select f.fuel_type, coalesce(sum(o.liters), 0), coalesce(sum(o.amount - o.discount), 0)::bigint
    from fuel_prices f
    left join orders o
      on o.fuel_type = f.fuel_type and o.status = 'completed'
     and (o.completed_at at time zone 'Asia/Vientiane')::date = v_date
     and (p_station_id is null or o.station_id = p_station_id)
    group by f.fuel_type order by f.fuel_type;
end $$;

-- ຜູ້ຈັດການ ແຕ່ງຕັ້ງພະນັກງານ (ຄົນທີ່ສະໝັກແລ້ວ) ໃຫ້ປະຈຳປໍ້າ
create or replace function public.assign_staff(p_email text, p_role text, p_station_id text)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v public.profiles;
begin
  if not is_manager() then raise exception 'MANAGER_ONLY'; end if;
  if p_role not in ('customer','staff','manager') then raise exception 'BAD_ROLE'; end if;
  if p_role = 'manager' and my_role() <> 'admin' then raise exception 'ADMIN_ONLY'; end if;
  select id into v_id from auth.users where lower(email) = lower(p_email);
  if v_id is null then raise exception 'USER_NOT_FOUND'; end if;
  if my_role() <> 'admin' and (select role from profiles where id = v_id) in ('manager','admin') then
    raise exception 'ADMIN_ONLY';
  end if;
  if p_role = 'staff' and not exists (select 1 from stations where id = p_station_id) then
    raise exception 'STATION_NOT_FOUND';
  end if;
  update profiles set role = p_role, station_id = case when p_role = 'customer' then null else p_station_id end
    where id = v_id returning * into v;
  return v;
end $$;

create or replace function public.set_fuel_price(p_fuel_type text, p_price int) returns public.fuel_prices
language plpgsql security definer set search_path = public as $$
declare v public.fuel_prices;
begin
  if not is_manager() then raise exception 'MANAGER_ONLY'; end if;
  update fuel_prices set price_per_liter = p_price, updated_at = now()
    where fuel_type = p_fuel_type returning * into v;
  if v.fuel_type is null then raise exception 'FUEL_TYPE_NOT_FOUND'; end if;
  return v;
end $$;

-- ---------------------------------------------------------------------------
-- 6. ອໍເດີໝົດອາຍຸ (ເອີ້ນທຸກນາທີ ດ້ວຍ pg_cron — ເບິ່ງໄຟລ໌ migration ຖັດໄປ)
-- ---------------------------------------------------------------------------

create or replace function public.expire_stale_orders() returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select * from orders where status = 'pending' and expires_at <= now() for update skip locked loop
    if r.payment_status = 'paid' then
      update profiles set wallet_balance = wallet_balance + (r.amount - r.discount) where id = r.customer_id;
      update orders set status = 'expired', payment_status = 'refunded' where id = r.id;
    else
      update orders set status = 'expired' where id = r.id;
    end if;
    n := n + 1;
  end loop;
  update payments set status = 'expired'
    where status = 'pending' and created_at < now() - interval '30 minutes';
  return n;
end $$;

-- ---------------------------------------------------------------------------
-- 7. ການຈ່າຍເງິນ (ເອີ້ນໂດຍ Edge Function ດ້ວຍ service_role ເທົ່ານັ້ນ)
-- ---------------------------------------------------------------------------

create or replace function public.mark_payment_paid(p_payment_id uuid, p_provider_ref text, p_raw jsonb)
returns public.payments
language plpgsql security definer set search_path = public as $$
declare v public.payments;
begin
  select * into v from payments where id = p_payment_id for update;
  if v.id is null then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if v.status = 'paid' then return v; end if;          -- idempotent: ເອີ້ນຊ້ຳບໍ່ເປັນຫຍັງ

  update payments set status = 'paid', paid_at = now(), provider_ref = p_provider_ref, raw_callback = p_raw
    where id = p_payment_id returning * into v;

  if v.purpose = 'topup' then
    update profiles set wallet_balance = wallet_balance + v.amount where id = v.user_id;
  elsif v.purpose = 'order' then
    update orders set payment_status = 'paid'
      where id = v.order_id and payment_status = 'pending' and status = 'pending';
    -- ຖ້າອໍເດີໝົດອາຍຸ/ຍົກເລີກໄປກ່ອນເງິນເຂົ້າ → ເອົາເງິນເຂົ້າ wallet ແທນ
    if not found then
      update profiles set wallet_balance = wallet_balance + v.amount where id = v.user_id;
    end if;
  end if;
  return v;
end $$;

-- ---------------------------------------------------------------------------
-- 8. ສິດການເຂົ້າເຖິງ (Row Level Security)
-- ---------------------------------------------------------------------------

alter table public.stations    enable row level security;
alter table public.fuel_prices enable row level security;
alter table public.profiles    enable row level security;
alter table public.pumps       enable row level security;
alter table public.orders      enable row level security;
alter table public.coupons     enable row level security;
alter table public.payments    enable row level security;

create policy stations_read    on public.stations    for select to authenticated using (true);
create policy fuel_prices_read on public.fuel_prices for select to authenticated using (true);
create policy coupons_read     on public.coupons     for select to authenticated using (active);
create policy pumps_read       on public.pumps       for select to authenticated using (true);

create policy profiles_read_own on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_manager());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy orders_read on public.orders for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_manager()
    or (public.my_role() = 'staff' and station_id = public.my_station())
  );

create policy payments_read on public.payments for select to authenticated
  using (user_id = auth.uid() or public.is_manager());

-- ຜູ້ໃຊ້ແກ້ໄດ້ສະເພາະຊື່ ແລະ ເບີໂທ — ບໍ່ສາມາດແກ້ role, wallet, points ເອງ
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

revoke insert, update, delete on public.orders, public.pumps, public.payments,
  public.stations, public.fuel_prices, public.coupons from anon, authenticated;
grant select on public.orders, public.pumps, public.payments,
  public.stations, public.fuel_prices, public.coupons to authenticated;

-- RPC permissions
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.my_role(), public.my_station(), public.is_manager(),
  public.create_order(text,text,text,numeric,text), public.cancel_order(text),
  public.lookup_order(text), public.approve_order(text,int), public.complete_order(text),
  public.set_pump_status(text,text), public.staff_stats_today(text),
  public.sales_hourly(date,text), public.sales_by_fuel(date,text),
  public.assign_staff(text,text,text), public.set_fuel_price(text,int)
to authenticated;
-- ສະເພາະ server (service_role)
revoke execute on function public.mark_payment_paid(uuid,text,jsonb), public.expire_stale_orders(),
  public.assert_staff(), public.handle_new_user(), public.handle_new_station() from authenticated;
grant execute on function public.assert_staff() to authenticated;  -- ໃຊ້ພາຍໃນ RPC ອື່ນ (ກວດສິດເອງ)
grant execute on function public.mark_payment_paid(uuid,text,jsonb), public.expire_stale_orders() to service_role;

-- ---------------------------------------------------------------------------
-- 9. Realtime: ສົ່ງການປ່ຽນແປງໄປແອັບທັນທີ
-- ---------------------------------------------------------------------------

alter table public.orders   replica identity full;
alter table public.pumps    replica identity full;
alter table public.profiles replica identity full;
alter publication supabase_realtime add table public.orders, public.pumps, public.profiles, public.payments;
