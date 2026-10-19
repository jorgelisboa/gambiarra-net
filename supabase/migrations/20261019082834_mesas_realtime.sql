-- gambiarra.net: mesa online, parte final. Quem está na mesa lê a ficha sentada, e o Realtime liga.

create policy "ficha: a mesa lê a ficha sentada" on public.characters
  for select to authenticated
  using (public.sees_seated_character(user_id, id));

-- Ao vivo: PC, telão e celulares assinam essas tabelas (o Realtime respeita as políticas de select).
alter publication supabase_realtime add table public.mesas, public.mesa_members, public.characters;
