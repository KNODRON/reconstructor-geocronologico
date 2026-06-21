// ===============================
// RECONSTRUCTOR GEOCRONOLÓGICO V1
// ===============================

const map = L.map("map").setView([-33.4489, -70.6693], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap"
}).addTo(map);

const eventos = [
  {
    hora: "21:00:00",
    sujeto: "Sujeto 1",
    modo: "vehiculo",
    lat: -33.4489,
    lng: -70.6693,
    titulo: "Inicio Sujeto 1",
    descripcion: "Vehículo inicia desplazamiento."
  },
  {
    hora: "21:05:00",
    sujeto: "Sujeto 1",
    modo: "vehiculo",
    lat: -33.4520,
    lng: -70.6750,
    titulo: "Ruta Sujeto 1",
    descripcion: "Vehículo continúa desplazamiento."
  },
  {
    hora: "21:07:00",
    sujeto: "Sujeto 2",
    modo: "vehiculo",
    lat: -33.4372,
    lng: -70.6506,
    titulo: "Inicio Sujeto 2",
    descripcion: "Se inicia una segunda ruta en otro sector."
  },
  {
    hora: "21:12:00",
    sujeto: "Sujeto 2",
    modo: "vehiculo",
    lat: -33.4405,
    lng: -70.6580,
    titulo: "Ruta Sujeto 2",
    descripcion: "Segundo vehículo continúa desplazamiento."
  },
  {
    hora: "21:15:00",
    sujeto: "Sujeto 1",
    modo: "letrero",
    lat: -33.4520,
    lng: -70.6750,
    titulo: "Pausa Sujeto 1",
    descripcion: "Se incorpora antecedente relevante asociado al primer sujeto."
  },
  {
    hora: "21:20:00",
    sujeto: "Sujeto 1",
    modo: "caminando",
    lat: -33.4550,
    lng: -70.6800,
    titulo: "Desplazamiento a pie",
    descripcion: "Sujeto 1 continúa desplazamiento caminando."
  },
  {
    hora: "21:25:00",
    sujeto: "Sujeto 2",
    modo: "letrero",
    lat: -33.4405,
    lng: -70.6580,
    titulo: "Pausa Sujeto 2",
    descripcion: "Se incorpora antecedente relevante asociado al segundo sujeto."
  },
  {
    hora: "21:30:00",
    sujeto: "Sujeto 2",
    modo: "vehiculo",
    lat: -33.4450,
    lng: -70.6650,
    titulo: "Continuidad Sujeto 2",
    descripcion: "El segundo vehículo continúa su desplazamiento."
  }
];
const colores = {
  "Sujeto 1": "#d71920",
  "Sujeto 2": "#0057b8",
  "Sujeto 3": "#00843d"
};

let puntosPorSujeto = {};
let indice = 0;
let reproduciendo = false;

const panel = document.getElementById("panelEvento");
const titulo = document.getElementById("eventoTitulo");
const descripcion = document.getElementById("eventoDescripcion");
const hora = document.getElementById("eventoHora");
const btnPlay = document.getElementById("btnPlay");

btnPlay.addEventListener("click", async () => {
  if (reproduciendo) return;

  reproduciendo = true;
  btnPlay.textContent = "⏸ Reproduciendo...";

  for (; indice < eventos.length; indice++) {
    await ejecutarEvento(eventos[indice]);
  }

  btnPlay.textContent = "✅ Finalizado";
  reproduciendo = false;
});

async function ejecutarEvento(evento) {
  map.flyTo([evento.lat, evento.lng], 15, {
    duration: 2.5
  });

  await esperar(2500);

  mostrarLetrero(evento);

  if (evento.modo === "letrero") {
    await esperar(5000);
    ocultarLetrero();
    return;
  }

  await dibujarEvento(evento);

  await esperar(2500);
  ocultarLetrero();
}

async function dibujarEvento(evento) {
  const color = colores[evento.sujeto] || "#d71920";

  if (!puntosPorSujeto[evento.sujeto]) {
    puntosPorSujeto[evento.sujeto] = [];
  }

  const puntos = puntosPorSujeto[evento.sujeto];
  const puntoActual = [evento.lat, evento.lng];

  L.circleMarker(puntoActual, {
    radius: 6,
    color,
    fillColor: color,
    fillOpacity: 1
  }).addTo(map);

  if (puntos.length > 0) {
    const puntoAnterior = puntos[puntos.length - 1];
    await animarLinea(puntoAnterior, puntoActual, color, evento.modo, evento.sujeto);
  }

  puntos.push(puntoActual);
}

function mostrarLetrero(evento) {
  titulo.textContent = evento.titulo;
  descripcion.textContent = evento.descripcion;
  hora.textContent = `${evento.hora} | ${evento.sujeto}`;
  panel.classList.remove("oculto");
}

function ocultarLetrero() {
  panel.classList.add("oculto");
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function animarLinea(inicio, fin, color, modo, sujeto) {
  return new Promise(resolve => {
    const pasos = 100;
    let actual = 0;

    const linea = L.polyline([inicio], {
      color,
      weight: 5,
      opacity: 0.9,
      dashArray: modo === "caminando" ? "10, 10" : null
    }).addTo(map);

    const icono = L.divIcon({
      className: "icono-movil",
      html: modo === "caminando" ? "🚶" : "🚗",
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    let marcador = L.marker(inicio, { icon: icono }).addTo(map);

    const intervalo = setInterval(() => {
      actual++;

      const lat = inicio[0] + (fin[0] - inicio[0]) * (actual / pasos);
      const lng = inicio[1] + (fin[1] - inicio[1]) * (actual / pasos);

      const punto = [lat, lng];

      linea.addLatLng(punto);
      marcador.setLatLng(punto);

      if (actual >= pasos) {
        clearInterval(intervalo);
        resolve();
      }
    }, 25);
  });
}

let modoDibujo = false;
let rutaTemporal = [];
let lineaTemporal = null;
let marcadoresTemporales = [];

const iconosMovilidad = {
  caminando: "🚶",
  moto: "🏍️",
  bicicleta: "🚲",
  automovil: "🚗",
  bus: "🚌",
  taxi: "🚕",
  metro: "🚇"
};

document.getElementById("btnNuevaRuta").addEventListener("click", () => {
  modoDibujo = true;
  rutaTemporal = [];
  marcadoresTemporales.forEach(m => map.removeLayer(m));
  marcadoresTemporales = [];

  if (lineaTemporal) {
    map.removeLayer(lineaTemporal);
    lineaTemporal = null;
  }

  alert("Modo dibujo activado. Haz clic sobre el mapa para agregar puntos.");
});

document.getElementById("btnFinalizarRuta").addEventListener("click", () => {
  if (rutaTemporal.length < 2) {
    alert("La ruta necesita al menos 2 puntos.");
    return;
  }

  const sujeto = document.getElementById("inputSujeto").value;
  const movilidad = document.getElementById("inputMovilidad").value;
  const hora = document.getElementById("inputHora").value;
  const titulo = document.getElementById("inputTitulo").value;
  const descripcion = document.getElementById("inputDescripcion").value;

  rutaTemporal.forEach((punto, i) => {
    eventos.push({
      hora,
      sujeto,
      modo: movilidad,
      lat: punto[0],
      lng: punto[1],
      titulo: i === 0 ? titulo : `Continuidad ${sujeto}`,
      descripcion,
      movilidad
    });
  });

  modoDibujo = false;
  alert("Ruta agregada a la cronología.");
});

document.getElementById("btnDeshacer").addEventListener("click", () => {
  if (rutaTemporal.length === 0) return;

  rutaTemporal.pop();

  const ultimoMarcador = marcadoresTemporales.pop();
  if (ultimoMarcador) map.removeLayer(ultimoMarcador);

  if (lineaTemporal) {
    lineaTemporal.setLatLngs(rutaTemporal);
  }
});

map.on("click", (e) => {
  if (!modoDibujo) return;

  const punto = [e.latlng.lat, e.latlng.lng];
  rutaTemporal.push(punto);

  const marcador = L.circleMarker(punto, {
    radius: 5,
    color: "#ffffff",
    fillColor: "#00ff88",
    fillOpacity: 1
  }).addTo(map);

  marcadoresTemporales.push(marcador);

  if (!lineaTemporal) {
    lineaTemporal = L.polyline(rutaTemporal, {
      color: "#00ff88",
      weight: 4,
      dashArray: document.getElementById("inputMovilidad").value === "caminando" ? "10,10" : null
    }).addTo(map);
  } else {
    lineaTemporal.setLatLngs(rutaTemporal);
  }
});
