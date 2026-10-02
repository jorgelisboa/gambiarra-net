-- gambiarra.net: foto do personagem.
-- Bucket público: a URL da foto fica no `data` da ficha e abre sem token. Listar o bucket não é
-- público; cada conta só vê, envia e apaga dentro da própria pasta.
-- Caminho: <user_id>/<character_id>/<arquivo>. O app recorta e reduz a imagem antes de enviar
-- (quadrado de 384px, webp ou jpeg), então o limite é folgado.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portraits', 'portraits', true, 1048576, array['image/webp', 'image/jpeg']);

create policy "retrato: dono vê" on storage.objects
  for select to authenticated
  using (bucket_id = 'portraits' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "retrato: dono envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portraits' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "retrato: dono apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portraits' and (storage.foldername(name))[1] = (select auth.uid()::text));
