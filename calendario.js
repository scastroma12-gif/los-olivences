function soloCalendario(campo) {
  campo.addEventListener("keydown", (evento) => {
    if (evento.key !== "Tab") evento.preventDefault();
  });
  for (const evento of ["paste", "drop"]) {
    campo.addEventListener(evento, (e) => e.preventDefault());
  }
  campo.addEventListener("click", () => campo.showPicker?.());
}
