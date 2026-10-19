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

create policy "ficha: a mesa lê a ficha sentada" on public.characters
  for select to authenticated
  using (public.sees_seated_character(user_id, id));

-- Cria a mesa com um código livre. Sem I, O, 0 e 1, que se confundem lidos na TV.
create function public.create_mesa(mesa_name text, gm_display_name text default null)
returns public.mesas
language plpgsql
security invoker
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  created public.mesas;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    begin
      insert into public.mesas (code, name, gm_name)
      values (new_code, coalesce(nullif(trim(mesa_name), ''), 'mesa'), gm_display_name)
      returning * into created;
      return created;
    exception when unique_violation then
      -- código já usado: tenta outro
    end;
  end loop;
end;
$$;

-- Entra na mesa pelo código, com a ficha escolhida. Um jogador fica numa mesa só: sai das outras.
create function public.join_mesa(mesa_code text, char_id text, player_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  target uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select id into target from public.mesas where code = upper(trim(mesa_code));
  if target is null then
    raise exception 'mesa not found' using errcode = 'P0002';
  end if;
  if char_id is not null and not exists (
    select 1 from public.characters where user_id = me and id = char_id
  ) then
    raise exception 'character not found' using errcode = 'P0002';
  end if;
  delete from public.mesa_members where user_id = me and mesa_id <> target;
  insert into public.mesa_members (mesa_id, user_id, display_name, character_id)
  values (target, me, player_name, char_id)
  on conflict (mesa_id, user_id)
    do update set character_id = excluded.character_id, display_name = excluded.display_name;
  return target;
end;
$$;

-- O mestre muda só as chaves de combate (hp, gear, deathSavePenalty) da ficha sentada na mesa dele.
-- Merge raso no jsonb: o resto da ficha, que o jogador pode estar mexendo, fica como está.
create function public.mesa_patch_character(owner uuid, char_id text, patch jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean jsonb;
begin
  if not exists (
    select 1
    from public.mesa_members s
    join public.mesas m on m.id = s.mesa_id
    where s.user_id = owner and s.character_id = char_id and m.gm_id = (select auth.uid())
  ) then
    raise exception 'not the gm of this character' using errcode = '42501';
  end if;
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into clean
  from jsonb_each(patch)
  where key in ('hp', 'gear', 'deathSavePenalty');
  update public.characters
  set data = data || clean, updated_at = now()
  where user_id = owner and id = char_id;
end;
$$;

revoke execute on function public.create_mesa(text, text) from public, anon;
revoke execute on function public.join_mesa(text, text, text) from public, anon;
revoke execute on function public.mesa_patch_character(uuid, text, jsonb) from public, anon;
grant execute on function public.create_mesa(text, text) to authenticated;
grant execute on function public.join_mesa(text, text, text) to authenticated;
grant execute on function public.mesa_patch_character(uuid, text, jsonb) to authenticated;

-- Ao vivo: PC, telão e celulares assinam essas tabelas (o Realtime respeita as políticas de select).
alter publication supabase_realtime add table public.mesas, public.mesa_members, public.characters;
