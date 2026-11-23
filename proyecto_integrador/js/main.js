/* TurnoYa - JavaScript principal
   Inicializa Materialize e implementa las interacciones:
   1) Toast de bienvenida (inicio)
   2) Mostrar/ocultar detalles, filtro y cambio de color (avances)
   3) Validación del formulario de contacto (contacto)
   4) Animaciones: aparición al hacer scroll y conteo del progreso
   5) Turnos en vivo: pantalla pública y "Pide tu turno" (turnos) */
document.addEventListener("DOMContentLoaded", function () {
  // Inicializar componentes de Materialize
  M.Sidenav.init(document.querySelectorAll(".sidenav"));
  M.Collapsible.init(document.querySelectorAll(".collapsible"), { accordion: false });
  M.Modal.init(document.querySelectorAll(".modal"));
  M.Materialbox.init(document.querySelectorAll(".materialboxed"));

  iniciarRevelado();

  var pagina = document.body.dataset.pagina;
  if (pagina === "inicio") iniciarBienvenida();
  if (pagina === "turnos") iniciarTurnos();
  if (pagina === "avances") iniciarAvances();
  if (pagina === "contacto") iniciarContacto();
});

/* 1. Mensaje de bienvenida */
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

/* 2. Avances: interacciones */
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
  contarHasta(document.getElementById("numero-progreso"), porcentaje);

  // d) Cambiar el color de fondo de la página al hacer clic
  // Solo tonos de la paleta de TurnoYa: papel, índigo claro, ámbar claro y blanco
  var colores = ["#faf6ee", "#ececf9", "#fff4dc", "#ffffff"];
  var indice = 0;
  document.getElementById("btn-color").addEventListener("click", function () {
    indice = (indice + 1) % colores.length;
    document.body.style.backgroundColor = colores[indice];
    M.toast({ html: "Color de fondo cambiado", displayLength: 1500 });
  });
}

/* 3. Contacto: validación del formulario */
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

/* 4. Animaciones */
var sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// a) Los bloques con .revelar aparecen al entrar en pantalla
function iniciarRevelado() {
  var elementos = document.querySelectorAll(".revelar");
  if (!("IntersectionObserver" in window) || sinMovimiento) {
    elementos.forEach(function (el) { el.classList.add("visible"); });
    return;
  }
  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("visible");
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  elementos.forEach(function (el) { observador.observe(el); });
}

// b) Cuenta animada del número grande de progreso
function contarHasta(elemento, meta) {
  if (!elemento) return;
  if (sinMovimiento) { elemento.textContent = meta + "%"; return; }
  var inicio = null;
  function paso(t) {
    if (!inicio) inicio = t;
    var avance = Math.min((t - inicio) / 1200, 1);
    var suave = 1 - Math.pow(1 - avance, 3);
    elemento.textContent = Math.round(meta * suave) + "%";
    if (avance < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
}

/* 5. Turnos en vivo por entidad (simulación en el navegador)
   Cada entidad tiene su propia fila, servicios, módulos y pantalla.
   Un turno se identifica por la entidad (sigla y color) + el código (letra del servicio y número). */
var ENTIDADES = [
  { id: "univalle", sigla: "UV", nombre: "Universidad del Valle", tipo: "Educación", sede: "Sede Tuluá · Registro académico",
    icono: "school", color: "indigo",
    servicios: [{ letra: "A", nombre: "Matrículas" }, { letra: "B", nombre: "Tesorería" }, { letra: "C", nombre: "Certificados" }, { letra: "D", nombre: "Admisiones" }] },
  { id: "banco-andino", sigla: "BA", nombre: "Banco Andino", tipo: "Bancos", sede: "Oficina Centro",
    icono: "account_balance", color: "ambar",
    servicios: [{ letra: "C", nombre: "Caja" }, { letra: "A", nombre: "Asesoría" }, { letra: "R", nombre: "Créditos" }, { letra: "T", nombre: "Tarjetas" }] },
  { id: "hospital-central", sigla: "HC", nombre: "Hospital Central", tipo: "Salud", sede: "Consulta externa",
    icono: "local_hospital", color: "durazno",
    servicios: [{ letra: "P", nombre: "Admisión prioritaria" }, { letra: "C", nombre: "Consulta externa" }, { letra: "L", nombre: "Laboratorio" }, { letra: "F", nombre: "Farmacia" }] },
  { id: "eps-vida-sana", sigla: "EV", nombre: "EPS Vida Sana", tipo: "Salud", sede: "Punto de atención al afiliado",
    icono: "health_and_safety", color: "menta",
    servicios: [{ letra: "A", nombre: "Autorizaciones" }, { letra: "C", nombre: "Citas médicas" }, { letra: "F", nombre: "Afiliaciones" }, { letra: "M", nombre: "Medicamentos" }] },
  { id: "alcaldia", sigla: "AM", nombre: "Alcaldía Municipal", tipo: "Gobierno", sede: "Atención al ciudadano",
    icono: "location_city", color: "lavanda",
    servicios: [{ letra: "I", nombre: "Impuestos" }, { letra: "S", nombre: "SISBÉN" }, { letra: "V", nombre: "Ventanilla única" }, { letra: "C", nombre: "Certificados" }] },
  { id: "laboratorio-vital", sigla: "LV", nombre: "Laboratorio Vital", tipo: "Salud", sede: "Toma de muestras",
    icono: "biotech", color: "rosa",
    servicios: [{ letra: "T", nombre: "Toma de muestras" }, { letra: "R", nombre: "Entrega de resultados" }, { letra: "F", nombre: "Facturación" }] }
];

function iniciarTurnos() {
  var INTERVALO = 5000;        // las filas avanzan cada 5 s
  var MINUTOS_POR_TURNO = 3;   // espera estimada que se muestra
  var $ = function (id) { return document.getElementById(id); };
  var porId = {};
  var misTurnos = [];          // turnos del usuario, en cualquier entidad
  var actual = null;           // entidad abierta (o null en el listado)
  var filtroTipo = "todas";

  // --- Estado de cada entidad: su propia numeración, módulos y cola ---
  ENTIDADES.forEach(function (ent, k) {
    porId[ent.id] = ent;
    ent.contador = {};
    ent.servicios.forEach(function (s, n) {
      s.modulo = n + 1;        // cada servicio se atiende en su módulo
      ent.contador[s.letra] = 5 + ((k * 7 + n * 3) % 20);
    });
    ent.modulos = ent.servicios.map(function (s) { return { numero: s.modulo, turno: nuevoTurno(ent, s.letra) }; });
    ent.llamado = ent.modulos[0].turno;
    ent.cola = [];
    for (var i = 0; i < 3 + (k % 3); i++) ent.cola.push(nuevoTurno(ent, servicioAlAzar(ent).letra));
  });

  function nuevoTurno(ent, letra) {
    ent.contador[letra]++;
    return { entidad: ent.id, letra: letra, codigo: letra + String(ent.contador[letra]).padStart(3, "0") };
  }
  function servicioAlAzar(ent) { return ent.servicios[Math.floor(Math.random() * ent.servicios.length)]; }
  function servicio(ent, letra) { return ent.servicios.filter(function (s) { return s.letra === letra; })[0]; }
  function miTurnoEn(ent) { return misTurnos.filter(function (t) { return t.entidad === ent.id; })[0] || null; }
  function sigla(ent) { return '<span class="sigla ent-' + ent.color + '">' + ent.sigla + "</span>"; }

  // --- Vista 1: listado de entidades ---
  function dibujarListado() {
    var texto = $("buscar-entidad").value.trim().toLowerCase();
    var visibles = ENTIDADES.filter(function (e) {
      var coincide = (e.nombre + " " + e.tipo + " " + e.sede).toLowerCase().indexOf(texto) !== -1;
      return coincide && (filtroTipo === "todas" || e.tipo === filtroTipo);
    });
    $("lista-entidades").innerHTML = visibles.map(function (e) {
      var mio = miTurnoEn(e);
      return '<a class="entidad ent-' + e.color + '" href="#' + e.id + '">' +
        (mio ? '<span class="tengo-turno sigla ent-' + e.color + '">Tu turno ' + mio.codigo + "</span>" : "") +
        '<div class="entidad-cabeza"><span class="entidad-icono"><i class="material-icons" aria-hidden="true">' + e.icono +
        '</i></span><div><span class="entidad-tipo">' + e.tipo + " · " + e.sigla + "</span><h3>" + e.nombre + "</h3></div></div>" +
        '<span class="entidad-sede">' + e.sede + " · " + e.servicios.length + " servicios</span>" +
        '<div class="entidad-pie"><span class="entidad-en-vivo"><span class="punto-vivo" aria-hidden="true"></span><b>' +
        e.cola.length + "</b> en fila · llamando <b>" + e.llamado.codigo + "</b></span>" +
        '<span class="entidad-entrar">Entrar<i class="material-icons" aria-hidden="true">arrow_forward</i></span></div></a>';
    }).join("");
    $("sin-resultados").hidden = visibles.length > 0;
  }

  // --- Tira "Mis turnos" (todas las entidades) ---
  function dibujarMisTurnos() {
    $("mis-turnos").hidden = misTurnos.length === 0;
    $("mis-turnos-lista").innerHTML = misTurnos.map(function (t) {
      var ent = porId[t.entidad];
      var estado = t.llamado ? "¡Te llaman! Mód. " + servicio(ent, t.letra).modulo : ent.cola.indexOf(t) + " delante";
      return '<a class="mi-turno-chip' + (t.llamado ? " llamado" : "") + '" href="#' + ent.id + '" title="' + ent.nombre + '">' +
        sigla(ent) + "<b>" + t.codigo + "</b><span>" + estado + "</span></a>";
    }).join("");
  }

  // --- Vista 2: pantalla y pedido de turno de una entidad ---
  function dibujarEntidad(animar) {
    var ent = actual;
    $("ent-nombre").textContent = ent.nombre;
    $("ent-detalle").textContent = ent.tipo + " · " + ent.sede + " · Sigla " + ent.sigla;
    $("ent-icono").className = "entidad-icono ent-" + ent.color;
    $("ent-icono").innerHTML = '<i class="material-icons" aria-hidden="true">' + ent.icono + "</i>";

    var caja = $("llamado-actual");
    var s = servicio(ent, ent.llamado.letra);
    caja.className = "llamado-actual ent-" + ent.color;
    $("llamado-codigo").textContent = ent.llamado.codigo;
    $("llamado-modulo").textContent = "Módulo " + s.modulo;
    $("llamado-servicio").textContent = s.nombre;
    if (animar) { void caja.offsetWidth; caja.classList.add("cambio"); }

    var mio = miTurnoEn(ent);
    var lista = ent.cola.slice(0, 5);
    if (mio && !mio.llamado && lista.indexOf(mio) === -1) lista.push(mio);
    $("cola-lista").innerHTML = lista.length ? lista.map(function (t, i) {
      var esMio = t === mio;
      var etiqueta = esMio ? "Tú · puesto " + (ent.cola.indexOf(t) + 1) : (i === 0 ? "Siguiente" : "Mód. " + servicio(ent, t.letra).modulo);
      return "<li" + (esMio ? ' class="es-mio"' : "") + '><span class="cola-codigo">' + t.codigo + '</span><span class="cola-servicio">' +
        servicio(ent, t.letra).nombre + '</span><span class="cola-etiqueta">' + etiqueta + "</span></li>";
    }).join("") : '<li class="cola-vacia">No hay nadie en la fila 🎉</li>';

    $("modulos").innerHTML = ent.modulos.map(function (m) {
      return '<div class="modulo' + (m.turno === ent.llamado ? " activo" : "") + '"><span class="modulo-nombre">Módulo ' + m.numero +
        '</span><span class="modulo-codigo">' + m.turno.codigo + '</span><span class="modulo-servicio">' +
        servicio(ent, m.turno.letra).nombre + "</span></div>";
    }).join("");

    dibujarMiTurno();
  }

  function dibujarServicios() {
    $("servicios").innerHTML = actual.servicios.map(function (s) {
      return '<button type="button" class="servicio ent-' + actual.color + '" data-letra="' + s.letra + '">' +
        '<span class="servicio-letra" aria-hidden="true">' + s.letra + '</span><span class="servicio-nombre">' + s.nombre +
        '</span><span class="servicio-modulo">Módulo ' + s.modulo + "</span></button>";
    }).join("");
  }

  function dibujarMiTurno() {
    var ent = actual, mio = miTurnoEn(ent), tarjeta = $("mi-turno");
    $("mi-turno-vacio").hidden = !!mio;
    tarjeta.hidden = !mio;
    if (!mio) return;
    var s = servicio(ent, mio.letra);
    var delante = ent.cola.indexOf(mio);
    $("mi-entidad").innerHTML = sigla(ent) + ent.nombre;
    $("mi-codigo").textContent = mio.codigo;
    $("mi-servicio").textContent = s.nombre + " · Módulo " + s.modulo;
    tarjeta.classList.toggle("llamado", !!mio.llamado);
    if (mio.llamado) {
      $("mi-delante").textContent = "0";
      $("mi-espera").textContent = "0";
      $("mi-progreso").style.width = "100%";
      $("mi-estado").textContent = "🔔 ¡Es tu turno! Dirígete al Módulo " + s.modulo;
      $("btn-cancelar").textContent = "Listo, pedir otro turno";
    } else {
      $("mi-delante").textContent = delante;
      $("mi-espera").textContent = delante * MINUTOS_POR_TURNO;
      var avance = mio.inicial ? (mio.inicial - delante) / mio.inicial : 1;
      $("mi-progreso").style.width = Math.round(avance * 100) + "%";
      $("mi-estado").textContent = delante === 0 ? "⏳ Eres el siguiente, prepárate" : "⏳ En espera";
      $("btn-cancelar").textContent = "Cancelar turno";
    }
  }

  // --- Cambiar de vista según la dirección (#banco-andino, etc.) ---
  function mostrarVista() {
    var id = location.hash.slice(1);
    actual = porId[id] || null;
    $("vista-listado").hidden = !!actual;
    $("como-funciona").hidden = !!actual;
    $("vista-entidad").hidden = !actual;
    if (actual) {
      document.title = actual.nombre + " · Turnos en vivo | TurnoYa";
      dibujarServicios();
      dibujarEntidad(false);
      $("vista-entidad").scrollIntoView({ block: "start" });
    } else {
      document.title = "Turnos en vivo | TurnoYa";
      dibujarListado();
    }
    dibujarMisTurnos();
  }

  // --- Cada intervalo avanzan todas las filas, aunque no se estén viendo ---
  function avanzarFilas() {
    ENTIDADES.forEach(function (ent) {
      if (ent.cola.length && Math.random() < 0.85) {
        ent.llamado = ent.cola.shift();
        var s = servicio(ent, ent.llamado.letra);
        ent.modulos[s.modulo - 1].turno = ent.llamado;
        if (misTurnos.indexOf(ent.llamado) !== -1) {
          ent.llamado.llamado = true;
          M.toast({ html: "🔔 " + ent.sigla + " · " + ent.llamado.codigo + ": ¡es tu turno en " + ent.nombre + "! Módulo " + s.modulo,
            displayLength: 6000, classes: "rounded" });
        }
      }
      if (ent.cola.length < 3 || (ent.cola.length < 7 && Math.random() < 0.4)) ent.cola.push(nuevoTurno(ent, servicioAlAzar(ent).letra));
    });
    if (actual) dibujarEntidad(true); else dibujarListado();
    dibujarMisTurnos();
  }

  // --- Eventos ---
  $("servicios").addEventListener("click", function (e) {
    var boton = e.target.closest(".servicio");
    if (!boton) return;
    var mio = miTurnoEn(actual);
    if (mio && !mio.llamado) {
      M.toast({ html: "Ya tienes el turno " + actual.sigla + " · " + mio.codigo + " activo en esta entidad", classes: "rounded" });
      return;
    }
    if (mio) misTurnos.splice(misTurnos.indexOf(mio), 1);
    var turno = nuevoTurno(actual, boton.dataset.letra);
    turno.inicial = actual.cola.length;
    actual.cola.push(turno);
    misTurnos.push(turno);
    M.toast({ html: "Tu turno en " + actual.nombre + " es " + turno.codigo, classes: "rounded" });
    dibujarEntidad(false);
    dibujarMisTurnos();
    if (window.innerWidth <= 992) $("mi-turno").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $("btn-cancelar").addEventListener("click", function () {
    var mio = miTurnoEn(actual);
    if (!mio) return;
    if (!mio.llamado) {
      actual.cola.splice(actual.cola.indexOf(mio), 1);
      M.toast({ html: "Turno " + mio.codigo + " cancelado", classes: "rounded" });
    }
    misTurnos.splice(misTurnos.indexOf(mio), 1);
    dibujarEntidad(false);
    dibujarMisTurnos();
  });

  $("buscar-entidad").addEventListener("input", dibujarListado);
  $("filtro-entidades").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    filtroTipo = chip.dataset.tipo;
    this.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("activo", c === chip); });
    dibujarListado();
  });
  document.querySelector(".btn-volver").addEventListener("click", function (e) {
    e.preventDefault();
    history.pushState("", document.title, location.pathname);
    mostrarVista();
    $("vista-listado").scrollIntoView({ block: "start" });
  });
  window.addEventListener("hashchange", mostrarVista);

  function actualizarReloj() {
    $("reloj").textContent = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  }
  actualizarReloj();
  setInterval(actualizarReloj, 1000);
  mostrarVista();
  setInterval(avanzarFilas, INTERVALO);
}
