// ===============================
// RUTA MAPA - RGC v2 base
// ===============================

const proyecto = {
  nombre: "Nuevo proyecto",
  zonaHoraria: "Chile continental",
  tramos: []
};

const map = L.map("map", {
  zoomControl: true
}).setView([-33.4489, -70.6693], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

let dibujando = false;
let puntosTemp = [];
let lineaTemp = null;
let puntosVisuales = [];

const btnIniciar = document.getElementById("btnIniciarDibujo");
const btnFinalizar = document.getElementById("btnFinalizarDibujo");
const btnDeshacer = document.getElementById("btnDeshacerPunto");
const btnPlay = document.getElementById("btnPlay");
const btnGuardar = document.getElementById("btnGuardar");

btnIniciar.addEventListener("click", iniciarDibujo);
btnFinalizar.addEventListener("click", finalizarTramo);
btnDeshacer.addEventListener("click", deshacerPunto);
btnPlay.addEventListener("click", reproducirProyecto);
btnGuardar.addEventListener("click", guardarProyecto);

function iniciarDibujo() {
  dibujando = true;
  puntosTemp = [];
  limpiarTemporal();

  map.getContainer().style.cursor = "crosshair";
  alert("Dibujo activado. Haz clic sobre el mapa para marcar el recorrido del tramo.");
}

map.on("click", (e) => {
  if (!dibujando) return;

  const punto = [e.latlng.lat, e.latlng.lng];
  puntosTemp.push(punto);

  // Punto visual pequeño solo mientras se dibuja
  const marcador = L.circleMarker(punto, {
    radius: 4,
    color: "#ffffff",
    fillColor: "#00ff88",
    fillOpacity: 1
  }).addTo(map);

  puntosVisuales.push(marcador);

  if (!lineaTemp) {
    lineaTemp = L.polyline(puntosTemp, {
      color: "#00ff88",
      weight: 4
    }).addTo(map);
  } else {
    lineaTemp.setLatLngs(puntosTemp);
  }
});

function deshacerPunto() {
  if (!dibujando || puntosTemp.length === 0) return;

  puntosTemp.pop();

  const ultimo = puntosVisuales.pop();
  if (ultimo) map.removeLayer(ultimo);

  if (lineaTemp) lineaTemp.setLatLngs(puntosTemp);
}

function finalizarTramo() {
  if (!dibujando) return;

  if (puntosTemp.length < 2) {
    alert("El tramo necesita al menos dos puntos.");
    return;
  }

  const tramo = crearTramoDesdeFormulario(puntosTemp);
  proyecto.tramos.push(tramo);

  dibujando = false;
  map.getContainer().style.cursor = "";

  limpiarTemporal();
  dibujarTramoFinal(tramo);
  actualizarCronologia();

  alert("Tramo agregado a la cronología.");
}

function crearTramoDesdeFormulario(puntos) {
  const participantes = [...document.querySelectorAll(".checks input:checked")]
    .map(input => input.value);

  return {
    id: crypto.randomUUID(),
    tipo: "tramo",
    participantes,
    movilidad: document.getElementById("movilidad").value,
    color: document.getElementById("colorTramo").value,
    horaInicio: document.getElementById("horaInicio").value,
    horaTermino: document.getElementById("horaTermino").value,
    titulo: document.getElementById("tituloTramo").value,
    descripcion: document.getElementById("descripcionTramo").value,
    puntos: puntos.map(p => [...p])
  };
}

function dibujarTramoFinal(tramo) {
  L.polyline(tramo.puntos, {
    color: tramo.color,
    weight: 5,
    opacity: 0.95,
    dashArray: tramo.movilidad === "caminando" ? "10,10" : null
  }).addTo(map);

  const inicio = tramo.puntos[0];
  const fin = tramo.puntos[tramo.puntos.length - 1];

  L.circleMarker(inicio, {
    radius: 6,
    color: tramo.color,
    fillColor: tramo.color,
    fillOpacity: 1
  }).addTo(map).bindTooltip("Inicio", { permanent: false });

  L.circleMarker(fin, {
    radius: 6,
    color: tramo.color,
    fillColor: tramo.color,
    fillOpacity: 1
  }).addTo(map).bindTooltip("Fin", { permanent: false });
}

function limpiarTemporal() {
  if (lineaTemp) {
    map.removeLayer(lineaTemp);
    lineaTemp = null;
  }

  puntosVisuales.forEach(p => map.removeLayer(p));
  puntosVisuales = [];
}

function actualizarCronologia() {
  const contenedor = document.getElementById("listaCronologia");
  contenedor.innerHTML = "";

  proyecto.tramos
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    .forEach(tramo => {
      const card = document.createElement("div");
      card.className = "cardEvento";
      card.innerHTML = `
        <strong>${tramo.horaInicio} hora oficial</strong><br>
        <span>${iconoMovilidad(tramo.movilidad)} ${tramo.titulo}</span><br>
        <small>${tramo.participantes.join(", ")}</small>
      `;

      card.addEventListener("click", () => {
        map.fitBounds(L.latLngBounds(tramo.puntos), { padding: [60, 60] });
      });

      contenedor.appendChild(card);
    });
}

async function reproducirProyecto() {
  const tramosOrdenados = [...proyecto.tramos]
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  for (const tramo of tramosOrdenados) {
    await reproducirTramo(tramo);
  }
}

function reproducirTramo(tramo) {
  return new Promise(resolve => {
    mostrarPopup(tramo);

    map.fitBounds(L.latLngBounds(tramo.puntos), {
      padding: [80, 80],
      animate: true,
      duration: 1.5
    });

    const linea = L.polyline([], {
      color: tramo.color,
      weight: 6,
      opacity: 1,
      dashArray: tramo.movilidad === "caminando" ? "10,10" : null
    }).addTo(map);

    const icono = L.divIcon({
      className: "iconoMovil",
      html: iconoMovilidad(tramo.movilidad),
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marcador = L.marker(tramo.puntos[0], { icon: icono }).addTo(map);

    let i = 0;

    const intervalo = setInterval(() => {
      if (i >= tramo.puntos.length) {
        clearInterval(intervalo);
        setTimeout(() => {
          ocultarPopup();
          resolve();
        }, 1500);
        return;
      }

      const punto = tramo.puntos[i];
      linea.addLatLng(punto);
      marcador.setLatLng(punto);
      i++;
    }, 180);
  });
}

function mostrarPopup(tramo) {
  document.getElementById("popupTitulo").textContent = tramo.titulo;
  document.getElementById("popupDescripcion").textContent = tramo.descripcion;
  document.getElementById("popupHora").textContent =
    `${tramo.horaInicio} hora oficial | ${tramo.participantes.join(", ")}`;

  document.getElementById("popupEvento").classList.remove("oculto");
}

function ocultarPopup() {
  document.getElementById("popupEvento").classList.add("oculto");
}

function iconoMovilidad(movilidad) {
  const iconos = {
    caminando: "🚶",
    automovil: "🚗",
    moto: "🏍️",
    bicicleta: "🚲",
    bus: "🚌",
    taxi: "🚕",
    metro: "🚇"
  };

  return iconos[movilidad] || "📍";
}

function guardarProyecto() {
  const datos = JSON.stringify(proyecto, null, 2);

  const blob = new Blob([datos], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "RutaMapa_proyecto.rgc";
  enlace.click();

  URL.revokeObjectURL(url);
}
