create or replace function public.sync_usuario_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (
    id,
    correo,
    nombre,
    foto,
    telefono
  )
  values (
    new.id,
    new.email,
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'name',
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'username'
        )
      ),
      ''
    ),
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'avatar_url',
          new.raw_user_meta_data ->> 'picture'
        )
      ),
      ''
    ),
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'phone',
          new.raw_user_meta_data ->> 'telefono'
        )
      ),
      ''
    )
  )
  on conflict (id) do update
  set
    correo = excluded.correo,
    nombre = coalesce(excluded.nombre, usuarios.nombre),
    foto = coalesce(excluded.foto, usuarios.foto),
    telefono = coalesce(excluded.telefono, usuarios.telefono)
  where
    usuarios.correo is distinct from excluded.correo
    or (excluded.nombre is not null and usuarios.nombre is distinct from excluded.nombre)
    or (excluded.foto is not null and usuarios.foto is distinct from excluded.foto)
    or (excluded.telefono is not null and usuarios.telefono is distinct from excluded.telefono);

  return new;
end;
$$;

drop trigger if exists on_auth_user_sync_usuario on auth.users;

create trigger on_auth_user_sync_usuario
after insert or update on auth.users
for each row
execute procedure public.sync_usuario_from_auth_user();
