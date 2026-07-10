function inicializarUI() {
  document.getElementById("btnIniciarDibujo").addEventListener("click", iniciarDibujo);
  document.getElementById("btnFinalizarDibujo").addEventListener("click", finalizarTramo);
  document.getElementById("btnDeshacerPunto").addEventListener("click", deshacerPunto);
  document.getElementById("btnPlay").addEventListener("click", reproducirProyecto);
  document.getElementById("btnGuardar").addEventListener("click", guardarProyecto);

  document.getElementById("toolEvento").addEventListener("click", activarModoEvento);

  document.getElementById("btnNuevo").addEventListener("click", nuevoProyecto);
  document.getElementById("btnAbrir").addEventListener("click", () => {
    document.getElementById("inputAbrirProyecto").click();
  });
  document.getElementById("inputAbrirProyecto").addEventListener("change", abrirProyecto);
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

function mostrarPopupEvento(evento) {
  document.getElementById("popupTitulo").textContent = evento.titulo;
  document.getElementById("popupDescripcion").textContent = evento.descripcion;
  document.getElementById("popupHora").textContent =
    `${evento.hora} ${evento.referenciaHoraria} | ${evento.sujetos.join(", ")}`;

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
          <button onclick="seleccionarTramo('${item.id}'); guardarCambiosTramo()">Guardar</button>
          <button onclick="eliminarTramoPorId('${item.id}')">Eliminar</button>
        </div>
      `;
    }

    if (item.tipo === "evento") {
      card.innerHTML = `
        <strong>${item.hora} ${item.referenciaHoraria}</strong><br>
        <span>${iconoEvento(item.categoria)} ${item.titulo}</span><br>
        <small>${item.sujetos.join(", ")}</small><br>
        <small>Duración visual: ${item.duracionVideo}s</small>
      `;

      card.addEventListener("click", () => {
        estado.map.flyTo([item.lat, item.lng], 17, { duration: 1.2 });
      });
    }

    contenedor.appendChild(card);
  });
}

function guardarProyecto() {
  const datos = JSON.stringify(proyecto, null, 2);
  const blob = new Blob([datos], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "RutaMapa_proyecto.rgc";
  enlace.click();

  URL.revokeObjectURL(url);
}

function activarModoEvento() {
  estado.modoHerramienta = "evento";
  estado.dibujando = false;
  estado.map.getContainer().style.cursor = "pointer";
  alert("Modo evento activado. Haz clic en el mapa donde ocurre el evento.");
}

function solicitarDatosEvento(latlng) {
  const categoria = prompt("Tipo de evento:", "Transbordo") || "Evento";
  const titulo = prompt("Título del evento:", categoria);
  if (!titulo) return;

  const descripcion = prompt(
    "Descripción:",
    "Evento relevante dentro de la cronología investigativa."
  ) || "";

  const hora = prompt("Hora:", document.getElementById("horaInicio").value) || "00:00:00";
  const duracionVideo = Number(prompt("Duración visual en segundos:", "5")) || 5;

  const evento = {
    id: crypto.randomUUID(),
    tipo: "evento",
    categoria,
    sujetos: obtenerSujetosSeleccionados(),
    referenciaHoraria: document.getElementById("referenciaHoraria").value,
    hora,
    titulo,
    descripcion,
    duracionVideo,
    lat: latlng.lat,
    lng: latlng.lng
  };

  proyecto.eventos.push(evento);
  dibujarEvento(evento);
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
  if (!tramo) return alert("Primero presiona Editar en el tramo.");

  tramo.sujetos = obtenerSujetosSeleccionados();
  tramo.movilidad = document.getElementById("movilidad").value;
  tramo.color = document.getElementById("colorTramo").value;
  tramo.referenciaHoraria = document.getElementById("referenciaHoraria").value;
  tramo.horaInicio = document.getElementById("horaInicio").value;
  tramo.horaTermino = document.getElementById("horaTermino").value;
  tramo.duracionVideo = Number(document.getElementById("duracionVideo").value);
  tramo.titulo = document.getElementById("tituloTramo").value;
  tramo.descripcion = document.getElementById("descripcionTramo").value;

  desactivarEditorRuta();
  redibujarTodo();
  actualizarGuion();

  alert("Guardadito");
}

function eliminarTramoPorId(id) {
  if (!confirm("¿Eliminar este tramo?")) return;

  proyecto.tramos = proyecto.tramos.filter(t => t.id !== id);
  estado.tramoSeleccionadoId = null;

  redibujarTodo();
  actualizarGuion();
}

function nuevoProyecto() {
  if (!confirm("¿Crear nuevo proyecto? Se borrará lo que no hayas guardado.")) return;

  proyecto.nombre = "Nuevo proyecto";
  proyecto.referenciaHoraria = CONFIG.referenciaDefault;
  proyecto.sujetos = [];
  proyecto.tramos = [];
  proyecto.eventos = [];
  estado.tramoSeleccionadoId = null;

  redibujarTodo();
  actualizarGuion();
}

function abrirProyecto(event) {
  const archivo = event.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();

  lector.onload = function(e) {
    try {
      const datos = JSON.parse(e.target.result);

      proyecto.nombre = datos.nombre || "Proyecto cargado";
      proyecto.referenciaHoraria = datos.referenciaHoraria || CONFIG.referenciaDefault;
      proyecto.sujetos = datos.sujetos || [];
      proyecto.tramos = datos.tramos || [];
      proyecto.eventos = datos.eventos || [];

      estado.tramoSeleccionadoId = null;

      redibujarTodo();
      actualizarGuion();

      alert("Proyecto cargado correctamente.");
    } catch (error) {
      alert("No se pudo abrir el archivo del proyecto.");
      console.error(error);
    }
  };

  lector.readAsText(archivo);
  event.target.value = "";
}

function actualizarReloj(segundos, referencia = "Hora Oficial") {
  document.getElementById("relojEtiqueta").textContent = referencia;
  document.getElementById("relojHora").textContent = segundosAHora(segundos);
}

function segundosAHora(total) {
  total = Math.floor(total);

  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
}
