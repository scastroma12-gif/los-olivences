const formulario = document.getElementById("formulario-acceso");
const campoNombreGrupo = document.getElementById("campo-nombre");
const campoNombre = document.getElementById("nombre");
const campoDni = document.getElementById("dni");
const titulo = document.getElementById("titulo");
const descripcion = document.getElementById("descripcion");
const botonEnviar = document.getElementById("boton-enviar");
const botonModo = document.getElementById("cambiar-modo");
const mensaje = document.getElementById("mensaje");

const PATRON_DNI = /^(\d{7}|\d{8}|\d{10})$/;

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
  descripcion.textContent = registrando ? "Ingresa tu DNI para continuar." : "Ingresa tu DNI.";
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

  try {
    if (!PATRON_DNI.test(dni)) {
      mostrarMensaje("El DNI debe tener 7, 8 o 10 números.");
      return;
    }

    const nombre = registrando ? campoNombre.value.trim() : null;
    const alumno = await entrarConDni(dni, nombre);
    if (!alumno) {
      mostrarMensaje("No existe una cuenta con ese DNI. Regístrate primero.");
      return;
    }

    localStorage.setItem("dniAlumno", dni);
    window.location.href = registrando ? "horario.html" : "dashboard.html";
  } catch (error) {
    console.error(error);
    mostrarMensaje("No se pudo completar la operación. Intenta de nuevo.");
  } finally {
    botonEnviar.disabled = false;
  }
});
