const ETIQUETAS_DIA = {
  lun: "Lunes",
  mar: "Martes",
  mie: "Miércoles",
  jue: "Jueves",
  vie: "Viernes",
  sab: "Sábado",
  dom: "Domingo",
};

function formatearHora(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  const periodo = horas < 12 ? "AM" : "PM";
  return `${horas % 12 || 12}:${String(minutos).padStart(2, "0")} ${periodo}`;
}

function formatearFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

function llenarTabla(cuerpo, filas) {
  cuerpo.replaceChildren();
  if (filas.length === 0) {
    const columnas = cuerpo.closest("table").querySelectorAll("th").length;
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = columnas;
    td.textContent = "Sin registros";
    tr.appendChild(td);
    cuerpo.appendChild(tr);
    return;
  }
  for (const fila of filas) {
    const tr = document.createElement("tr");
    for (const texto of fila) {
      const td = document.createElement("td");
      td.textContent = texto;
      tr.appendChild(td);
    }
    cuerpo.appendChild(tr);
  }
}

async function mostrarDatos() {
  const alumno = await obtenerAlumno();
  if (!alumno) {
    document.getElementById("sin-sesion").hidden = false;
    return;
  }

  const [cursosRes, trabajoRes, tareasRes] = await Promise.all([
    cliente.from("cursos").select("nombre, dia, inicio, fin").eq("alumno_id", alumno.id).order("inicio"),
    cliente.from("trabajo").select("dias, inicio, fin").eq("alumno_id", alumno.id).maybeSingle(),
    cliente.from("tareas").select("titulo, tipo, fecha").eq("alumno_id", alumno.id).order("fecha"),
  ]);
  for (const res of [cursosRes, trabajoRes, tareasRes]) {
    if (res.error) throw res.error;
  }

  llenarTabla(
    document.getElementById("tabla-cursos"),
    cursosRes.data.map((curso) => [
      curso.nombre,
      ETIQUETAS_DIA[curso.dia],
      formatearHora(curso.inicio),
      formatearHora(curso.fin),
    ]),
  );

  const trabajo = trabajoRes.data;
  llenarTabla(
    document.getElementById("tabla-trabajo"),
    trabajo
      ? [[
          trabajo.dias.map((dia) => ETIQUETAS_DIA[dia]).join(", "),
          formatearHora(trabajo.inicio),
          formatearHora(trabajo.fin),
        ]]
      : [],
  );

  llenarTabla(
    document.getElementById("tabla-tareas"),
    tareasRes.data.map((tarea) => [tarea.titulo, tarea.tipo, formatearFecha(tarea.fecha)]),
  );

  document.getElementById("contenido-datos").hidden = false;
}

mostrarDatos().catch((error) => console.error(error));
