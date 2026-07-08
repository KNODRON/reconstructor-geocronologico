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

    <div class="accionesCard">
      <button onclick="seleccionarTramo('${item.id}')">Editar</button>
      <button onclick="eliminarTramoPorId('${item.id}')">Eliminar</button>
    </div>
  `;
}

      card.addEventListener("click", () => {
        seleccionarTramo(item.id);
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
  function seleccionarTramo(id) {
  const tramo = proyecto.tramos.find(t => t.id === id);
  if (!tramo) return;

  estado.tramoSeleccionadoId = id;

  document.getElementById("movilidad").value = tramo.movilidad;
  document.getElementById("colorTramo").value = tramo.color;
  document.getElementById("referenciaHoraria").value = tramo.referenciaHoraria;
  document.getElementById("horaInicio").value = tramo.horaInicio;
  document.getElementById("horaTermino").value = tramo.horaTermino;
  document.getElementById("duracionVideo").value = tramo.duracionVideo;
  document.getElementById("tituloTramo").value = tramo.titulo;
  document.getElementById("descripcionTramo").value = tramo.descripcion;

  document.querySelectorAll(".checks input").forEach(input => {
    input.checked = tramo.sujetos.includes(input.value);
  });

  centrarEnPuntos(tramo.puntos, [60, 60]);
}

function guardarCambiosTramo() {
  const tramo = proyecto.tramos.find(t => t.id === estado.tramoSeleccionadoId);

  if (!tramo) {
    alert("Selecciona un tramo desde la cronología.");
    return;
  }

  tramo.sujetos = obtenerSujetosSeleccionados();
  tramo.movilidad = document.getElementById("movilidad").value;
  tramo.color = document.getElementById("colorTramo").value;
  tramo.referenciaHoraria = document.getElementById("referenciaHoraria").value;
  tramo.horaInicio = document.getElementById("horaInicio").value;
  tramo.horaTermino = document.getElementById("horaTermino").value;
  tramo.duracionVideo = Number(document.getElementById("duracionVideo").value);
  tramo.titulo = document.getElementById("tituloTramo").value;
  tramo.descripcion = document.getElementById("descripcionTramo").value;

  redibujarTodo();
  actualizarGuion();

  alert("Tramo actualizado.");
}

function eliminarTramoSeleccionado() {
  const id = estado.tramoSeleccionadoId;

  if (!id) {
    alert("Selecciona un tramo desde la cronología.");
    return;
  }

  if (!confirm("¿Eliminar este tramo?")) return;

  proyecto.tramos = proyecto.tramos.filter(t => t.id !== id);
  estado.tramoSeleccionadoId = null;

  redibujarTodo();
  actualizarGuion();

  alert("Tramo eliminado.");
}
  URL.revokeObjectURL(url);
}

function eliminarTramoPorId(id) {
  if (!confirm("¿Eliminar este tramo?")) return;

  proyecto.tramos = proyecto.tramos.filter(t => t.id !== id);

  if (estado.tramoSeleccionadoId === id) {
    estado.tramoSeleccionadoId = null;
  }

  redibujarTodo();
  actualizarGuion();
}
