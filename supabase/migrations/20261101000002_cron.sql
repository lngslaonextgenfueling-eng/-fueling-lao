-- ໃຫ້ອໍເດີທີ່ເກີນ 30 ນາທີ ໝົດອາຍຸອັດຕະໂນມັດ (ແລະ ຄືນເງິນເຂົ້າ wallet) ທຸກນາທີ
-- ຕ້ອງເປີດ extension "pg_cron" ໃນ Supabase → Database → Extensions ກ່ອນ (ຖ້າຍັງ)
create extension if not exists pg_cron;

select cron.schedule('expire-stale-orders', '* * * * *', $$select public.expire_stale_orders()$$);
