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

