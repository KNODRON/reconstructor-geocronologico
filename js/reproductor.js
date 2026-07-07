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

        const icono = crearIconoMovil(tramo.movilidad, 0);

        tramo._marcadorAnimado = L.marker(tramo.puntos[0], {
          icon: icono
        }).addTo(estado.map);

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

      if (indice > 0) {
        const puntoAnterior = tramo._puntosAnimados[indice - 1];
        const angulo = calcularAngulo(puntoAnterior, puntoActual);
      tramo._marcadorAnimado.setIcon(crearIconoMovil(tramo.movilidad, angulo));
    }

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

function crearIconoMovil(movilidad, angulo) {
  const icono = ICONOS_MOVILIDAD[movilidad] || "📍";

  return L.divIcon({
    className: "iconoMovil",
    html: `
      <div style="
        transform: rotate(${angulo}deg);
        font-size: 36px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${icono}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

function calcularAngulo(p1, p2) {
  const dy = p2[0] - p1[0];
  const dx = p2[1] - p1[1];
  return Math.atan2(dy, dx) * 180 / Math.PI;
}
