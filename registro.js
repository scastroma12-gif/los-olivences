const formulario = document.getElementById("formulario-registro");
const campoNombre = document.getElementById("nombre");

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const nombre = campoNombre.value.trim();
  if (!nombre) return;

  localStorage.setItem("nombreAlumno", nombre);
  window.location.href = "horario.html";
});
