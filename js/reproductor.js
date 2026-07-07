async function reproducirProyecto() {
  limpiarTramosDelMapa();

  const tramos = [...proyecto.tramos]
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  if (tramos.length === 0) return;

  reproducirLineaTiempo(tramos);
}

function reproducirLineaTiempo(tramos) {
  const inicioGlobal = Math.min(...tramos.map(t => horaASegundos(t.horaInicio)));

  // Compresión temporal inicial:
  // 1 minuto real = 1 segundo visual.
  // Después lo haremos configurable.
  const factorCompresion = 1 / 60;

  const capasActivas = [];

  tramos.forEach(tramo => {
    tramo._inicioVisual = (horaASegundos(tramo.horaInicio) - inicioGlobal) * factorCompresion;
    tramo._duracionVisual = Number(tramo.duracionVideo) || 10;
    tramo._puntosAnimados = interpolarRuta(tramo.puntos, 35);
    tramo._iniciado = false;
    tramo._finalizado = false;
  });

  const duracionTotal = Math.max(
    ...tramos.map(t => t._inicioVisual + t._duracionVisual)
  );

  const inicioReproduccion = performance.now();

  function frame(now) {
    const tiempoVideo = (now - inicioReproduccion) / 1000;

    tramos.forEach(tramo => {
      if (tiempoVideo < tramo._inicioVisual || tramo._finalizado) return;

      if (!tramo._iniciado) {
        tramo._iniciado = true;

        tramo._lineaAnimada = L.polyline([], {
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

        tramo._marcadorAnimado = L.marker(tramo.puntos[0], { icono }).addTo(estado.map);
        tramo._marcadorAnimado.setIcon(icono);

        mostrarPopupTramo(tramo);
      }

      const progreso = Math.min(
        (tiempoVideo - tramo._inicioVisual) / tramo._duracionVisual,
        1
      );

      const indice = Math.floor(progreso * (tramo._puntosAnimados.length - 1));
      const puntosParciales = tramo._puntosAnimados.slice(0, indice + 1);
      const puntoActual = tramo._puntosAnimados[indice];

      tramo._lineaAnimada.setLatLngs(puntosParciales);
      tramo._marcadorAnimado.setLatLng(puntoActual);

      if (progreso >= 1) {
        tramo._finalizado = true;
      }
    });

    if (tiempoVideo < duracionTotal + 1) {
      requestAnimationFrame(frame);
    } else {
      ocultarPopup();
    }
  }

  const bounds = [];
  tramos.forEach(t => bounds.push(...t.puntos));
  centrarEnPuntos(bounds, [80, 80]);

  requestAnimationFrame(frame);
}

function interpolarRuta(puntos, pasosPorTramo = 35) {
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

function horaASegundos(hora) {
  const [h, m, s] = hora.split(":").map(Number);
  return h * 3600 + m * 60 + s;
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
