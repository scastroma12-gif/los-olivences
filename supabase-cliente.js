const SUPABASE_URL = "https://tjvetcdsooxrwgldhvpo.supabase.co";
const SUPABASE_CLAVE = "sb_publishable_QpDAznfZcBAZyTBviyz22A__TOXwTRK";

const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_CLAVE);

function dniActual() {
  return localStorage.getItem("dniAlumno");
}

async function entrarConDni(dni, nombre = null) {
  const { data, error } = await cliente.rpc("entrar_alumno", { p_dni: dni, p_nombre: nombre });
  if (error) throw error;
  return data[0] ?? null;
}
