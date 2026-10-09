const formulario = document.getElementById("formulario-registro");
const campoNombre = document.getElementById("nombre");
const mensaje = document.getElementById("mensaje");

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const nombre = campoNombre.value.trim();
  if (!nombre) return;

  localStorage.setItem("nombreAlumno", nombre);
  mensaje.textContent = `¡Registro exitoso, ${nombre}!`;
  mensaje.hidden = false;
  formulario.reset();
});
