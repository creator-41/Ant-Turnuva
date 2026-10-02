-- ANT Fantezi Lig anonim ziyaret istatistikleri
-- Supabase production project: rmoalquwkfsyrsoqenzb
create table public.site_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor_id uuid not null,
  session_id uuid not null,
  section text not null check (section in ('home','puan-durumu','fikstur','istatistik','kadrolar','siralama','finaller','Fantezi')),
  device_label text not null check (device_label in ('iPhone','iPad','Samsung','Android','Windows','Mac','Linux','Diğer')),
  source_label text not null check (source_label in ('Doğrudan','Site içi','Instagram','WhatsApp','Google','Facebook','TikTok','YouTube','Diğer site')),
  app_mode boolean not null default false
);
create index site_visits_created_at_idx on public.site_visits (created_at desc);
alter table public.site_visits enable row level security;
revoke all on public.site_visits from anon, authenticated;
grant insert on public.site_visits to anon, authenticated;
grant select on public.site_visits to authenticated;
create policy "Ziyaretçiler anonim kayıt ekleyebilir"
  on public.site_visits for insert to anon, authenticated
  with check (true);
create policy "Yalnızca admin ziyaret istatistiği okuyabilir"
  on public.site_visits for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );
