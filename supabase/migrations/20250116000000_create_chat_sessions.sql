-- Chat sessions + messages persistence for Social Media assistant

-- Sessions table
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text default 'Social Media' not null,
  status text default 'active' check (status in ('active','archived')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_last_idx on public.chat_sessions (user_id, last_message_at desc);

alter table public.chat_sessions enable row level security;
create policy chat_sessions_select on public.chat_sessions
  for select using (auth.uid() = user_id);
create policy chat_sessions_insert on public.chat_sessions
  for insert with check (auth.uid() = user_id);
create policy chat_sessions_update on public.chat_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy chat_sessions_delete on public.chat_sessions
  for delete using (auth.uid() = user_id);

-- Messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text,
  type text,
  image_url text,
  saved_url text,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_created_idx on public.chat_messages (session_id, created_at asc);
create index if not exists chat_messages_user_created_idx on public.chat_messages (user_id, created_at desc);

alter table public.chat_messages enable row level security;
create policy chat_messages_select on public.chat_messages
  for select using (auth.uid() = user_id);
create policy chat_messages_insert on public.chat_messages
  for insert with check (auth.uid() = user_id);
create policy chat_messages_delete on public.chat_messages
  for delete using (auth.uid() = user_id);

-- Keep chat_sessions.last_message_at in sync
create or replace function public.bump_session_last_message()
returns trigger as $$
begin
  update public.chat_sessions
     set last_message_at = coalesce(new.created_at, now())
   where id = new.session_id;
  return new;
end;$$ language plpgsql;

drop trigger if exists trg_bump_session_last_message on public.chat_messages;
create trigger trg_bump_session_last_message
after insert on public.chat_messages
for each row execute function public.bump_session_last_message();

-- Trim messages per session to last 2000
create or replace function public.trim_session_messages()
returns trigger as $$
begin
  delete from public.chat_messages
   where session_id = new.session_id
     and id not in (
       select id from public.chat_messages
        where session_id = new.session_id
        order by created_at desc
        limit 2000
     );
  return new;
end;$$ language plpgsql;

drop trigger if exists trg_trim_session_messages on public.chat_messages;
create trigger trg_trim_session_messages
after insert on public.chat_messages
for each row execute function public.trim_session_messages();

-- Cap sessions per user to last 20
create or replace function public.trim_user_sessions()
returns trigger as $$
begin
  delete from public.chat_sessions
   where user_id = new.user_id
     and id not in (
       select id from public.chat_sessions
        where user_id = new.user_id
        order by last_message_at desc
        limit 20
     );
  return new;
end;$$ language plpgsql;

drop trigger if exists trg_trim_user_sessions on public.chat_sessions;
create trigger trg_trim_user_sessions
after insert on public.chat_sessions
for each row execute function public.trim_user_sessions();

-- Optional TTL via pg_cron (uncomment if you want automatic cleanup):
-- delete messages older than 30 days and orphan sessions
-- create extension if not exists pg_cron;
-- select cron.schedule(
--   'cleanup_chat_messages_daily',
--   '15 3 * * *',
--   $$ delete from public.chat_messages where created_at < now() - interval '30 days' $$
-- );
-- select cron.schedule(
--   'cleanup_empty_sessions_daily',
--   '25 3 * * *',
--   $$ delete from public.chat_sessions s where not exists (select 1 from public.chat_messages m where m.session_id = s.id) and s.created_at < now() - interval '7 days' $$
-- );


