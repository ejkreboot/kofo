-- Add name-based album password verification
-- Looks up album by name (case-insensitive) instead of UUID
create or replace function public.verify_album_password_by_name(
  p_album_name text,
  p_password text
)
returns table(id uuid, bucket_id text, name text) as $$
begin
  return query
    select a.id, a.bucket_id, a.name
    from public.albums a
    where lower(a.name) = lower(p_album_name)
      and a.password_hash = crypt(p_password, a.password_hash);
end;
$$ language plpgsql security definer;

grant execute on function public.verify_album_password_by_name(text, text) to anon;
