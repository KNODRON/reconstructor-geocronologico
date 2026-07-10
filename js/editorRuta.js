const editorRuta = {
  tramo: null,
  nodos: [],
  nodosIntermedios: []
};

function activarEditorRuta(tramo) {
  desactivarEditorRuta();

  if (!tramo || !Array.isArray(tramo.puntos) || tramo.puntos.length < 2) {
    alert("El tramo no contiene suficientes puntos para editar.");
    return;
  }

  editorRuta.tramo = tramo;

  // Aseguramos que exista una línea editable
  if (!tramo.lineaCapa || !estado.map.hasLayer(tramo.lineaCapa)) {
    dibujarTramoFinal(tramo);
  }

  tramo.lineaCapa.setStyle({
    weight: 7,
    opacity: 1
  });

  crearNodosPrincipales();
  crearNodosIntermedios();
}

function crearNodosPrincipales() {
  const tramo = editorRuta.tramo;

  tramo.puntos.forEach((punto, indice) => {
    const nodo = crearMarcadorNodo(punto, "principal");

    nodo.on("drag", event => {
      const posicion = event.target.getLatLng();

      tramo.puntos[indice] = [
        posicion.lat,
        posicion.lng
      ];

      actualizarLineaEditor();
      actualizarNodosIntermedios();
    });

    editorRuta.nodos.push(nodo);
  });
}

function crearNodosIntermedios() {
  limpiarNodosIntermedios();

  const tramo = editorRuta.tramo;

  for (let i = 0; i < tramo.puntos.length - 1; i++) {
    const puntoA = tramo.puntos[i];
    const puntoB = tramo.puntos[i + 1];

    const medio = [
      (puntoA[0] + puntoB[0]) / 2,
      (puntoA[1] + puntoB[1]) / 2
    ];

    const nodoMedio = crearMarcadorNodo(medio, "intermedio");

    nodoMedio.on("dragstart", () => {
      // Al arrastrar una parte de la línea se crea un nuevo vértice
      const posicion = nodoMedio.getLatLng();

      tramo.puntos.splice(i + 1, 0, [
        posicion.lat,
        posicion.lng
      ]);

      convertirIntermedioEnPrincipal(nodoMedio, i + 1);
    });

    editorRuta.nodosIntermedios.push(nodoMedio);
  }
}

function convertirIntermedioEnPrincipal(nodo, indice) {
  nodo.setIcon(crearIconoNodo("principal"));

  editorRuta.nodos.push(nodo);
  editorRuta.nodosIntermedios =
    editorRuta.nodosIntermedios.filter(item => item !== nodo);

  nodo.off("dragstart");

  nodo.on("drag", event => {
    const posicion = event.target.getLatLng();

    editorRuta.tramo.puntos[indice] = [
      posicion.lat,
      posicion.lng
    ];

    actualizarLineaEditor();
  });

  nodo.on("dragend", () => {
    reconstruirEditorRuta();
  });
}

function crearMarcadorNodo(punto, tipo) {
  return L.marker(punto, {
    draggable: true,
    keyboard: false,
    zIndexOffset: tipo === "principal" ? 1500 : 1400,
    icon: crearIconoNodo(tipo)
  }).addTo(estado.map);
}

function crearIconoNodo(tipo) {
  const clase =
    tipo === "principal"
      ? "nodo-ruta-principal"
      : "nodo-ruta-intermedio";

  return L.divIcon({
    className: "",
    html: `<div class="${clase}"></div>`,
    iconSize: tipo === "principal" ? [18, 18] : [14, 14],
    iconAnchor: tipo === "principal" ? [9, 9] : [7, 7]
  });
}

function actualizarLineaEditor() {
  if (!editorRuta.tramo?.lineaCapa) return;

  editorRuta.tramo.lineaCapa.setLatLngs(
    editorRuta.tramo.puntos
  );
}

function actualizarNodosIntermedios() {
  limpiarNodosIntermedios();
  crearNodosIntermedios();
}

function reconstruirEditorRuta() {
  const tramo = editorRuta.tramo;
  activarEditorRuta(tramo);
}

function limpiarNodosIntermedios() {
  editorRuta.nodosIntermedios.forEach(nodo => {
    if (estado.map.hasLayer(nodo)) {
      estado.map.removeLayer(nodo);
    }
  });

  editorRuta.nodosIntermedios = [];
}

function desactivarEditorRuta() {
  editorRuta.nodos.forEach(nodo => {
    if (estado.map.hasLayer(nodo)) {
      estado.map.removeLayer(nodo);
    }
  });

  editorRuta.nodosIntermedios.forEach(nodo => {
    if (estado.map.hasLayer(nodo)) {
      estado.map.removeLayer(nodo);
    }
  });

  if (editorRuta.tramo?.lineaCapa) {
    editorRuta.tramo.lineaCapa.setStyle({
      weight: 5,
      opacity: 0.95
    });
  }

  editorRuta.tramo = null;
  editorRuta.nodos = [];
  editorRuta.nodosIntermedios = [];
}
