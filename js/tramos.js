function iniciarDibujo() {
  estado.dibujando = true;
  estado.modoHerramienta = null;
  estado.puntosTemp = [];
  limpiarTemporal();
  estado.map.getContainer().style.cursor = "crosshair";
}

function manejarClickMapa(e) {
  if (estado.modoHerramienta === "evento") {
    solicitarDatosEvento(e.latlng);
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
}

function dibujarEvento(evento) {
  const marcador = L.marker([evento.lat, evento.lng], {
    icon: L.divIcon({
      className: "iconoEvento",
      html: crearHtmlEvento(evento),
      iconSize: [90, 90],
      iconAnchor: [45, 45]
    })
  }).addTo(estado.map);

  marcador.bindTooltip(evento.titulo, { permanent: false });
  evento.capa = marcador;
}

function crearHtmlEvento(evento) {
  const categoria = (evento.categoria || "").toLowerCase();

  if (
    categoria.includes("ae") ||
    categoria.includes("artefacto") ||
    categoria.includes("instalacion") ||
    categoria.includes("instalación") ||
    categoria.includes("sitio") ||
    categoria.includes("quema")
  ) {
    return `
      <div class="evento-onda">
        <div class="evento-centro"></div>
      </div>
    `;
  }

  return `<div style="font-size:30px;">${iconoEvento(evento.categoria)}</div>`;
}
function iconoEvento(categoria = "") {
  const cat = categoria.toLowerCase();

  if (cat.includes("transbordo")) return "🔁";
  if (cat.includes("domicilio")) return "🏠";
  if (cat.includes("ingreso")) return "🏠";
  if (cat.includes("salida")) return "🚪";
  if (cat.includes("sitio")) return "📍";
  if (cat.includes("ae")) return "⚠️";
  if (cat.includes("artefacto")) return "⚠️";
  if (cat.includes("bus")) return "🚌";

  return "📍";
}

function redibujarTodo() {
  estado.map.eachLayer(layer => {
    if (
      layer instanceof L.Polyline ||
      layer instanceof L.CircleMarker ||
      layer instanceof L.Marker
    ) {
      estado.map.removeLayer(layer);
    }
  });

  proyecto.tramos.forEach(tramo => dibujarTramoFinal(tramo));
  proyecto.eventos.forEach(evento => dibujarEvento(evento));
}

function limpiarNodosEdicion() {
  estado.marcadoresEdicion.forEach(m => {
    if (estado.map.hasLayer(m)) estado.map.removeLayer(m);
  });

  estado.marcadoresEdicion = [];
}

function activarEdicionRuta(tramo) {
  limpiarNodosEdicion();

  tramo.puntos.forEach((punto, index) => {
    const nodo = L.marker(punto, {
      draggable: true,
      icon: L.divIcon({
        className: "nodoEdicion",
        html: `<div style="
  width:18px;
  height:18px;
  background:#00ff88;
  border:3px solid white;
  border-radius:50%;
  box-shadow:0 0 10px rgba(0,0,0,.8);
"></div>`,
      })
    }).addTo(estado.map);

    nodo.on("drag", e => {
      const latlng = e.target.getLatLng();
      tramo.puntos[index] = [latlng.lat, latlng.lng];

      redibujarTodo();
      activarEdicionRuta(tramo);
    });

    estado.marcadoresEdicion.push(nodo);
  });
}
