function inicializarUI() {
  document.getElementById("btnIniciarDibujo").addEventListener("click", iniciarDibujo);
  document.getElementById("btnFinalizarDibujo").addEventListener("click", finalizarTramo);
  document.getElementById("btnDeshacerPunto").addEventListener("click", deshacerPunto);
  document.getElementById("btnPlay").addEventListener("click", reproducirProyecto);
  document.getElementById("btnGuardar").addEventListener("click", guardarProyecto);
  document.getElementById("toolParada").addEventListener("click", activarModoParada);
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

  const items = [
    ...proyecto.tramos.map(t => ({ ...t, _orden: t.horaInicio })),
    ...proyecto.eventos.map(e => ({ ...e, _orden: e.hora }))
  ].sort((a, b) => a._orden.localeCompare(b._orden));

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "cardEvento";

    if (item.tipo === "tramo") {
      card.innerHTML = `
        <strong>${item.horaInicio} ${item.referenciaHoraria}</strong><br>
        <span>${ICONOS_MOVILIDAD[item.movilidad] || "📍"} ${item.titulo}</span><br>
        <small>${item.sujetos.join(", ")}</small><br>
        <small>Duración visual: ${item.duracionVideo}s</small>
      `;

      card.addEventListener("click", () => {
        centrarEnPuntos(item.puntos, [60, 60]);
      });
    }

    if (item.tipo === "parada") {
      card.innerHTML = `
        <strong>${item.hora} ${item.referenciaHoraria}</strong><br>
        <span>📍 ${item.titulo}</span><br>
        <small>${item.sujetos.join(", ")}</small><br>
        <small>Duración visual: ${item.duracionVideo}s</small>
      `;

      card.addEventListener("click", () => {
        estado.map.flyTo([item.lat, item.lng], 17, {
          duration: 1.2
        });
      });
    }

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

  function activarModoParada() {
  estado.modoHerramienta = "parada";
  estado.dibujando = false;
  estado.map.getContainer().style.cursor = "pointer";
  alert("Modo parada activado. Haz clic en el mapa donde ocurre el evento.");
}

function solicitarDatosParada(latlng) {
  const titulo = prompt("Título de la parada/evento:", "Transbordo");
  if (!titulo) return;

  const descripcion = prompt(
    "Descripción:",
    "Sujeto desciende del medio de transporte y continúa su desplazamiento."
  ) || "";

  const hora = prompt("Hora:", document.getElementById("horaInicio").value) || "00:00:00";

  const duracionVideo = Number(prompt("Duración visual en segundos:", "5")) || 5;

  const parada = {
    id: crypto.randomUUID(),
    tipo: "parada",
    sujetos: obtenerSujetosSeleccionados(),
    referenciaHoraria: document.getElementById("referenciaHoraria").value,
    hora,
    titulo,
    descripcion,
    duracionVideo,
    lat: latlng.lat,
    lng: latlng.lng
  };

  proyecto.eventos.push(parada);
  dibujarParada(parada);
  actualizarGuion();
}
  URL.revokeObjectURL(url);
}
