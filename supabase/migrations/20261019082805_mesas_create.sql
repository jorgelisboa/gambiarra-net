-- gambiarra.net: mesa online · criar a mesa

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

revoke execute on function public.create_mesa(text, text) from public, anon;
grant execute on function public.create_mesa(text, text) to authenticated;
