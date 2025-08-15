-- Create post_history table for 7-day history of generated posts
create table if not exists public.post_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('generated','bg_replace')),
  title text,
  caption text,
  hashtags text[] default '{}',
  cta text,
  image_url text,
  size text check (size in ('1024x1024','1024x1792','1792x1024')),
  created_at timestamptz not null default now()
);

create index if not exists post_history_user_created_idx on public.post_history (user_id, created_at desc);

-- RLS policies
alter table public.post_history enable row level security;
create policy post_history_select on public.post_history
  for select using (auth.uid() = user_id);
create policy post_history_insert on public.post_history
  for insert with check (auth.uid() = user_id);
create policy post_history_delete on public.post_history
  for delete using (auth.uid() = user_id);

-- Optional: keep last 200 per user
create or replace function public.trim_user_history() returns trigger as $$
begin
  delete from public.post_history
  where user_id = new.user_id
    and id not in (
      select id from public.post_history
      where user_id = new.user_id
      order by created_at desc
      limit 200
    );
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_trim_user_history on public.post_history;
create trigger trg_trim_user_history
after insert on public.post_history
for each row execute function public.trim_user_history();

-- Optional TTL via pg_cron: purge older than 7 days daily at 03:00
-- create extension if not exists pg_cron; -- Supabase usually has this
-- select cron.schedule(
--   'cleanup_post_history_daily',
--   '0 3 * * *',
--   $$ delete from public.post_history where created_at < now() - interval '7 days' $$
-- );


