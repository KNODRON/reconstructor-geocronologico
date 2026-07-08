let ultimoMovimientoCamara = 0;

function actualizarCamara() {
  const ahora = performance.now();

  if (ahora - ultimoMovimientoCamara < 1200) return;
  ultimoMovimientoCamara = ahora;

  const puntosActivos = proyecto.tramos
    .filter(t => t._iniciado && !t._finalizado && t._marcadorAnimado)
    .map(t => t._marcadorAnimado.getLatLng());

  if (puntosActivos.length === 0) return;

  if (puntosActivos.length === 1) {
    estado.map.panTo(puntosActivos[0], {
      animate: true,
      duration: 0.8
    });
    return;
  }

  const bounds = L.latLngBounds(puntosActivos);

  estado.map.fitBounds(bounds, {
    padding: [180, 180],
    animate: true,
    duration: 1
  });
}
