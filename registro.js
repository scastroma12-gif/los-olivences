const formulario = document.getElementById("formulario-acceso");
const campoNombreGrupo = document.getElementById("campo-nombre");
const campoNombre = document.getElementById("nombre");
const campoDni = document.getElementById("dni");
const campoClave = document.getElementById("clave");
const titulo = document.getElementById("titulo");
const descripcion = document.getElementById("descripcion");
const botonEnviar = document.getElementById("boton-enviar");
const botonModo = document.getElementById("cambiar-modo");
const mensaje = document.getElementById("mensaje");

const ERRORES = {
  "Invalid login credentials": "DNI o contraseña incorrectos.",
  "User already registered": "Ya existe una cuenta con ese DNI.",
};

const PATRON_DNI = /^\d{8}$/;

function correoDeDni(dni) {
  return `${dni}@alumnos.ucv.pe`;
}

let registrando = true;

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
  mensaje.hidden = false;
}

function cambiarModo() {
  registrando = !registrando;
  campoNombreGrupo.hidden = !registrando;
  campoNombre.required = registrando;
  titulo.textContent = registrando ? "Regístrate en tu aula virtual" : "Inicia sesión en tu aula virtual";
  descripcion.textContent = registrando ? "Crea tu cuenta para continuar." : "Ingresa con tu DNI y contraseña.";
  botonEnviar.textContent = registrando ? "Crear cuenta" : "Iniciar sesión";
  botonModo.textContent = registrando ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate";
  mensaje.hidden = true;
}

botonModo.addEventListener("click", cambiarModo);

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensaje.hidden = true;
  botonEnviar.disabled = true;

  const dni = campoDni.value.trim();
  const clave = campoClave.value;

  try {
    if (!PATRON_DNI.test(dni)) {
      mostrarMensaje("El DNI debe tener exactamente 8 números.");
      return;
    }

    if (registrando) {
      const nombre = campoNombre.value.trim();
      const { data, error } = await cliente.auth.signUp({
        email: correoDeDni(dni),
        password: clave,
        options: { data: { nombre } },
      });
      if (error) throw error;
      if (!data.session) {
        mostrarMensaje("Tu cuenta requiere confirmación. Pide al administrador que la active.");
        return;
      }
      window.location.href = "horario.html";
    } else {
      const { error } = await cliente.auth.signInWithPassword({
        email: correoDeDni(dni),
        password: clave,
      });
      if (error) throw error;
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    mostrarMensaje(ERRORES[error.message] ?? error.message);
  } finally {
    botonEnviar.disabled = false;
  }
});
