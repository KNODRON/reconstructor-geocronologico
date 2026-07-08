function iniciarDibujo() {
  estado.dibujando = true;
  estado.modoHerramienta = null;
  estado.puntosTemp = [];

  limpiarTemporal();

  estado.map.getContainer().style.cursor = "crosshair";
  console.log("Modo dibujo activado");
}

function manejarClickMapa(e) {
  console.log("Click mapa", estado.dibujando, estado.modoHerramienta);

  if (estado.modoHerramienta === "parada") {
    solicitarDatosParada(e.latlng);
    estado.modoHerramienta = null;
    estado.map.getContainer().style.cursor = "";
    return;
  }

  if (!estado.dibujando) return;

  const punto = [e.latlng.lat, e.latlng.lng];
  estado.puntosTemp.push(punto);

  const marcador = L.circleMarker(punto, {
    radius: 4,
    color: "#ffffff",
    fillColor: "#00ff88",
    fillOpacity: 1
  }).addTo(estado.map);

  estado.puntosVisuales.push(marcador);

  if (!estado.lineaTemp) {
    estado.lineaTemp = L.polyline(estado.puntosTemp, {
      color: "#00ff88",
      weight: 4
    }).addTo(estado.map);
  } else {
    estado.lineaTemp.setLatLngs(estado.puntosTemp);
  }
}

function deshacerPunto() {
  if (!estado.dibujando || estado.puntosTemp.length === 0) return;

  estado.puntosTemp.pop();

  const ultimo = estado.puntosVisuales.pop();
  if (ultimo) estado.map.removeLayer(ultimo);

  if (estado.lineaTemp) {
    estado.lineaTemp.setLatLngs(estado.puntosTemp);
  }
}

function finalizarTramo() {
  if (!estado.dibujando) return;

  if (estado.puntosTemp.length < 2) {
    alert("El tramo necesita al menos dos puntos.");
    return;
  }

  const tramo = crearTramoDesdeFormulario(estado.puntosTemp);
  proyecto.tramos.push(tramo);

  estado.dibujando = false;
  estado.map.getContainer().style.cursor = "";

  limpiarTemporal();
  dibujarTramoFinal(tramo);
  actualizarGuion();

  alert("Tramo agregado al guion.");
}

function crearTramoDesdeFormulario(puntos) {
  return {
    id: crypto.randomUUID(),
    tipo: "tramo",
    sujetos: obtenerSujetosSeleccionados(),
    movilidad: document.getElementById("movilidad").value,
    color: document.getElementById("colorTramo").value,
    referenciaHoraria: document.getElementById("referenciaHoraria").value,
    horaInicio: document.getElementById("horaInicio").value,
    horaTermino: document.getElementById("horaTermino").value,
    duracionVideo: Number(document.getElementById("duracionVideo").value),
    titulo: document.getElementById("tituloTramo").value,
    descripcion: document.getElementById("descripcionTramo").value,
    puntos: puntos.map(p => [...p])
  };
}

function dibujarTramoFinal(tramo) {
  tramo.capas = [];

  const linea = L.polyline(tramo.puntos, {
    color: tramo.color,
    weight: 5,
    opacity: 0.95,
    dashArray: tramo.movilidad === "caminando" ? "10,10" : null
  }).addTo(estado.map);

  tramo.capas.push(linea);

  const inicio = tramo.puntos[0];
  const fin = tramo.puntos[tramo.puntos.length - 1];

  const marcadorInicio = L.circleMarker(inicio, {
    radius: 6,
    color: tramo.color,
    fillColor: tramo.color,
    fillOpacity: 1
  }).addTo(estado.map);

  const marcadorFin = L.circleMarker(fin, {
    radius: 6,
    color: tramo.color,
    fillColor: tramo.color,
    fillOpacity: 1
  }).addTo(estado.map);

  tramo.capas.push(marcadorInicio, marcadorFin);
}

function dibujarParada(parada) {
  const marcador = L.marker([parada.lat, parada.lng], {
    icon: L.divIcon({
      className: "iconoParada",
      html: "📍",
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })
  }).addTo(estado.map);

  marcador.bindTooltip(parada.titulo, {
    permanent: false
  });

  parada.capa = marcador;
}

function redibujarTodo() {
  estado.map.eachLayer(layer => {
    if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
      estado.map.removeLayer(layer);
    }
  });

  proyecto.tramos.forEach(tramo => {
    tramo.capas = [];
    dibujarTramoFinal(tramo);
  });

  proyecto.eventos.forEach(evento => {
    if (evento.tipo === "parada") {
      dibujarParada(evento);
    }
  });
}
