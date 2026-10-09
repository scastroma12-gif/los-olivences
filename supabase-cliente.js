const SUPABASE_URL = "https://tjvetcdsooxrwgldhvpo.supabase.co";
const SUPABASE_CLAVE = "sb_publishable_QpDAznfZcBAZyTBviyz22A__TOXwTRK";

const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_CLAVE);

async function obtenerAlumno() {
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) return null;

  const { data: existente, error: errorBusqueda } = await cliente
    .from("alumnos")
    .select("id, nombre")
    .eq("user_id", user.id)
    .maybeSingle();
  if (errorBusqueda) throw errorBusqueda;
  if (existente) return existente;

  const { data: nuevo, error } = await cliente
    .from("alumnos")
    .insert({ user_id: user.id, nombre: user.user_metadata.nombre })
    .select("id, nombre")
    .single();
  if (error) throw error;
  return nuevo;
}
