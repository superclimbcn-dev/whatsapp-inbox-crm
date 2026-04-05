begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_user_role'
  ) then
    create type public.app_user_role as enum ('admin');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'channel_provider'
  ) then
    create type public.channel_provider as enum ('whatsapp_cloud');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'channel_status'
  ) then
    create type public.channel_status as enum ('active', 'inactive');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'conversation_status'
  ) then
    create type public.conversation_status as enum ('open', 'pending', 'closed');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'message_direction'
  ) then
    create type public.message_direction as enum ('inbound', 'outbound');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'message_type'
  ) then
    create type public.message_type as enum (
      'text',
      'image',
      'audio',
      'video',
      'document',
      'interactive',
      'system',
      'unknown'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'message_status'
  ) then
    create type public.message_status as enum (
      'received',
      'queued',
      'sent',
      'delivered',
      'read',
      'failed'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'handoff_status'
  ) then
    create type public.handoff_status as enum ('requested', 'active', 'released');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'wa_event_type'
  ) then
    create type public.wa_event_type as enum ('message', 'status', 'unknown');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.get_my_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select users.account_id
  from public.users
  where users.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.account_id = public.get_my_account_id()
      and users.role = 'admin'
      and users.is_active = true
  );
$$;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'UTC',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  role public.app_user_role not null default 'admin',
  full_name text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  provider public.channel_provider not null default 'whatsapp_cloud',
  status public.channel_status not null default 'inactive',
  name text not null,
  phone_number_id text unique,
  business_account_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  display_name text,
  phone_e164 text not null,
  wa_contact_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_account_id_phone_e164_key unique (account_id, phone_e164)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  channel_id uuid references public.channels (id) on delete set null,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  assigned_user_id uuid references public.users (id) on delete set null,
  status public.conversation_status not null default 'open',
  subject text,
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  channel_id uuid references public.channels (id) on delete set null,
  direction public.message_direction not null,
  type public.message_type not null default 'text',
  status public.message_status not null default 'received',
  body text,
  wa_message_id text unique,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wa_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts (id) on delete cascade,
  channel_id uuid references public.channels (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  message_id uuid references public.messages (id) on delete set null,
  provider_event_id text unique,
  event_type public.wa_event_type not null default 'unknown',
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.handoffs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  requested_by_user_id uuid references public.users (id) on delete set null,
  assigned_user_id uuid references public.users (id) on delete set null,
  status public.handoff_status not null default 'requested',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_account_id_name_key unique (account_id, name)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_account_id
  on public.users (account_id);

create index if not exists idx_channels_account_id
  on public.channels (account_id);

create index if not exists idx_contacts_account_id
  on public.contacts (account_id);

create index if not exists idx_conversations_account_id
  on public.conversations (account_id);

create index if not exists idx_conversations_contact_id
  on public.conversations (contact_id);

create index if not exists idx_conversations_last_message_at
  on public.conversations (last_message_at desc nulls last);

create index if not exists idx_messages_conversation_created_at
  on public.messages (conversation_id, created_at desc);

create index if not exists idx_messages_account_id
  on public.messages (account_id);

create index if not exists idx_wa_events_received_at
  on public.wa_events (received_at desc);

create index if not exists idx_wa_events_account_id
  on public.wa_events (account_id);

create index if not exists idx_handoffs_conversation_id
  on public.handoffs (conversation_id);

create index if not exists idx_audit_log_account_created_at
  on public.audit_log (account_id, created_at desc);

drop trigger if exists set_updated_at_accounts on public.accounts;
create trigger set_updated_at_accounts
before update on public.accounts
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_users on public.users;
create trigger set_updated_at_users
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_channels on public.channels;
create trigger set_updated_at_channels
before update on public.channels
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_contacts on public.contacts;
create trigger set_updated_at_contacts
before update on public.contacts
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_conversations on public.conversations;
create trigger set_updated_at_conversations
before update on public.conversations
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_messages on public.messages;
create trigger set_updated_at_messages
before update on public.messages
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_handoffs on public.handoffs;
create trigger set_updated_at_handoffs
before update on public.handoffs
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_tags on public.tags;
create trigger set_updated_at_tags
before update on public.tags
for each row
execute function public.set_updated_at();

alter table public.accounts enable row level security;
alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.wa_events enable row level security;
alter table public.handoffs enable row level security;
alter table public.tags enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists accounts_select_own on public.accounts;
create policy accounts_select_own
on public.accounts
for select
to authenticated
using (id = public.get_my_account_id());

drop policy if exists accounts_update_admin on public.accounts;
create policy accounts_update_admin
on public.accounts
for update
to authenticated
using (
  id = public.get_my_account_id()
  and public.is_admin()
)
with check (
  id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists users_select_same_account on public.users;
create policy users_select_same_account
on public.users
for select
to authenticated
using (account_id = public.get_my_account_id());

drop policy if exists users_update_self on public.users;
create policy users_update_self
on public.users
for update
to authenticated
using (
  id = auth.uid()
  and account_id = public.get_my_account_id()
)
with check (
  id = auth.uid()
  and account_id = public.get_my_account_id()
);

drop policy if exists channels_select_same_account on public.channels;
create policy channels_select_same_account
on public.channels
for select
to authenticated
using (account_id = public.get_my_account_id());

drop policy if exists channels_insert_admin on public.channels;
create policy channels_insert_admin
on public.channels
for insert
to authenticated
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists channels_update_admin on public.channels;
create policy channels_update_admin
on public.channels
for update
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
)
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists channels_delete_admin on public.channels;
create policy channels_delete_admin
on public.channels
for delete
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists contacts_select_same_account on public.contacts;
create policy contacts_select_same_account
on public.contacts
for select
to authenticated
using (account_id = public.get_my_account_id());

drop policy if exists contacts_insert_admin on public.contacts;
create policy contacts_insert_admin
on public.contacts
for insert
to authenticated
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists contacts_update_admin on public.contacts;
create policy contacts_update_admin
on public.contacts
for update
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
)
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists contacts_delete_admin on public.contacts;
create policy contacts_delete_admin
on public.contacts
for delete
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists conversations_select_same_account on public.conversations;
create policy conversations_select_same_account
on public.conversations
for select
to authenticated
using (account_id = public.get_my_account_id());

drop policy if exists conversations_insert_admin on public.conversations;
create policy conversations_insert_admin
on public.conversations
for insert
to authenticated
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists conversations_update_admin on public.conversations;
create policy conversations_update_admin
on public.conversations
for update
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
)
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists conversations_delete_admin on public.conversations;
create policy conversations_delete_admin
on public.conversations
for delete
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists messages_select_same_account on public.messages;
create policy messages_select_same_account
on public.messages
for select
to authenticated
using (account_id = public.get_my_account_id());

drop policy if exists messages_insert_admin on public.messages;
create policy messages_insert_admin
on public.messages
for insert
to authenticated
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists messages_update_admin on public.messages;
create policy messages_update_admin
on public.messages
for update
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
)
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists messages_delete_admin on public.messages;
create policy messages_delete_admin
on public.messages
for delete
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists wa_events_select_same_account on public.wa_events;
create policy wa_events_select_same_account
on public.wa_events
for select
to authenticated
using (account_id = public.get_my_account_id());

drop policy if exists wa_events_insert_admin on public.wa_events;
create policy wa_events_insert_admin
on public.wa_events
for insert
to authenticated
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists handoffs_select_same_account on public.handoffs;
create policy handoffs_select_same_account
on public.handoffs
for select
to authenticated
using (account_id = public.get_my_account_id());

drop policy if exists handoffs_insert_admin on public.handoffs;
create policy handoffs_insert_admin
on public.handoffs
for insert
to authenticated
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists handoffs_update_admin on public.handoffs;
create policy handoffs_update_admin
on public.handoffs
for update
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
)
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists handoffs_delete_admin on public.handoffs;
create policy handoffs_delete_admin
on public.handoffs
for delete
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists tags_select_same_account on public.tags;
create policy tags_select_same_account
on public.tags
for select
to authenticated
using (account_id = public.get_my_account_id());

drop policy if exists tags_insert_admin on public.tags;
create policy tags_insert_admin
on public.tags
for insert
to authenticated
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists tags_update_admin on public.tags;
create policy tags_update_admin
on public.tags
for update
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
)
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists tags_delete_admin on public.tags;
create policy tags_delete_admin
on public.tags
for delete
to authenticated
using (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

drop policy if exists audit_log_select_same_account on public.audit_log;
create policy audit_log_select_same_account
on public.audit_log
for select
to authenticated
using (account_id = public.get_my_account_id());

drop policy if exists audit_log_insert_admin on public.audit_log;
create policy audit_log_insert_admin
on public.audit_log
for insert
to authenticated
with check (
  account_id = public.get_my_account_id()
  and public.is_admin()
);

commit;
