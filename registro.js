const formulario = document.getElementById("formulario-acceso");
const campoNombreGrupo = document.getElementById("campo-nombre");
const campoNombre = document.getElementById("nombre");
const campoCorreo = document.getElementById("correo");
const campoClave = document.getElementById("clave");
const titulo = document.getElementById("titulo");
const descripcion = document.getElementById("descripcion");
const botonEnviar = document.getElementById("boton-enviar");
const botonModo = document.getElementById("cambiar-modo");
const mensaje = document.getElementById("mensaje");

const ERRORES = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "User already registered": "Ya existe una cuenta con ese correo.",
};

const PATRON_CORREO = /^[A-Z][A-Za-z0-9._%+-]*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

function validarCorreo(correo) {
  if (correo.length < 10) return "El correo debe tener al menos 10 caracteres.";
  if (correo.length > 254) return "El correo no puede tener más de 254 caracteres.";
  if (!correo.includes("@")) return "El correo debe contener @.";
  if (!PATRON_CORREO.test(correo)) {
    return "El correo debe empezar con mayúscula y tener un formato válido, por ejemplo Maria@correo.com.";
  }
  return null;
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
  descripcion.textContent = registrando ? "Crea tu cuenta para continuar." : "Ingresa con tu correo y contraseña.";
  botonEnviar.textContent = registrando ? "Crear cuenta" : "Iniciar sesión";
  botonModo.textContent = registrando ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate";
  mensaje.hidden = true;
}

botonModo.addEventListener("click", cambiarModo);

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensaje.hidden = true;
  botonEnviar.disabled = true;

  const correo = campoCorreo.value.trim();
  const clave = campoClave.value;

  try {
    if (registrando) {
      const errorCorreo = validarCorreo(correo);
      if (errorCorreo) {
        mostrarMensaje(errorCorreo);
        return;
      }
      const nombre = campoNombre.value.trim();
      const { data, error } = await cliente.auth.signUp({
        email: correo,
        password: clave,
        options: { data: { nombre } },
      });
      if (error) throw error;
      if (!data.session) {
        mostrarMensaje("Revisa tu correo para confirmar tu cuenta y luego inicia sesión.");
        return;
      }
      window.location.href = "horario.html";
    } else {
      const { error } = await cliente.auth.signInWithPassword({ email: correo, password: clave });
      if (error) throw error;
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    mostrarMensaje(ERRORES[error.message] ?? error.message);
  } finally {
    botonEnviar.disabled = false;
  }
});
