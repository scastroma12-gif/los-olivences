-- Acceso solo con DNI. Ejecutar después de schema.sql (y reemplaza a auth.sql).

drop policy if exists "alumno ve su registro" on public.alumnos;
drop policy if exists "alumno crea su registro" on public.alumnos;
drop policy if exists "alumno edita su registro" on public.alumnos;
drop policy if exists "alumno gestiona sus cursos" on public.cursos;
drop policy if exists "alumno gestiona su trabajo" on public.trabajo;
drop policy if exists "alumno gestiona sus tareas" on public.tareas;

alter table public.alumnos drop column if exists user_id;

alter table public.alumnos
  add column if not exists dni text unique check (dni ~ '^(\d{7}|\d{8}|\d{10})$');

create or replace function public.entrar_alumno(p_dni text, p_nombre text default null)
returns table (alumno_id uuid, alumno_nombre text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_nombre is not null and not exists (select 1 from public.alumnos a where a.dni = p_dni) then
    insert into public.alumnos (dni, nombre) values (p_dni, p_nombre);
  end if;
  return query select a.id, a.nombre from public.alumnos a where a.dni = p_dni;
end;
$$;

create or replace function public.obtener_horario(p_dni text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'cursos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nombre', c.nombre,
        'dia', c.dia,
        'inicio', left(c.inicio::text, 5),
        'fin', left(c.fin::text, 5)
      ) order by c.inicio)
      from public.cursos c
      join public.alumnos a on a.id = c.alumno_id
      where a.dni = p_dni
    ), '[]'::jsonb),
    'trabajo', (
      select jsonb_build_object(
        'dias', to_jsonb(t.dias),
        'inicio', left(t.inicio::text, 5),
        'fin', left(t.fin::text, 5)
      )
      from public.trabajo t
      join public.alumnos a on a.id = t.alumno_id
      where a.dni = p_dni
    ),
    'tareas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'titulo', k.titulo,
        'tipo', k.tipo,
        'fecha', k.fecha
      ) order by k.fecha)
      from public.tareas k
      join public.alumnos a on a.id = k.alumno_id
      where a.dni = p_dni
    ), '[]'::jsonb)
  );
$$;

create or replace function public.guardar_horario(p_dni text, p_cursos jsonb, p_trabajo jsonb, p_tareas jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select a.id into v_id from public.alumnos a where a.dni = p_dni;
  if v_id is null then
    raise exception 'Alumno no encontrado';
  end if;

  delete from public.cursos where alumno_id = v_id;
  delete from public.trabajo where alumno_id = v_id;
  delete from public.tareas where alumno_id = v_id;

  insert into public.cursos (alumno_id, nombre, dia, inicio, fin)
  select v_id, c->>'nombre', c->>'dia', (c->>'inicio')::time, (c->>'fin')::time
  from jsonb_array_elements(p_cursos) c;

  if jsonb_typeof(p_trabajo) = 'object' then
    insert into public.trabajo (alumno_id, dias, inicio, fin)
    values (
      v_id,
      array(select jsonb_array_elements_text(p_trabajo->'dias')),
      (p_trabajo->>'inicio')::time,
      (p_trabajo->>'fin')::time
    );
  end if;

  insert into public.tareas (alumno_id, titulo, tipo, fecha)
  select v_id, t->>'titulo', t->>'tipo', (t->>'fecha')::date
  from jsonb_array_elements(p_tareas) t;
end;
$$;

create or replace function public.agregar_tarea(p_dni text, p_titulo text, p_tipo text, p_fecha date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tareas (alumno_id, titulo, tipo, fecha)
  select a.id, p_titulo, p_tipo, p_fecha from public.alumnos a where a.dni = p_dni;
  if not found then
    raise exception 'Alumno no encontrado';
  end if;
end;
$$;
