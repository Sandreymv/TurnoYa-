/* ============================================================
   TurnoYa - JavaScript principal
   Inicializa Materialize e implementa las interacciones:
   1) Toast de bienvenida (inicio)
   2) Mostrar/ocultar detalles, filtro y cambio de color (avances)
   3) Validación del formulario de contacto (contacto)
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  // ---- Inicializar componentes de Materialize ----
  M.Sidenav.init(document.querySelectorAll(".sidenav"));
  M.Collapsible.init(document.querySelectorAll(".collapsible"), { accordion: false });
  M.Modal.init(document.querySelectorAll(".modal"));
  M.Materialbox.init(document.querySelectorAll(".materialboxed"));

  var pagina = document.body.dataset.pagina;
  if (pagina === "inicio") iniciarBienvenida();
  if (pagina === "avances") iniciarAvances();
  if (pagina === "contacto") iniciarContacto();
});

/* ---------- 1. Mensaje de bienvenida ---------- */
function iniciarBienvenida() {
  // Se muestra solo una vez por sesión para no molestar al navegar
  if (!sessionStorage.getItem("bienvenidaMostrada")) {
    M.toast({ html: "¡Bienvenido a TurnoYa! 👋", displayLength: 3500, classes: "rounded" });
    sessionStorage.setItem("bienvenidaMostrada", "1");
  }
  var btn = document.getElementById("btn-saludo");
  if (btn) {
    btn.addEventListener("click", function () {
      M.toast({ html: "Gracias por visitar nuestro proyecto", classes: "rounded" });
    });
  }
}

/* ---------- 2. Avances: interacciones ---------- */
function iniciarAvances() {
  // a) Mostrar / ocultar detalle de cada avance
  document.querySelectorAll(".btn-detalle").forEach(function (boton) {
    boton.addEventListener("click", function () {
      var detalle = boton.closest(".collection-item").querySelector(".detalle-avance");
      var visible = detalle.classList.toggle("visible");
      boton.querySelector("i").textContent = visible ? "expand_less" : "expand_more";
    });
  });

  // b) Filtrar avances por estado
  var chips = document.querySelectorAll(".chips-filtro .chip");
  var items = document.querySelectorAll(".collection-item[data-estado]");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("activo"); });
      chip.classList.add("activo");
      var filtro = chip.dataset.filtro;
      items.forEach(function (item) {
        item.style.display = (filtro === "todos" || item.dataset.estado === filtro) ? "" : "none";
      });
    });
  });

  // c) Calcular el progreso global a partir de los avances
  var total = items.length;
  var listos = document.querySelectorAll('.collection-item[data-estado="listo"]').length;
  var enProceso = document.querySelectorAll('.collection-item[data-estado="proceso"]').length;
  var porcentaje = Math.round(((listos + enProceso * 0.5) / total) * 100);
  document.getElementById("barra-progreso").style.width = porcentaje + "%";
  document.getElementById("texto-progreso").textContent = porcentaje + "% completado";

  // d) Cambiar el color de fondo de la página al hacer clic
  var colores = ["#fafafa", "#ececf9", "#e3f2fd", "#e8f5e9", "#fff8e1"];
  var indice = 0;
  document.getElementById("btn-color").addEventListener("click", function () {
    indice = (indice + 1) % colores.length;
    document.body.style.backgroundColor = colores[indice];
    M.toast({ html: "Color de fondo cambiado", displayLength: 1500 });
  });
}

/* ---------- 3. Contacto: validación del formulario ---------- */
function iniciarContacto() {
  var formulario = document.getElementById("form-contacto");
  var modal = M.Modal.getInstance(document.getElementById("modal-exito"));

  function mostrarError(campo, mensaje) {
    campo.classList.remove("valid");
    campo.classList.add("invalid");
    var ayuda = campo.parentElement.querySelector(".helper-text");
    ayuda.setAttribute("data-error", mensaje);
  }
  function marcarValido(campo) {
    campo.classList.remove("invalid");
    campo.classList.add("valid");
  }

  function validarNombre() {
    var campo = document.getElementById("nombre");
    var v = campo.value.trim();
    if (v.length < 3) { mostrarError(campo, "Escribe tu nombre (mínimo 3 caracteres)"); return false; }
    marcarValido(campo); return true;
  }
  function validarCorreo() {
    var campo = document.getElementById("correo");
    var v = campo.value.trim();
    var patron = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (v === "") { mostrarError(campo, "El correo es obligatorio"); return false; }
    if (!patron.test(v)) { mostrarError(campo, "Escribe un correo válido, p. ej. nombre@correo.com"); return false; }
    marcarValido(campo); return true;
  }
  function validarMensaje() {
    var campo = document.getElementById("mensaje");
    var v = campo.value.trim();
    if (v.length < 10) { mostrarError(campo, "El mensaje debe tener al menos 10 caracteres"); return false; }
    marcarValido(campo); return true;
  }

  // Validación en vivo al salir de cada campo
  document.getElementById("nombre").addEventListener("blur", validarNombre);
  document.getElementById("correo").addEventListener("blur", validarCorreo);
  document.getElementById("mensaje").addEventListener("blur", validarMensaje);

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    // Se ejecutan todas (sin cortocircuito) para mostrar todos los errores a la vez
    var resultados = [validarNombre(), validarCorreo(), validarMensaje()];
    if (resultados.every(Boolean)) {
      document.getElementById("resumen-nombre").textContent = document.getElementById("nombre").value.trim();
      modal.open();
      formulario.reset();
      M.updateTextFields();
      formulario.querySelectorAll(".valid").forEach(function (c) { c.classList.remove("valid"); });
    } else {
      M.toast({ html: "Revisa los campos marcados en rojo", classes: "red darken-2" });
    }
  });
}
