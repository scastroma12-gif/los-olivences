const DIAS = [
  { clave: "lun", etiqueta: "Lun" },
  { clave: "mar", etiqueta: "Mar" },
  { clave: "mie", etiqueta: "Mié" },
  { clave: "jue", etiqueta: "Jue" },
  { clave: "vie", etiqueta: "Vie" },
  { clave: "sab", etiqueta: "Sáb" },
  { clave: "dom", etiqueta: "Dom" },
];

const saludo = document.getElementById("saludo");
const listaCursos = document.getElementById("lista-cursos");
const listaTareas = document.getElementById("lista-tareas");
const tieneTrabajo = document.getElementById("tiene-trabajo");
const camposTrabajo = document.getElementById("campos-trabajo");
const mensajeError = document.getElementById("mensaje-error");
const formulario = document.getElementById("formulario-horario");

function crearSelectorDias(seleccionados = []) {
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
    casilla.checked = seleccionados.includes(dia.clave);

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

function crearCurso(datos = {}) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "curso";

  const nombre = document.createElement("input");
  nombre.type = "text";
  nombre.className = "curso-nombre";
  nombre.placeholder = "Ej. Estadística";
  nombre.required = true;
  nombre.value = datos.nombre ?? "";

  const inicio = document.createElement("input");
  inicio.type = "time";
  inicio.className = "curso-inicio";
  inicio.lang = "en-US";
  inicio.required = true;
  inicio.value = datos.inicio ?? "";

  const fin = document.createElement("input");
  fin.type = "time";
  fin.className = "curso-fin";
  fin.lang = "en-US";
  fin.required = true;
  fin.value = datos.fin ?? "";

  const horas = document.createElement("div");
  horas.className = "horas";
  horas.append(crearCampo("Inicio", inicio), crearCampo("Fin", fin));

  const quitar = document.createElement("button");
  quitar.type = "button";
  quitar.className = "quitar";
  quitar.textContent = "Quitar curso";
  quitar.addEventListener("click", () => tarjeta.remove());

  tarjeta.append(crearCampo("Curso", nombre), crearSelectorDias(datos.dias), horas, quitar);
  return tarjeta;
}

function crearTarea(datos = {}) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "curso tarea";

  const titulo = document.createElement("input");
  titulo.type = "text";
  titulo.className = "tarea-titulo";
  titulo.placeholder = "Ej. Informe de laboratorio";
  titulo.required = true;
  titulo.value = datos.titulo ?? "";

  const tipo = document.createElement("select");
  tipo.className = "tarea-tipo";
  for (const opcion of ["Tarea individual", "Avance de grupo"]) {
    const elemento = document.createElement("option");
    elemento.value = opcion;
    elemento.textContent = opcion;
    tipo.appendChild(elemento);
  }
  tipo.value = datos.tipo ?? "Tarea individual";

  const fecha = document.createElement("input");
  fecha.type = "date";
  fecha.className = "tarea-fecha";
  soloCalendario(fecha);
  fecha.required = true;
  fecha.value = datos.fecha ?? "";

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

function leerDias(contenedor) {
  return [...contenedor.querySelectorAll(".dia:checked")].map((casilla) => casilla.value);
}

function validarBloque(bloque, descripcion) {
  if (!bloque.inicio || !bloque.fin) return `Indica el horario de ${descripcion}.`;
  if (bloque.dias.length === 0) return `Selecciona al menos un día para ${descripcion}.`;
  if (bloque.inicio >= bloque.fin) return `La hora de inicio debe ser anterior a la de fin en ${descripcion}.`;
  return null;
}

async function reemplazarHorario(alumnoId, cursos, trabajo, tareas) {
  const tablas = ["cursos", "trabajo", "tareas"];
  for (const tabla of tablas) {
    const { error } = await cliente.from(tabla).delete().eq("alumno_id", alumnoId);
    if (error) throw error;
  }

  if (cursos.length > 0) {
    const { error } = await cliente.from("cursos").insert(
      cursos.map((curso) => ({
        alumno_id: alumnoId,
        nombre: curso.nombre,
        dia: curso.dias[0],
        inicio: curso.inicio,
        fin: curso.fin,
      })),
    );
    if (error) throw error;
  }

  if (trabajo) {
    const { error } = await cliente.from("trabajo").insert({
      alumno_id: alumnoId,
      dias: trabajo.dias,
      inicio: trabajo.inicio,
      fin: trabajo.fin,
    });
    if (error) throw error;
  }

  if (tareas.length > 0) {
    const { error } = await cliente.from("tareas").insert(
      tareas.map((tarea) => ({ alumno_id: alumnoId, ...tarea })),
    );
    if (error) throw error;
  }
}

async function cargarHorario(alumnoId) {
  const [cursosRes, trabajoRes, tareasRes] = await Promise.all([
    cliente.from("cursos").select("nombre, dia, inicio, fin").eq("alumno_id", alumnoId).order("inicio"),
    cliente.from("trabajo").select("dias, inicio, fin").eq("alumno_id", alumnoId).maybeSingle(),
    cliente.from("tareas").select("titulo, tipo, fecha").eq("alumno_id", alumnoId).order("fecha"),
  ]);
  for (const res of [cursosRes, trabajoRes, tareasRes]) {
    if (res.error) throw res.error;
  }
  return { cursos: cursosRes.data, trabajo: trabajoRes.data, tareas: tareasRes.data };
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensajeError.hidden = true;

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

  try {
    const alumno = await obtenerAlumno();
    await reemplazarHorario(alumno.id, cursos, trabajo, tareas);
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error(error);
    mensajeError.textContent = "No se pudo guardar tu horario. Intenta de nuevo.";
    mensajeError.hidden = false;
  }
});

formulario.addEventListener("change", (evento) => {
  const casilla = evento.target;
  if (!casilla.classList.contains("dia") || !casilla.checked) return;
  const tarjeta = casilla.closest(".curso");
  if (!tarjeta) return;
  for (const otra of tarjeta.querySelectorAll(".dia")) {
    if (otra !== casilla) otra.checked = false;
  }
});

tieneTrabajo.addEventListener("change", () => {
  camposTrabajo.hidden = !tieneTrabajo.checked;
  if (!tieneTrabajo.checked) {
    for (const casilla of document.querySelectorAll("#dias-trabajo .dia")) casilla.checked = false;
  }
});

document.getElementById("agregar-curso").addEventListener("click", () => {
  listaCursos.appendChild(crearCurso());
});

document.getElementById("agregar-tarea").addEventListener("click", () => {
  listaTareas.appendChild(crearTarea());
});

async function iniciar() {
  const alumno = await obtenerAlumno();
  if (!alumno) {
    window.location.href = "registro.html";
    return;
  }
  saludo.textContent = `Hola, ${alumno.nombre}`;

  const { cursos, trabajo, tareas } = await cargarHorario(alumno.id);

  for (const curso of cursos) {
    listaCursos.appendChild(crearCurso({
      nombre: curso.nombre,
      dias: [curso.dia],
      inicio: curso.inicio.slice(0, 5),
      fin: curso.fin.slice(0, 5),
    }));
  }
  if (cursos.length === 0) listaCursos.appendChild(crearCurso());

  if (trabajo) {
    tieneTrabajo.checked = true;
    camposTrabajo.hidden = false;
    document.getElementById("trabajo-inicio").value = trabajo.inicio.slice(0, 5);
    document.getElementById("trabajo-fin").value = trabajo.fin.slice(0, 5);
  }
  document.getElementById("dias-trabajo").appendChild(crearSelectorDias(trabajo?.dias));

  for (const tarea of tareas) listaTareas.appendChild(crearTarea(tarea));
  if (tareas.length === 0) listaTareas.appendChild(crearTarea());
}

iniciar().catch((error) => {
  console.error(error);
  mensajeError.textContent = "No se pudieron cargar tus datos. Recarga la página.";
  mensajeError.hidden = false;
});
