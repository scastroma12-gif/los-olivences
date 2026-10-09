-- Mi Día · Universidad César Vallejo
-- Ejecutar en Supabase > SQL Editor.

create table if not exists public.alumnos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.cursos (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  dia text not null check (dia in ('lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom')),
  inicio time not null,
  fin time not null,
  check (inicio < fin)
);

create index if not exists cursos_alumno_id_idx on public.cursos (alumno_id);

create table if not exists public.trabajo (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null unique references public.alumnos(id) on delete cascade,
  dias text[] not null check (
    cardinality(dias) > 0
    and dias <@ array['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']::text[]
  ),
  inicio time not null,
  fin time not null,
  check (inicio < fin)
);

create table if not exists public.tareas (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  titulo text not null check (length(trim(titulo)) > 0),
  tipo text not null check (tipo in ('Tarea individual', 'Avance de grupo')),
  fecha date not null
);

create index if not exists tareas_alumno_fecha_idx on public.tareas (alumno_id, fecha);

-- RLS activo sin políticas: la clave publicable no puede leer ni escribir hasta que se definan políticas (requiere Supabase Auth).
alter table public.alumnos enable row level security;
alter table public.cursos enable row level security;
alter table public.trabajo enable row level security;
alter table public.tareas enable row level security;
