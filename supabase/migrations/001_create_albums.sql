-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- Albums table
create table if not exists public.albums (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text not null,
  name       text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- RPC to verify album password. Returns album row (minus hash) on success, empty on failure.
create or replace function public.verify_album_password(
  p_album_id uuid,
  p_password text
)
returns table(id uuid, bucket_id text, name text) as $$
begin
  return query
    select a.id, a.bucket_id, a.name
    from public.albums a
    where a.id = p_album_id
      and a.password_hash = crypt(p_password, a.password_hash);
end;
$$ language plpgsql security definer;

-- Helper to insert an album with a hashed password
create or replace function public.create_album(
  p_bucket_id text,
  p_name text,
  p_password text
)
returns uuid as $$
declare
  new_id uuid;
begin
  insert into public.albums (bucket_id, name, password_hash)
  values (p_bucket_id, p_name, crypt(p_password, gen_salt('bf')))
  returning albums.id into new_id;
  return new_id;
end;
$$ language plpgsql security definer;

-- RLS: enable but deny direct access to the table for anon
alter table public.albums enable row level security;

-- No SELECT/INSERT/UPDATE/DELETE policies for anon — all access goes through security definer functions
-- Grant execute on the RPC functions to anon
grant execute on function public.verify_album_password(uuid, text) to anon;
grant execute on function public.create_album(text, text, text) to authenticated;
