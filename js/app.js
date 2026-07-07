function iniciarRutaMapa() {
  inicializarMapa();
  inicializarUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarRutaMapa);
} else {
  iniciarRutaMapa();
}
