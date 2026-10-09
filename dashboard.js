const INICIO_DIA = 7 * 60;
const FIN_DIA = 22 * 60;
const CLAVE_ENTREGABLES = "entregables";

const horarioHoy = [
  { tipo: "clase", nombre: "Clase de Estadística", inicio: "08:00", fin: "10:00" },
  { tipo: "clase", nombre: "Clase de Redacción", inicio: "10:30", fin: "12:30" },
  { tipo: "trabajo", nombre: "Jornada laboral", inicio: "14:00", fin: "18:00" },
  { tipo: "clase", nombre: "Clase de Psicología", inicio: "19:00", fin: "21:00" },
];

let entregables = cargarEntregables();

function aMinutos(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
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

  const bloques = horarioHoy
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
    elemento.title = `${bloque.nombre} (${bloque.inicio}–${bloque.fin})`;
    linea.appendChild(elemento);
  }

  const libre = FIN_DIA - INICIO_DIA - ocupado;
  document.getElementById("horas-libres").textContent = `Tienes ${formatearDuracion(libre)} libres hoy.`;
}

function formatoISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function fechaRelativa(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return formatoISO(fecha);
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

function cargarEntregables() {
  const guardados = localStorage.getItem(CLAVE_ENTREGABLES);
  if (guardados) return JSON.parse(guardados);

  const semilla = [
    { tipo: "Avance de grupo", titulo: "Avance de maqueta del proyecto", fecha: fechaRelativa(2) },
    { tipo: "Tarea individual", titulo: "Ensayo de Redacción", fecha: fechaRelativa(1) },
    { tipo: "Tarea individual", titulo: "Práctica de Estadística", fecha: fechaRelativa(5) },
  ];
  localStorage.setItem(CLAVE_ENTREGABLES, JSON.stringify(semilla));
  return semilla;
}

function guardarEntregables() {
  localStorage.setItem(CLAVE_ENTREGABLES, JSON.stringify(entregables));
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

const dialogo = document.getElementById("dialogo-agregar");
const formulario = document.getElementById("formulario-agregar");

document.getElementById("boton-agregar").addEventListener("click", () => {
  formulario.reset();
  dialogo.showModal();
});

document.getElementById("cancelar").addEventListener("click", () => dialogo.close());

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  entregables.push({
    tipo: document.getElementById("tipo").value,
    titulo: document.getElementById("titulo").value.trim(),
    fecha: document.getElementById("fecha-limite").value,
  });
  guardarEntregables();
  renderEntregables();
  dialogo.close();
});

const nombre = localStorage.getItem("nombreAlumno");
document.getElementById("saludo").textContent = nombre ? `Hola, ${nombre}` : "Hola, estudiante";
document.getElementById("fecha").textContent = new Date().toLocaleDateString("es", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

renderCargaDelDia();
renderEntregables();
