-- gambiarra.net: mesa online · dano do mestre na ficha do jogador

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

revoke execute on function public.mesa_patch_character(uuid, text, jsonb) from public, anon;
grant execute on function public.mesa_patch_character(uuid, text, jsonb) to authenticated;
