-- gambiarra.net: perfil do usuário (login Google) + dados do app (fichas, combate) por usuário.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  -- último papel escolhido no login; o app pergunta de novo a cada login
  role text check (role in ('mestre', 'jogador')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AppData inteiro em jsonb (mesmo formato do localStorage). Uma linha por usuário.
create table public.app_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.app_data enable row level security;

create policy "perfil: dono lê" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: dono cria" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "perfil: dono edita" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "dados: dono lê" on public.app_data
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "dados: dono cria" on public.app_data
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dados: dono edita" on public.app_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- perfil criado junto com o usuário, com nome e foto do Google
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
