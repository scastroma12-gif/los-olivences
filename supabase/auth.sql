-- Acceso por alumno con Supabase Auth. Ejecutar después de schema.sql.

alter table public.alumnos
  add column if not exists user_id uuid unique references auth.users (id) on delete cascade;

create policy "alumno ve su registro" on public.alumnos
  for select to authenticated
  using (user_id = auth.uid());

create policy "alumno crea su registro" on public.alumnos
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "alumno edita su registro" on public.alumnos
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "alumno gestiona sus cursos" on public.cursos
  for all to authenticated
  using (alumno_id in (select id from public.alumnos where user_id = auth.uid()))
  with check (alumno_id in (select id from public.alumnos where user_id = auth.uid()));

create policy "alumno gestiona su trabajo" on public.trabajo
  for all to authenticated
  using (alumno_id in (select id from public.alumnos where user_id = auth.uid()))
  with check (alumno_id in (select id from public.alumnos where user_id = auth.uid()));

create policy "alumno gestiona sus tareas" on public.tareas
  for all to authenticated
  using (alumno_id in (select id from public.alumnos where user_id = auth.uid()))
  with check (alumno_id in (select id from public.alumnos where user_id = auth.uid()));
