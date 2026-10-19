-- gambiarra.net: mesa online.
-- O mestre cria a mesa e passa o código (6 letras); o jogador entra com o código e senta uma ficha.
-- `mesas.state` é o que o mestre põe no ar pra mesa toda: o combate e a arquitetura de net (só os
-- andares revelados). O mestre continua sendo a fonte: escreve o estado, os jogadores só leem.
-- As fichas continuam na tabela `characters`, do dono. Quem está na mesma mesa lê a ficha sentada;
-- o mestre muda HP, armadura e death save pela função `mesa_patch_character` (só essas chaves).

create table public.mesas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  name text not null,
  gm_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  gm_name text,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mesas_gm_idx on public.mesas (gm_id);

-- Um jogador numa mesa, com a ficha que levou (null = ainda não escolheu).
create table public.mesa_members (
  mesa_id uuid not null references public.mesas (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  display_name text,
  character_id text,
  joined_at timestamptz not null default now(),
  primary key (mesa_id, user_id)
);

create index mesa_members_user_idx on public.mesa_members (user_id);
create index mesa_members_character_idx on public.mesa_members (user_id, character_id);

alter table public.mesas enable row level security;
alter table public.mesa_members enable row level security;

-- Funções de checagem com security definer: as políticas de uma tabela consultam a outra sem
-- cair em recursão de RLS.

create function public.is_mesa_gm(m uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.mesas where id = m and gm_id = (select auth.uid()));
$$;

create function public.is_mesa_member(m uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.mesa_members where mesa_id = m and user_id = (select auth.uid()));
$$;

-- A ficha (dono, id) está sentada numa mesa em que quem pergunta é mestre ou jogador.
create function public.sees_seated_character(owner uuid, char_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.mesa_members s
    join public.mesas m on m.id = s.mesa_id
    where s.user_id = owner
      and s.character_id = char_id
      and (
        m.gm_id = (select auth.uid())
        or exists (
          select 1 from public.mesa_members me
          where me.mesa_id = s.mesa_id and me.user_id = (select auth.uid())
        )
      )
  );
$$;

revoke execute on function public.is_mesa_gm(uuid) from public, anon;
revoke execute on function public.is_mesa_member(uuid) from public, anon;
revoke execute on function public.sees_seated_character(uuid, text) from public, anon;
grant execute on function public.is_mesa_gm(uuid) to authenticated;
grant execute on function public.is_mesa_member(uuid) to authenticated;
grant execute on function public.sees_seated_character(uuid, text) to authenticated;

create policy "mesa: mestre e jogadores leem" on public.mesas
  for select to authenticated
  using (gm_id = (select auth.uid()) or public.is_mesa_member(id));
create policy "mesa: mestre cria" on public.mesas
  for insert to authenticated with check (gm_id = (select auth.uid()));
create policy "mesa: mestre edita" on public.mesas
  for update to authenticated
  using (gm_id = (select auth.uid())) with check (gm_id = (select auth.uid()));
create policy "mesa: mestre encerra" on public.mesas
  for delete to authenticated using (gm_id = (select auth.uid()));

-- Entrar é só pela função join_mesa (precisa do código); por isso não tem política de insert.
create policy "membro: a mesa vê quem está nela" on public.mesa_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_mesa_gm(mesa_id) or public.is_mesa_member(mesa_id));
create policy "membro: troca a própria ficha" on public.mesa_members
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "membro: sai, ou o mestre tira" on public.mesa_members
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_mesa_gm(mesa_id));
