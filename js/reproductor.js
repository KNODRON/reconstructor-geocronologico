async function reproducirProyecto() {
  const tramosOrdenados = [...proyecto.tramos]
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  for (const tramo of tramosOrdenados) {
    await reproducirTramo(tramo);
  }
}

function reproducirTramo(tramo) {
  return new Promise(resolve => {
    mostrarPopupTramo(tramo);
    centrarEnPuntos(tramo.puntos, [80, 80]);

    const linea = L.polyline([], {
      color: tramo.color,
      weight: 6,
      opacity: 1,
      dashArray: tramo.movilidad === "caminando" ? "10,10" : null
    }).addTo(estado.map);

    const icono = L.divIcon({
      className: "iconoMovil",
      html: ICONOS_MOVILIDAD[tramo.movilidad] || "📍",
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marcador = L.marker(tramo.puntos[0], { icon: icono }).addTo(estado.map);

    let i = 0;
    const intervaloMs = (tramo.duracionVideo * 1000) / tramo.puntos.length;

    const intervalo = setInterval(() => {
      if (i >= tramo.puntos.length) {
        clearInterval(intervalo);

        setTimeout(() => {
          ocultarPopup();
          resolve();
        }, 1200);

        return;
      }

      const punto = tramo.puntos[i];
      linea.addLatLng(punto);
      marcador.setLatLng(punto);
      i++;
    }, intervaloMs);
  });
}
