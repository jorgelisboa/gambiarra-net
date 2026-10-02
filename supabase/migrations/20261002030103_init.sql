-- gambiarra.net: perfil do usuário (login Google) + fichas de personagem.
-- Combate e personagem da sessão ficam só no navegador por enquanto.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  -- último papel escolhido no login; o app pergunta de novo a cada login
  role text check (role in ('mestre', 'jogador')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Uma linha por ficha. `data` é o Character do app (src/lib/types.ts) inteiro;
-- nome e role ficam também em colunas pra listar/consultar sem abrir o json.
-- chave (user_id, id): duas contas no mesmo navegador podem importar as mesmas fichas locais.
create table public.characters (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  role text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.profiles enable row level security;
alter table public.characters enable row level security;

create policy "perfil: dono lê" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: dono cria" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "perfil: dono edita" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "ficha: dono lê" on public.characters
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "ficha: dono cria" on public.characters
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ficha: dono edita" on public.characters
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ficha: dono apaga" on public.characters
  for delete to authenticated using ((select auth.uid()) = user_id);

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
