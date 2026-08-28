-- v4.10.7: profile photo uploads.
-- avatar_url has existed on profiles and been displayed in the UI since
-- earlier versions, but nothing could ever populate it -- there was no
-- storage bucket or upload path. This adds a public bucket (photos need to
-- be publicly viewable for the directory to work, unlike private resumes)
-- with folder-scoped write access so a user can only manage their own file.

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

drop policy if exists "User upload own avatar" on storage.objects;
create policy "User upload own avatar" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "User update own avatar" on storage.objects;
create policy "User update own avatar" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "User delete own avatar" on storage.objects;
create policy "User delete own avatar" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Anyone can view avatars" on storage.objects;
create policy "Anyone can view avatars" on storage.objects for select to anon, authenticated
using (bucket_id = 'avatars');
