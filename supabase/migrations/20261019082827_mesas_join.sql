-- gambiarra.net: mesa online · entrar na mesa

-- Entra na mesa pelo código, com a ficha escolhida. Sair das outras mesas fica com o app (o jogador
-- apaga a própria linha em mesa_members); joined_at diz qual é a mesa atual.
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
  insert into public.mesa_members (mesa_id, user_id, display_name, character_id)
  values (target, me, player_name, char_id)
  on conflict (mesa_id, user_id)
    do update set character_id = excluded.character_id, display_name = excluded.display_name, joined_at = now();
  return target;
end;
$$;

revoke execute on function public.join_mesa(text, text, text) from public, anon;
grant execute on function public.join_mesa(text, text, text) to authenticated;
