async function reproducirProyecto() {
  limpiarTramosDelMapa();

  const items = [
    ...proyecto.tramos.map(t => ({ ...t, _tipoRender: "tramo", _orden: t.horaInicio })),
    ...proyecto.eventos.map(e => ({ ...e, _tipoRender: "evento", _orden: e.hora }))
  ].sort((a, b) => a._orden.localeCompare(b._orden));

  if (items.length === 0) return;

  reproducirLineaTiempo(items);
}

function reproducirLineaTiempo(items) {
  const inicioGlobal = Math.min(...items.map(i => horaASegundos(i._orden)));
  const factorCompresion = 1 / 60;

  items.forEach(item => {
    item._inicioVisual = (horaASegundos(item._orden) - inicioGlobal) * factorCompresion;
    item._iniciado = false;
    item._finalizado = false;

    if (item._tipoRender === "tramo") {
      item._duracionVisual = Number(item.duracionVideo) || 10;
      item._puntosAnimados = interpolarRuta(item.puntos, 35);
    }

    if (item._tipoRender === "evento") {
      item._duracionVisual = Number(item.duracionVideo) || 5;
    }
  });

  const duracionTotal = Math.max(
    ...items.map(i => i._inicioVisual + i._duracionVisual)
  );

  const bounds = [];
  items.forEach(i => {
    if (i._tipoRender === "tramo") bounds.push(...i.puntos);
    if (i._tipoRender === "parada") bounds.push([i.lat, i.lng]);
  });

  centrarEnPuntos(bounds, [80, 80]);

  const inicioReproduccion = performance.now();

  function frame(now) {
    const tiempoVideo = (now - inicioReproduccion) / 1000;

    items.forEach(item => {
      if (tiempoVideo < item._inicioVisual || item._finalizado) return;

      if (item._tipoRender === "tramo") {
        reproducirFrameTramo(item, tiempoVideo);
      }

      if (item._tipoRender === "parada") {
        reproducirFrameParada(item, tiempoVideo);
      }
    });

    if (tiempoVideo < duracionTotal + 1) {
      requestAnimationFrame(frame);
    } else {
      ocultarPopup();
    }
  }

  requestAnimationFrame(frame);
}

function reproducirFrameTramo(tramo, tiempoVideo) {
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
  actualizarCamara();
  
  if (indice > 0) {
    const puntoAnterior = tramo._puntosAnimados[indice - 1];
    const angulo = calcularAngulo(puntoAnterior, puntoActual);
    tramo._marcadorAnimado.setIcon(crearIconoMovil(tramo.movilidad, angulo));
  }

  if (progreso >= 1) {
    tramo._finalizado = true;
  }
}

function reproducirFrameParada(parada, tiempoVideo) {
  if (!parada._iniciado) {
    parada._iniciado = true;

    estado.map.flyTo([parada.lat, parada.lng], 16, {
      duration: 1.2
    });

    mostrarPopupParada(parada);
  }

  const progreso = Math.min(
    (tiempoVideo - parada._inicioVisual) / parada._duracionVisual,
    1
  );

  if (progreso >= 1) {
    parada._finalizado = true;
    ocultarPopup();
  }
}

function mostrarPopupParada(parada) {
  document.getElementById("popupTitulo").textContent = parada.titulo;
  document.getElementById("popupDescripcion").textContent = parada.descripcion;
  document.getElementById("popupHora").textContent =
    `${parada.hora} ${parada.referenciaHoraria} | ${parada.sujetos.join(", ")}`;

  document.getElementById("popupEvento").classList.remove("oculto");
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
        display:flex;
        align-items:center;
        justify-content:center;
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

function horaASegundos(hora) {
  const [h, m, s] = hora.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function limpiarTramosDelMapa() {
  proyecto.tramos.forEach(tramo => {
    if (tramo.capas) {
      tramo.capas.forEach(capa => {
        if (estado.map.hasLayer(capa)) estado.map.removeLayer(capa);
      });
    }
  });
}

let ultimoSeguimiento = 0;

function seguirMovimiento(punto) {
  const ahora = performance.now();

  // Evita mover el mapa demasiadas veces por segundo
  if (ahora - ultimoSeguimiento < 700) return;

  ultimoSeguimiento = ahora;

  estado.map.panTo(punto, {
    animate: true,
    duration: 0.6
  });
}
