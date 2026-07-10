async function reproducirProyecto() {
  limpiarTramosDelMapa();

  const items = [
  ...proyecto.tramos.map(t => ({
    ...t,
    _tipoRender: "tramo",
    _orden: t.horaInicio
  })),

  ...proyecto.eventos.map(e => ({
    ...e,
    _tipoRender: "evento",
    _orden: e.hora
  })),

  ...(proyecto.letreros || []).map(l => ({
    ...l,
    _tipoRender: "letrero",
    _orden: l.hora
  }))
].sort((a, b) => a._orden.localeCompare(b._orden));
}

function reproducirLineaTiempo(items) {
  const inicioGlobal = Math.min(...items.map(i => horaASegundos(i._orden)));
  const factorCompresion = 1 / 60;
  const referenciaGlobal = items[0].referenciaHoraria || CONFIG.referenciaDefault;
  actualizarReloj(inicioGlobal, referenciaGlobal);

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
    if (item._tipoRender === "letrero") {
      item._duracionVisual = Number(item.duracionVideo) || 5;
    }
    
  });

  const duracionTotal = Math.max(
    ...items.map(i => i._inicioVisual + i._duracionVisual)
  );

  const bounds = [];
  items.forEach(i => {
    if (i._tipoRender === "tramo") bounds.push(...i.puntos);
    if (i._tipoRender === "evento") bounds.push([i.lat, i.lng]);
  });

  centrarEnPuntos(bounds, [80, 80]);

  const inicioReproduccion = performance.now();

  function frame(now) {
    const tiempoVideo = (now - inicioReproduccion) / 1000;
    const tiempoInvestigativo = inicioGlobal + (tiempoVideo / factorCompresion);
    actualizarReloj(tiempoInvestigativo, referenciaGlobal);

    items.forEach(item => {
      if (tiempoVideo < item._inicioVisual || item._finalizado) return;

      if (item._tipoRender === "tramo") {
        reproducirFrameTramo(item, tiempoVideo);
      }

      if (item._tipoRender === "evento") {
        reproducirFrameEvento(item, tiempoVideo);
      }

      if (item._tipoRender === "letrero") {
        reproducirFrameLetrero(item, tiempoVideo);
      }
    });

    if (tiempoVideo < duracionTotal + 1) {
      requestAnimationFrame(frame);
    } else {
      ocultarPopup();
      redibujarTodo();
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

    tramo._marcadorAnimado = L.marker(tramo.puntos[0], {
      icon: crearIconoMovil(tramo.movilidad, 0, tramo.sujetos.join(", "))
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
    tramo._marcadorAnimado.setIcon(
  crearIconoMovil(tramo.movilidad, angulo, tramo.sujetos.join(", "))
);
  }

  if (progreso >= 1) {
    tramo._finalizado = true;
  }
}

function reproducirFrameEvento(evento, tiempoVideo) {
  if (!evento._iniciado) {
    evento._iniciado = true;

    estado.map.flyTo([evento.lat, evento.lng], 16, {
      duration: 1.2
    });

    mostrarPopupEvento(evento);
  }

  const progreso = Math.min(
    (tiempoVideo - evento._inicioVisual) / evento._duracionVisual,
    1
  );

  if (progreso >= 1) {
    evento._finalizado = true;
    ocultarPopup();
  }
}

function interpolarRuta(puntos, pasosPorTramo = 35) {
  const resultado = [];

  for (let i = 0; i < puntos.length - 1; i++) {
    const inicio = puntos[i];
    const fin = puntos[i + 1];

    for (let paso = 0; paso < pasosPorTramo; paso++) {
      const t = paso / pasosPorTramo;
      resultado.push([
        inicio[0] + (fin[0] - inicio[0]) * t,
        inicio[1] + (fin[1] - inicio[1]) * t
      ]);
    }
  }

  resultado.push(puntos[puntos.length - 1]);
  return resultado;
}

function crearIconoMovil(movilidad, angulo, texto = "") {
  const icono = ICONOS_MOVILIDAD[movilidad] || "📍";

  return L.divIcon({
    className: "iconoMovil",
    html: `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        transform: rotate(${angulo}deg);
      ">
        <div style="
          font-size:36px;
          width:40px;
          height:40px;
          display:flex;
          align-items:center;
          justify-content:center;
        ">
          ${icono}
        </div>
      </div>

      <div style="
        position:absolute;
        top:34px;
        left:50%;
        transform:translateX(-50%);
        background:rgba(0,0,0,.72);
        color:white;
        padding:3px 8px;
        border-radius:8px;
        font-size:11px;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,.45);
        border:1px solid rgba(255,255,255,.25);
      ">
        ${texto}
      </div>
    `,
    iconSize: [80, 60],
    iconAnchor: [40, 30]
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

                if (estado.map.hasLayer(capa)) {
                    estado.map.removeLayer(capa);
                }

            });

        }

    });

    proyecto.eventos.forEach(evento => {

        if (evento.capa && estado.map.hasLayer(evento.capa)) {
            estado.map.removeLayer(evento.capa);
        }

    });

}

function reproducirFrameLetrero(letrero, tiempoVideo) {
  if (!letrero._iniciado) {
    letrero._iniciado = true;
    mostrarLetrero(letrero);
  }

  const progreso = Math.min(
    (tiempoVideo - letrero._inicioVisual) /
      letrero._duracionVisual,
    1
  );

  if (progreso >= 1) {
    letrero._finalizado = true;
    ocultarLetrero();
  }
}

function mostrarLetrero(letrero) {
  const popup = document.getElementById("popupEvento");

  document.getElementById("popupTitulo").textContent =
    letrero.titulo;

  document.getElementById("popupDescripcion").textContent =
    letrero.descripcion;

  document.getElementById("popupHora").textContent =
    `${letrero.hora} ${letrero.referenciaHoraria}` +
    (
      letrero.sujetos.length
        ? ` | ${letrero.sujetos.join(", ")}`
        : ""
    );

  popup.classList.add("popup-letrero");
  popup.classList.remove("oculto");

  requestAnimationFrame(() => {
    popup.classList.add("popup-visible");
  });
}

function ocultarLetrero() {
  const popup = document.getElementById("popupEvento");

  popup.classList.remove("popup-visible");

  setTimeout(() => {
    popup.classList.add("oculto");
    popup.classList.remove("popup-letrero");
  }, 450);
}
