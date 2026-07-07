function inicializarUI() {
  document.getElementById("btnIniciarDibujo").addEventListener("click", iniciarDibujo);
  document.getElementById("btnFinalizarDibujo").addEventListener("click", finalizarTramo);
  document.getElementById("btnDeshacerPunto").addEventListener("click", deshacerPunto);
  document.getElementById("btnPlay").addEventListener("click", reproducirProyecto);
  document.getElementById("btnGuardar").addEventListener("click", guardarProyecto);
}

function obtenerSujetosSeleccionados() {
  return [...document.querySelectorAll(".checks input:checked")]
    .map(input => input.value);
}

function mostrarPopupTramo(tramo) {
  document.getElementById("popupTitulo").textContent = tramo.titulo;
  document.getElementById("popupDescripcion").textContent = tramo.descripcion;
  document.getElementById("popupHora").textContent =
    `${tramo.horaInicio} ${tramo.referenciaHoraria} | ${tramo.sujetos.join(", ")}`;

  document.getElementById("popupEvento").classList.remove("oculto");
}

function ocultarPopup() {
  document.getElementById("popupEvento").classList.add("oculto");
}

function actualizarGuion() {
  const contenedor = document.getElementById("listaCronologia");
  contenedor.innerHTML = "";

  proyecto.tramos
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    .forEach(tramo => {
      const card = document.createElement("div");
      card.className = "cardEvento";
      card.innerHTML = `
        <strong>${tramo.horaInicio} ${tramo.referenciaHoraria}</strong><br>
        <span>${ICONOS_MOVILIDAD[tramo.movilidad] || "📍"} ${tramo.titulo}</span><br>
        <small>${tramo.sujetos.join(", ")}</small><br>
        <small>Duración visual: ${tramo.duracionVideo}s</small>
      `;

      card.addEventListener("click", () => {
        centrarEnPuntos(tramo.puntos, [60, 60]);
      });

      contenedor.appendChild(card);
    });
}

function guardarProyecto() {
  const datos = JSON.stringify(proyecto, null, 2);

  const blob = new Blob([datos], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "RutaMapa_proyecto.rgc";
  enlace.click();

  URL.revokeObjectURL(url);
}
