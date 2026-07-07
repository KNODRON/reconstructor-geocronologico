async function reproducirProyecto() {
  limpiarTramosDelMapa();

  const tramosOrdenados = [...proyecto.tramos]
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  for (const tramo of tramosOrdenados) {
    await reproducirTramo(tramo);
  }
}

function limpiarTramosDelMapa() {
  proyecto.tramos.forEach(tramo => {
    if (tramo.capas) {
      tramo.capas.forEach(capa => {
        estado.map.removeLayer(capa);
      });
    }
  });
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

    const puntosAnimados = interpolarRuta(tramo.puntos, 25);
    const intervaloMs = (tramo.duracionVideo * 1000) / puntosAnimados.length;

    let i = 0;

    const intervalo = setInterval(() => {
      if (i >= puntosAnimados.length) {
        clearInterval(intervalo);

        setTimeout(() => {
          ocultarPopup();
          resolve();
        }, 1200);

        return;
      }

      const punto = puntosAnimados[i];
      linea.addLatLng(punto);
      marcador.setLatLng(punto);
      i++;
    }, intervaloMs);
  });
}

function interpolarRuta(puntos, pasosPorTramo = 25) {
  const resultado = [];

  for (let i = 0; i < puntos.length - 1; i++) {
    const inicio = puntos[i];
    const fin = puntos[i + 1];

    for (let paso = 0; paso < pasosPorTramo; paso++) {
      const t = paso / pasosPorTramo;

      const lat = inicio[0] + (fin[0] - inicio[0]) * t;
      const lng = inicio[1] + (fin[1] - inicio[1]) * t;

      resultado.push([lat, lng]);
    }
  }

  resultado.push(puntos[puntos.length - 1]);
  return resultado;
}
