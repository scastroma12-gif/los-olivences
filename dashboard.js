const INICIO_DIA = 7 * 60;
const FIN_DIA = 22 * 60;

const CLAVES_DIA = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

let dni = null;
let cursos = [];
let trabajo = null;
let entregables = [];

function horarioDeHoy() {
  if (cursos.length === 0 && !trabajo) return null;

  const clave = CLAVES_DIA[new Date().getDay()];
  const bloques = cursos
    .filter((curso) => curso.dia === clave)
    .map((curso) => ({ tipo: "clase", nombre: curso.nombre, inicio: curso.inicio, fin: curso.fin }));

  if (trabajo && trabajo.dias.includes(clave)) {
    bloques.push({ tipo: "trabajo", nombre: "Jornada laboral", inicio: trabajo.inicio, fin: trabajo.fin });
  }
  return bloques;
}

function aMinutos(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

function formatearHora(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  const periodo = horas < 12 ? "AM" : "PM";
  return `${horas % 12 || 12}:${String(minutos).padStart(2, "0")} ${periodo}`;
}

function porcentaje(minutos) {
  return ((minutos - INICIO_DIA) / (FIN_DIA - INICIO_DIA)) * 100;
}

function formatearDuracion(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

function renderCargaDelDia() {
  const linea = document.getElementById("linea-tiempo");
  linea.replaceChildren();

  const horario = horarioDeHoy();
  const resumen = document.getElementById("horas-libres");
  if (horario === null) {
    resumen.textContent = "Registra tu horario para ver tu carga del día.";
    return;
  }

  const bloques = horario
    .map((bloque) => ({ ...bloque, ini: aMinutos(bloque.inicio), fin: aMinutos(bloque.fin) }))
    .sort((a, b) => a.ini - b.ini);

  let ocupado = 0;
  let finActual = INICIO_DIA;
  for (const bloque of bloques) {
    const ini = Math.max(bloque.ini, INICIO_DIA);
    const fin = Math.min(bloque.fin, FIN_DIA);
    if (fin > Math.max(ini, finActual)) {
      ocupado += fin - Math.max(ini, finActual);
      finActual = fin;
    }

    if (fin <= ini) continue;
    const elemento = document.createElement("div");
    elemento.className = `bloque ${bloque.tipo}`;
    elemento.style.left = `${porcentaje(ini)}%`;
    elemento.style.width = `${porcentaje(fin) - porcentaje(ini)}%`;
    elemento.title = `${bloque.nombre} (${formatearHora(bloque.inicio)}–${formatearHora(bloque.fin)})`;
    linea.appendChild(elemento);
  }

  const libre = FIN_DIA - INICIO_DIA - ocupado;
  resumen.textContent = horario.length === 0
    ? "Hoy es tu día libre."
    : `Tienes ${formatearDuracion(libre)} libres hoy.`;
}

function diasHasta(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((new Date(anio, mes - 1, dia) - hoy) / 86400000);
}

function textoVencimiento(dias) {
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  return `Vence en ${dias} días`;
}

function renderEntregables() {
  const lista = document.getElementById("lista-entregables");
  lista.replaceChildren();

  const proximos = entregables
    .map((item) => ({ ...item, dias: diasHasta(item.fecha) }))
    .filter((item) => item.dias >= 0 && item.dias <= 7)
    .sort((a, b) => a.dias - b.dias);

  if (proximos.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "vacio";
    vacio.textContent = "No tienes entregables para los próximos 7 días.";
    lista.appendChild(vacio);
    return;
  }

  for (const item of proximos) {
    const li = document.createElement("li");
    li.className = "entregable";

    const info = document.createElement("div");
    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta";
    etiqueta.textContent = item.tipo;
    const titulo = document.createElement("p");
    titulo.className = "titulo";
    titulo.textContent = item.titulo;
    info.append(etiqueta, titulo);

    const vence = document.createElement("span");
    vence.className = item.dias <= 1 ? "vence urgente" : "vence";
    vence.textContent = textoVencimiento(item.dias);

    li.append(info, vence);
    lista.appendChild(li);
  }
}

soloCalendario(document.getElementById("fecha-limite"));

const dialogo = document.getElementById("dialogo-agregar");
const formulario = document.getElementById("formulario-agregar");

document.getElementById("boton-agregar").addEventListener("click", () => {
  formulario.reset();
  dialogo.showModal();
});

document.getElementById("cancelar").addEventListener("click", () => dialogo.close());

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const nueva = {
    tipo: document.getElementById("tipo").value,
    titulo: document.getElementById("titulo").value.trim(),
    fecha: document.getElementById("fecha-limite").value,
  };

  const { error } = await cliente.rpc("agregar_tarea", {
    p_dni: dni,
    p_titulo: nueva.titulo,
    p_tipo: nueva.tipo,
    p_fecha: nueva.fecha,
  });
  if (error) {
    console.error(error);
    alert("No se pudo guardar la tarea. Intenta de nuevo.");
    return;
  }

  entregables.push(nueva);
  renderEntregables();
  dialogo.close();
});

async function iniciar() {
  dni = dniActual();
  const alumno = dni ? await entrarConDni(dni) : null;
  if (!alumno) {
    window.location.href = "registro.html";
    return;
  }
  document.getElementById("saludo").textContent = `Hola, ${alumno.alumno_nombre}`;

  const { data, error } = await cliente.rpc("obtener_horario", { p_dni: dni });
  if (error) throw error;

  cursos = data.cursos;
  trabajo = data.trabajo;
  entregables = data.tareas;

  renderCargaDelDia();
  renderEntregables();
}

document.getElementById("fecha").textContent = new Date().toLocaleDateString("es", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

iniciar().catch((error) => {
  console.error(error);
  document.getElementById("horas-libres").textContent = "No se pudieron cargar tus datos. Recarga la página.";
});
