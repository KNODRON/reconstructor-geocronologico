// ===============================
// RECONSTRUCTOR GEOCRONOLÓGICO V1
// ===============================

const map = L.map("map").setView([-33.4489, -70.6693], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap"
}).addTo(map);

// Eventos de prueba
const eventos = [
  {
    hora: "21:00:00",
    sujeto: "Sujeto 1",
    modo: "vehiculo",
    lat: -33.4489,
    lng: -70.6693,
    titulo: "Inicio de desplazamiento",
    descripcion: "Vehículo inicia recorrido desde el primer punto observado."
  },
  {
    hora: "21:05:00",
    sujeto: "Sujeto 1",
    modo: "vehiculo",
    lat: -33.4520,
    lng: -70.6750,
    titulo: "Continuidad de ruta",
    descripcion: "Vehículo continúa desplazamiento por la vía principal."
  },
  {
    hora: "21:10:00",
    sujeto: "Sujeto 1",
    modo: "letrero",
    lat: -33.4520,
    lng: -70.6750,
    titulo: "Pausa explicativa",
    descripcion: "En este punto se incorpora un antecedente relevante para la investigación."
  },
  {
    hora: "21:15:00",
    sujeto: "Sujeto 1",
    modo: "caminando",
    lat: -33.4550,
    lng: -70.6800,
    titulo: "Desplazamiento a pie",
    descripcion: "Sujeto continúa su desplazamiento caminando."
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

  dibujarEvento(evento);

  await esperar(2500);
  ocultarLetrero();
}

function dibujarEvento(evento) {
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

    L.polyline([puntoAnterior, puntoActual], {
      color,
      weight: 5,
      opacity: 0.9,
      dashArray: evento.modo === "caminando" ? "10, 10" : null
    }).addTo(map);
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
