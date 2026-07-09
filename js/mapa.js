function inicializarMapa() {
  estado.map = L.map("map", {
    zoomControl: true
  }).setView(CONFIG.centroInicial, CONFIG.zoomInicial);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(estado.map);

  estado.map.on("click", manejarClickMapa);
}

function limpiarTemporal() {
  if (estado.lineaTemp) {
    estado.map.removeLayer(estado.lineaTemp);
    estado.lineaTemp = null;
  }

  estado.puntosVisuales.forEach(p => estado.map.removeLayer(p));
  estado.puntosVisuales = [];
}

function centrarEnPuntos(puntos, padding = [80, 80]) {
  if (!puntos || puntos.length === 0) return;

  estado.map.fitBounds(L.latLngBounds(puntos), {
    padding,
    animate: true,
    duration: 1.5
  });
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
    const nodo = L.circleMarker(punto, {
      radius: 7,
      color: "#ffffff",
      fillColor: "#00ff88",
      fillOpacity: 1,
      weight: 2,
      draggable: true
    }).addTo(estado.map);

    nodo.on("mousedown", () => {
      estado.map.dragging.disable();
    });

    nodo.on("mouseup", () => {
      estado.map.dragging.enable();
    });

    nodo.on("mousemove", e => {
      if (!e.originalEvent.buttons) return;

      const nuevoPunto = [e.latlng.lat, e.latlng.lng];
      tramo.puntos[index] = nuevoPunto;

      redibujarTodo();
      activarEdicionRuta(tramo);
    });

    estado.marcadoresEdicion.push(nodo);
  });
}
