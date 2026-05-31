// ================================================
//  agregar_producto.js
//
//  ¿QUÉ HACE ESTE ARCHIVO?
//  ─────────────────────────────────────────────
//  Controla TODO el comportamiento del formulario
//  de agregar productos. Se divide en 5 partes:
//
//  PARTE 1 — ESTADO
//    Variables que guardan lo que el usuario eligió
//    (emoji seleccionado, contador de specs)
//
//  PARTE 2 — ABRIR Y CERRAR
//    Funciones para mostrar/ocultar el formulario
//
//  PARTE 3 — ESPECIFICACIONES DINÁMICAS
//    Agregar y eliminar filas de specs en tiempo real
//
//  PARTE 4 — VALIDACIÓN
//    Revisa cada campo antes de enviar
//
//  PARTE 5 — GUARDAR EN LA BASE DE DATOS
//    Reune todos los datos, los envía a
//    guardar_producto.php con fetch(), y al recibir
//    respuesta exitosa recarga las tarjetas del
//    catálogo SIN borrar los productos existentes
// ================================================


// ════════════════════════════════════════════════
//  PARTE 1: ESTADO
//  Variables que guardan la selección del usuario
// ════════════════════════════════════════════════

// Emoji que el usuario eligió (por defecto laptop)
let emojiSeleccionado = '💻';

// Contador para dar IDs únicos a cada fila de spec
let contadorSpec = 0;


// ════════════════════════════════════════════════
//  PARTE 2: ABRIR Y CERRAR EL FORMULARIO
// ════════════════════════════════════════════════

/**
 * abrirFormProducto()
 * ─────────────────────────────────────────────
 * Se llama cuando el usuario hace clic en el
 * botón flotante "＋ Agregar Producto".
 *
 * Pasos:
 * 1. Limpia el formulario (por si quedó algo de antes)
 * 2. Agrega 3 filas de specs vacías como punto de partida
 * 3. Muestra el overlay añadiendo la clase "abierto"
 * 4. Bloquea el scroll de la página de fondo
 */
function abrirFormProducto() {
    // Limpiar formulario anterior
    limpiarFormulario();

    // Agregar 3 filas iniciales de specs
    agregarFilaSpec();
    agregarFilaSpec();
    agregarFilaSpec();

    // Mostrar el modal
    document.getElementById('ap-overlay').classList.add('abierto');
    document.body.style.overflow = 'hidden';
}


/**
 * cerrarFormProducto()
 * ─────────────────────────────────────────────
 * Cierra el formulario sin guardar nada.
 * Restaura el scroll de la página.
 */
function cerrarFormProducto() {
    document.getElementById('ap-overlay').classList.remove('abierto');
    document.body.style.overflow = '';
}


/**
 * cerrarSiEsFondo(event)
 * ─────────────────────────────────────────────
 * Solo cierra el modal si el usuario hizo clic
 * en el fondo oscuro, no dentro del formulario.
 * Se llama desde onclick del ap-overlay.
 */
function cerrarSiEsFondo(event) {
    if (event.target === document.getElementById('ap-overlay')) {
        cerrarFormProducto();
    }
}


/**
 * limpiarFormulario()
 * ─────────────────────────────────────────────
 * Resetea todos los campos a su estado inicial.
 * Se llama cada vez que se abre el formulario.
 */
function limpiarFormulario() {
    // Limpiar campos de texto
    document.getElementById('ap-nombre').value      = '';
    document.getElementById('ap-marca').value       = '';
    document.getElementById('ap-categoria').value   = '';
    document.getElementById('ap-descripcion').value = '';
    document.getElementById('ap-precio').value      = '';
    document.getElementById('ap-precio-antes').value = '';
    document.getElementById('ap-badge').value       = '';

    // Resetear emoji al de laptop
    emojiSeleccionado = '💻';
    document.querySelectorAll('.ap-emoji-btn').forEach(function(btn) {
        btn.classList.toggle('seleccionado', btn.dataset.emoji === '💻');
    });

    // Limpiar lista de specs
    document.getElementById('ap-specs-lista').innerHTML = '';
    contadorSpec = 0;

    // Ocultar alertas y errores
    ocultarApAlerta();
    document.querySelectorAll('.ap-err').forEach(function(e) { e.classList.remove('visible'); });
    document.querySelectorAll('.ap-grupo input, .ap-grupo select, .ap-grupo textarea').forEach(function(i) {
        i.classList.remove('invalido');
    });

    // Rehabilitar botón de guardar
    const btn = document.getElementById('ap-btn-guardar');
    btn.disabled    = false;
    btn.textContent = '💾 Guardar Producto en la Base de Datos';
}


// ════════════════════════════════════════════════
//  PARTE 3: ESPECIFICACIONES DINÁMICAS
// ════════════════════════════════════════════════

/**
 * agregarFilaSpec()
 * ─────────────────────────────────────────────
 * Crea una nueva fila de especificación con:
 * - Input para el NOMBRE de la spec (ej: "RAM")
 * - Input para el VALOR de la spec (ej: "8 GB DDR4")
 * - Botón X para eliminarla
 *
 * Cada fila tiene un id único basado en contadorSpec
 * para poder eliminarla individualmente.
 */
function agregarFilaSpec() {
    contadorSpec++;
    const id = 'spec-' + contadorSpec;

    // Crear el div de la fila
    const fila = document.createElement('div');
    fila.className = 'ap-spec-fila';
    fila.id = id;

    // HTML de la fila: dos inputs + botón X
    fila.innerHTML = `
        <input type="text"
               placeholder="Ej: RAM, Procesador..."
               class="spec-nombre"/>
        <input type="text"
               placeholder="Ej: 8 GB DDR4..."
               class="spec-valor"/>
        <button type="button"
                class="ap-btn-eliminar-spec"
                onclick="eliminarFilaSpec('${id}')"
                title="Eliminar esta especificación">
            ✕
        </button>`;

    // Agregar la fila a la lista
    document.getElementById('ap-specs-lista').appendChild(fila);
}


/**
 * eliminarFilaSpec(id)
 * ─────────────────────────────────────────────
 * Elimina la fila de especificación con ese id.
 * Solo elimina la fila del DOM (del HTML visible),
 * no afecta la base de datos.
 */
function eliminarFilaSpec(id) {
    const fila = document.getElementById(id);
    if (fila) fila.remove();
}


/**
 * seleccionarEmoji(btn)
 * ─────────────────────────────────────────────
 * Cuando el usuario hace clic en uno de los
 * botones de emoji:
 * 1. Quita la clase "seleccionado" de todos
 * 2. Pone "seleccionado" solo en el clickeado
 * 3. Guarda el emoji en emojiSeleccionado
 */
function seleccionarEmoji(btn) {
    document.querySelectorAll('.ap-emoji-btn').forEach(function(b) {
        b.classList.remove('seleccionado');
    });
    btn.classList.add('seleccionado');
    emojiSeleccionado = btn.dataset.emoji;
}


// ════════════════════════════════════════════════
//  PARTE 4: VALIDACIÓN
// ════════════════════════════════════════════════

/**
 * validarFormulario()
 * ─────────────────────────────────────────────
 * Revisa TODOS los campos antes de enviar.
 * Marca en rojo los que tienen error.
 * Retorna true si todo está bien, false si hay error.
 *
 * Reglas:
 * - Nombre: obligatorio, mínimo 3 caracteres
 * - Marca: obligatoria
 * - Categoría: debe seleccionarse una opción
 * - Descripción: obligatoria, mínimo 10 caracteres
 * - Precio: obligatorio, mayor a 0, solo números
 */
function validarFormulario() {
    let hayError = false;

    // Validar NOMBRE
    const nombre = document.getElementById('ap-nombre').value.trim();
    if (nombre.length < 3) {
        marcarApError('ap-nombre', 'ap-nombre-err');
        hayError = true;
    }

    // Validar MARCA
    const marca = document.getElementById('ap-marca').value.trim();
    if (marca.length < 1) {
        marcarApError('ap-marca', 'ap-marca-err');
        hayError = true;
    }

    // Validar CATEGORÍA
    const categoria = document.getElementById('ap-categoria').value;
    if (!categoria) {
        marcarApError('ap-categoria', 'ap-categoria-err');
        hayError = true;
    }

    // Validar DESCRIPCIÓN
    const desc = document.getElementById('ap-descripcion').value.trim();
    if (desc.length < 10) {
        marcarApError('ap-descripcion', 'ap-descripcion-err');
        hayError = true;
    }

    // Validar PRECIO
    const precio = parseFloat(document.getElementById('ap-precio').value);
    if (isNaN(precio) || precio <= 0) {
        marcarApError('ap-precio', 'ap-precio-err');
        hayError = true;
    }

    return !hayError;  // true = sin errores, false = hay errores
}


/**
 * marcarApError(inputId, errId)
 * ─────────────────────────────────────────────
 * Pone borde rojo en el input y muestra el
 * mensaje de error debajo del campo.
 */
function marcarApError(inputId, errId) {
    document.getElementById(inputId).classList.add('invalido');
    document.getElementById(errId).classList.add('visible');
}


/**
 * limpiarApErr(input)
 * ─────────────────────────────────────────────
 * Quita el borde rojo y el mensaje de error
 * cuando el usuario empieza a escribir en el campo.
 * Se llama con oninput en cada campo del HTML.
 */
function limpiarApErr(input) {
    input.classList.remove('invalido');
    // Ocultar el mensaje de error del campo
    const errId = input.id + '-err';
    const err   = document.getElementById(errId);
    if (err) err.classList.remove('visible');
}


// ════════════════════════════════════════════════
//  PARTE 5: GUARDAR EN LA BASE DE DATOS
// ════════════════════════════════════════════════

/**
 * guardarProducto()
 * ─────────────────────────────────────────────
 * Función principal. Se llama al hacer clic en
 * "Guardar Producto".
 *
 * Paso a paso:
 * 1. Validar el formulario (si hay errores, parar)
 * 2. Recoger los valores de todos los campos
 * 3. Recoger las specs de las filas dinámicas
 * 4. Armar un objeto JSON con todos los datos
 * 5. Enviar ese JSON a guardar_producto.php con fetch()
 * 6. Si PHP responde ok:true → cerrar el form y
 *    recargar las tarjetas llamando a cargarProductos()
 *    (función de app.js — no borra productos existentes,
 *    solo vuelve a leerlos todos de la BD)
 * 7. Si PHP responde ok:false → mostrar el error
 */
async function guardarProducto() {
    // ── PASO 1: Validar campos ──────────────────
    ocultarApAlerta();
    if (!validarFormulario()) {
        mostrarApAlerta('error', '❌ Corrige los campos marcados en rojo antes de guardar.');
        return;
    }

    // ── PASO 2: Recoger valores de los campos ───
    const nombre      = document.getElementById('ap-nombre').value.trim();
    const marca       = document.getElementById('ap-marca').value.trim();
    const categoria   = document.getElementById('ap-categoria').value;
    const descripcion = document.getElementById('ap-descripcion').value.trim();
    const precio      = parseFloat(document.getElementById('ap-precio').value);
    const precioAntes = document.getElementById('ap-precio-antes').value;
    const badge       = document.getElementById('ap-badge').value;

    // ── PASO 3: Recoger las especificaciones ────
    // Leemos TODAS las filas de specs que el usuario llenó
    const specs = [];
    const filas = document.querySelectorAll('.ap-spec-fila');

    filas.forEach(function(fila) {
        const nombre_spec = fila.querySelector('.spec-nombre').value.trim();
        const valor_spec  = fila.querySelector('.spec-valor').value.trim();

        // Solo incluir si ambos campos tienen algo
        if (nombre_spec && valor_spec) {
            specs.push({ l: nombre_spec, v: valor_spec });
        }
    });

    // ── PASO 4: Armar el objeto con todos los datos ──
    const nuevoProducto = {
        nombre:       nombre,
        marca:        marca,
        categoria:    categoria,   // ej: "laptop"
        descripcion:  descripcion,
        precio:       precio,
        precio_antes: precioAntes || null,
        emoji:        emojiSeleccionado,
        badge:        badge || null,
        specs:        specs         // Array de {l, v}
    };

    // ── PASO 5: Enviar a guardar_producto.php ───
const btn = document.getElementById('ap-btn-guardar');
btn.disabled    = true;
btn.textContent = '⏳ Guardando...';

try {
    // Usar FormData para poder enviar la imagen
    const formData = new FormData();
    formData.append('nombre',       nombre);
    formData.append('marca',        marca);
    formData.append('categoria',    categoria);
    formData.append('descripcion',  descripcion);
    formData.append('precio',       precio);
    formData.append('precio_antes', precioAntes || '');
    formData.append('emoji',        emojiSeleccionado);
    formData.append('badge',        badge || '');
    formData.append('specs',        JSON.stringify(specs));

    // Agregar imagen si el usuario eligió una
    const inputImagen = document.getElementById('ap-imagen');
    if (inputImagen && inputImagen.files[0]) {
        formData.append('imagen', inputImagen.files[0]);
    }

    const respuesta = await fetch('guardar_producto.php', {
        method: 'POST',
        body:   formData   // Sin Content-Type, el navegador lo pone solo
    });

    const resultado = await respuesta.json();

    if (resultado.ok) {
        mostrarApAlerta('exito', '✅ ' + resultado.msg);
        setTimeout(function() {
            cerrarFormProducto();
            if (typeof cargarProductos === 'function') {
                cargarProductos();
            }
        }, 1500);
    } else {
        mostrarApAlerta('error', '❌ ' + resultado.msg);
        btn.disabled    = false;
        btn.textContent = '💾 Guardar Producto en la Base de Datos';
    }

} catch (error) {
    mostrarApAlerta('error', '❌ No se pudo conectar al servidor.');
    btn.disabled    = false;
    btn.textContent = '💾 Guardar Producto en la Base de Datos';
}
}


// ════════════════════════════════════════════════
//  FUNCIONES DE ALERTA (dentro del formulario)
// ════════════════════════════════════════════════

/**
 * mostrarApAlerta(tipo, mensaje)
 * Muestra un mensaje de éxito o error dentro del modal.
 * tipo: 'error' o 'exito'
 */
function mostrarApAlerta(tipo, mensaje) {
    const alerta = document.getElementById('ap-alerta');
    alerta.className = 'ap-alerta visible ' + tipo;
    alerta.innerHTML = mensaje;
    // Hacer scroll hacia arriba para que sea visible
    alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * ocultarApAlerta()
 * Oculta cualquier alerta que esté visible.
 */
function ocultarApAlerta() {
    const alerta = document.getElementById('ap-alerta');
    alerta.className = 'ap-alerta';
    alerta.innerHTML = '';
}
// Vista previa de la imagen antes de guardar
function previsualizarImagen(input) {
    const preview    = document.getElementById('ap-imagen-preview');
    const previewImg = document.getElementById('ap-preview-img');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src    = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.style.display = 'none';
    }
}