let ultimoMovimientoCamara = 0;

function actualizarCamara() {
  const ahora = performance.now();

  // Movimiento suave, no en cada frame
  if (ahora - ultimoMovimientoCamara < 900) return;
  ultimoMovimientoCamara = ahora;

  const puntosActivos = proyecto.tramos
    .filter(t => t._iniciado && !t._finalizado && t._marcadorAnimado)
    .map(t => t._marcadorAnimado.getLatLng());

  if (puntosActivos.length === 0) return;

  // Un solo sujeto: mantenerlo centrado, pero un poco más abajo
  if (puntosActivos.length === 1) {
    const punto = puntosActivos[0];

    estado.map.panTo(punto, {
      animate: true,
      duration: 0.8
    });

    // Baja visualmente el mapa para que el sujeto quede más al centro/bajo
    setTimeout(() => {
      estado.map.panBy([0, -90], {
        animate: true,
        duration: 0.5
      });
    }, 150);

    return;
  }

  // Varios sujetos: abrir encuadre para mostrar todos
  const bounds = L.latLngBounds(puntosActivos);

  estado.map.fitBounds(bounds, {
    paddingTopLeft: [120, 180],
    paddingBottomRight: [120, 260],
    animate: true,
    duration: 1
  });
}
