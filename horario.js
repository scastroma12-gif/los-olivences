const DIAS = [
  { clave: "lun", etiqueta: "Lun" },
  { clave: "mar", etiqueta: "Mar" },
  { clave: "mie", etiqueta: "Mié" },
  { clave: "jue", etiqueta: "Jue" },
  { clave: "vie", etiqueta: "Vie" },
  { clave: "sab", etiqueta: "Sáb" },
  { clave: "dom", etiqueta: "Dom" },
];

const listaCursos = document.getElementById("lista-cursos");
const listaTareas = document.getElementById("lista-tareas");
const tieneTrabajo = document.getElementById("tiene-trabajo");
const camposTrabajo = document.getElementById("campos-trabajo");
const mensajeError = document.getElementById("mensaje-error");
const formulario = document.getElementById("formulario-horario");

function crearSelectorDias() {
  const grupo = document.createElement("fieldset");
  grupo.className = "dias";

  const leyenda = document.createElement("legend");
  leyenda.className = "etiqueta-leyenda";
  leyenda.textContent = "Días";

  const chips = document.createElement("div");
  chips.className = "chips";
  for (const dia of DIAS) {
    const opcion = document.createElement("label");
    opcion.className = "dia-chip";

    const casilla = document.createElement("input");
    casilla.type = "checkbox";
    casilla.className = "dia";
    casilla.value = dia.clave;

    const texto = document.createElement("span");
    texto.textContent = dia.etiqueta;

    opcion.append(casilla, texto);
    chips.appendChild(opcion);
  }

  grupo.append(leyenda, chips);
  return grupo;
}

function crearCampo(texto, control) {
  const etiqueta = document.createElement("label");
  etiqueta.className = "etiqueta-campo";
  etiqueta.textContent = texto;
  etiqueta.appendChild(control);
  return etiqueta;
}

function crearCurso() {
  const tarjeta = document.createElement("div");
  tarjeta.className = "curso";

  const nombre = document.createElement("input");
  nombre.type = "text";
  nombre.className = "curso-nombre";
  nombre.placeholder = "Ej. Estadística";
  nombre.required = true;

  const inicio = document.createElement("input");
  inicio.type = "time";
  inicio.className = "curso-inicio";
  inicio.lang = "en-US";
  inicio.required = true;

  const fin = document.createElement("input");
  fin.type = "time";
  fin.className = "curso-fin";
  fin.lang = "en-US";
  fin.required = true;

  const horas = document.createElement("div");
  horas.className = "horas";
  horas.append(crearCampo("Inicio", inicio), crearCampo("Fin", fin));

  const quitar = document.createElement("button");
  quitar.type = "button";
  quitar.className = "quitar";
  quitar.textContent = "Quitar curso";
  quitar.addEventListener("click", () => {
    tarjeta.remove();
    actualizarDiasDisponibles();
  });

  tarjeta.append(crearCampo("Curso", nombre), crearSelectorDias(), horas, quitar);
  return tarjeta;
}

function crearTarea() {
  const tarjeta = document.createElement("div");
  tarjeta.className = "curso tarea";

  const titulo = document.createElement("input");
  titulo.type = "text";
  titulo.className = "tarea-titulo";
  titulo.placeholder = "Ej. Informe de laboratorio";
  titulo.required = true;

  const tipo = document.createElement("select");
  tipo.className = "tarea-tipo";
  for (const opcion of ["Tarea individual", "Avance de grupo"]) {
    const elemento = document.createElement("option");
    elemento.value = opcion;
    elemento.textContent = opcion;
    tipo.appendChild(elemento);
  }

  const fecha = document.createElement("input");
  fecha.type = "date";
  fecha.className = "tarea-fecha";
  fecha.required = true;

  const quitar = document.createElement("button");
  quitar.type = "button";
  quitar.className = "quitar";
  quitar.textContent = "Quitar tarea";
  quitar.addEventListener("click", () => tarjeta.remove());

  tarjeta.append(
    crearCampo("Tarea", titulo),
    crearCampo("Tipo", tipo),
    crearCampo("Fecha límite", fecha),
    quitar,
  );
  return tarjeta;
}

function actualizarDiasDisponibles() {
  const casillas = [...formulario.querySelectorAll(".dia")];
  const ocupados = new Set(casillas.filter((casilla) => casilla.checked).map((casilla) => casilla.value));
  for (const casilla of casillas) {
    casilla.disabled = !casilla.checked && ocupados.has(casilla.value);
  }
}

function leerDias(contenedor) {
  return [...contenedor.querySelectorAll(".dia:checked")].map((casilla) => casilla.value);
}

function validarBloque(bloque, descripcion) {
  if (!bloque.inicio || !bloque.fin) return `Indica el horario de ${descripcion}.`;
  if (bloque.dias.length === 0) return `Selecciona al menos un día para ${descripcion}.`;
  if (bloque.inicio >= bloque.fin) return `La hora de inicio debe ser anterior a la de fin en ${descripcion}.`;
  return null;
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const cursos = [...listaCursos.querySelectorAll(".curso")].map((tarjeta) => ({
    nombre: tarjeta.querySelector(".curso-nombre").value.trim(),
    dias: leerDias(tarjeta),
    inicio: tarjeta.querySelector(".curso-inicio").value,
    fin: tarjeta.querySelector(".curso-fin").value,
  }));

  const trabajo = tieneTrabajo.checked
    ? {
        dias: leerDias(document.getElementById("dias-trabajo")),
        inicio: document.getElementById("trabajo-inicio").value,
        fin: document.getElementById("trabajo-fin").value,
      }
    : null;

  const errores = [
    ...cursos.map((curso) => validarBloque(curso, `el curso ${curso.nombre}`)),
    trabajo && validarBloque(trabajo, "tu jornada laboral"),
  ].filter(Boolean);

  if (errores.length > 0) {
    mensajeError.textContent = errores[0];
    mensajeError.hidden = false;
    return;
  }

  const tareas = [...listaTareas.querySelectorAll(".tarea")].map((tarjeta) => ({
    titulo: tarjeta.querySelector(".tarea-titulo").value.trim(),
    tipo: tarjeta.querySelector(".tarea-tipo").value,
    fecha: tarjeta.querySelector(".tarea-fecha").value,
  }));

  localStorage.setItem("horario", JSON.stringify({ cursos, trabajo, tareas }));
  window.location.href = "dashboard.html";
});

formulario.addEventListener("change", (evento) => {
  if (evento.target.classList.contains("dia")) actualizarDiasDisponibles();
});

tieneTrabajo.addEventListener("change", () => {
  camposTrabajo.hidden = !tieneTrabajo.checked;
  if (!tieneTrabajo.checked) {
    for (const casilla of document.querySelectorAll("#dias-trabajo .dia")) casilla.checked = false;
  }
  actualizarDiasDisponibles();
});

document.getElementById("agregar-curso").addEventListener("click", () => {
  listaCursos.appendChild(crearCurso());
  actualizarDiasDisponibles();
});

document.getElementById("agregar-tarea").addEventListener("click", () => {
  listaTareas.appendChild(crearTarea());
});

const nombre = localStorage.getItem("nombreAlumno");
document.getElementById("saludo").textContent = nombre ? `Hola, ${nombre}` : "Hola";

listaCursos.appendChild(crearCurso());
listaTareas.appendChild(crearTarea());
document.getElementById("dias-trabajo").appendChild(crearSelectorDias());
