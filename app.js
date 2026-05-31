// ================================================
//  app.js — VERSIÓN CON BASE DE DATOS MYSQL
//  Ahora los productos vienen del servidor PHP,
//  no están escritos a mano en el código.
// ================================================


// ------------------------------------------------
//  ESTADO (variables de los filtros activos)
// ------------------------------------------------
let filtroCategoria = 'todos';
let filtroPrecio    = 'todos';
let textoBusqueda   = '';
let ordenActual     = 'default';

// Lista de productos cargados desde la base de datos
let productos = [];


// ------------------------------------------------
//  CARGAR PRODUCTOS DESDE EL SERVIDOR (PHP + MySQL)
//  Esta función se llama al abrir la página.
//  fetch() hace una petición HTTP al archivo PHP.
// ------------------------------------------------
async function cargarProductos() {
    try {
        // Mostrar mensaje de carga mientras esperamos
        document.getElementById('grid').innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px; color:#aaa;">
                ⏳ Cargando productos...
            </div>`;

        // Llamar al archivo PHP (que consulta MySQL)
        const respuesta = await fetch('productos.php');

        // Convertir la respuesta de texto a objeto JavaScript
        const datos = await respuesta.json();

        // Verificar si hubo error
        if (datos.error) {
            mostrarError(datos.mensaje);
            return;
        }

        // Guardar los productos en nuestra variable global
        productos = datos.productos;

        // Actualizar el contador de estadísticas
        document.getElementById('st-total').textContent = datos.total;

        // Dibujar las tarjetas en pantalla
        render();

    } catch (error) {
        // Este error ocurre si PHP no responde (XAMPP no está corriendo)
        mostrarError('No se pudo conectar al servidor. ¿Está XAMPP encendido?');
        console.error('Error:', error);
    }
}


// ------------------------------------------------
//  MOSTRAR ERROR EN PANTALLA
// ------------------------------------------------
function mostrarError(mensaje) {
    document.getElementById('grid').innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px; color:#e31e24;">
            <div style="font-size:3rem; margin-bottom:16px;">⚠️</div>
            <p style="font-size:1.1rem;">${mensaje}</p>
            <p style="margin-top:8px; color:#aaa; font-size:0.85rem;">
                Verifica que XAMPP esté corriendo y que la base de datos esté creada.
            </p>
        </div>`;
}


// ------------------------------------------------
//  RENDER — Dibuja las tarjetas filtradas
// ------------------------------------------------
function render() {
    let lista = [...productos];

    if (filtroCategoria !== 'todos') {
        lista = lista.filter(function(p) { return p.categoria === filtroCategoria; });
    }
    if (filtroPrecio === 'bajo')  lista = lista.filter(function(p) { return p.precio <= 500; });
    if (filtroPrecio === 'medio') lista = lista.filter(function(p) { return p.precio > 500 && p.precio <= 1000; });
    if (filtroPrecio === 'alto')  lista = lista.filter(function(p) { return p.precio > 1000; });

    if (textoBusqueda !== '') {
        const q = textoBusqueda.toLowerCase();
        lista = lista.filter(function(p) {
            return (
                p.nombre.toLowerCase().includes(q) ||
                p.marca.toLowerCase().includes(q)  ||
                p.desc.toLowerCase().includes(q)
            );
        });
    }

    if (ordenActual === 'precio-asc')  lista.sort(function(a, b) { return a.precio - b.precio; });
    if (ordenActual === 'precio-desc') lista.sort(function(a, b) { return b.precio - a.precio; });
    if (ordenActual === 'nombre')      lista.sort(function(a, b) { return a.nombre.localeCompare(b.nombre); });

    document.getElementById('n-resultados').textContent = lista.length;

    const grid     = document.getElementById('grid');
    const noResult = document.getElementById('no-result');

    if (lista.length === 0) {
        grid.innerHTML = '';
        noResult.style.display = 'block';
        return;
    }
    noResult.style.display = 'none';

    grid.innerHTML = lista.map(function(p) {
        const chips = (p.specs || []).slice(0, 3).map(function(s) {
            return '<span class="spec-chip">' + s.v + '</span>';
        }).join('');

        let badgeHtml = '';
        if (p.badge === 'oferta') badgeHtml = '<div class="badge oferta">🔥 Oferta</div>';
        else if (p.badge === 'nuevo') badgeHtml = '<div class="badge nuevo">✨ Nuevo</div>';

        let precioHtml = '';
        if (p.precioAntes) {
            precioHtml = '<div><div class="antes">$' + p.precioAntes.toLocaleString() + '</div>$' + p.precio.toLocaleString() + '<small>USD</small></div>';
        } else {
            precioHtml = '<div class="precio">$' + p.precio.toLocaleString() + '<small>USD</small></div>';
        }

       const imgHtml = p.imagen
    ? `<img src="${p.imagen}" alt="${p.nombre}" style="width:100%; height:100%; object-fit:cover; border-radius:0;"/>`
    : p.emoji;

return `
    <div class="card" onclick="abrirModal(${p.id})">
        ${badgeHtml}
        <div class="card-img">${imgHtml}</div>
                <div class="card-body">
                    <div class="card-cat">${p.categoria.toUpperCase()}</div>
                    <div class="card-nombre">${p.nombre}</div>
                    <div class="card-desc">${p.desc}</div>
                    <div class="card-specs">${chips}</div>
                    <div class="card-footer">
                        ${precioHtml}
                        <button class="btn-carrito-rapido" onclick="event.stopPropagation(); agregarAlCarrito(${p.id})">🛒</button>
                        <button class="btn-ver">Ver más</button>
                        ${esAdmin() ? `
                        <button class="btn-editar-prod" onclick="event.stopPropagation(); abrirEditar(${p.id})" title="Editar">✏️</button>
                        <button class="btn-eliminar-prod" onclick="event.stopPropagation(); eliminarProducto(${p.id}, '${p.nombre.replace(/'/g, "\\'")}')" title="Eliminar">🗑️</button>
                        ` : ''}
                    </div>
                </div>
            </div>`;
    }).join('');
}


// ------------------------------------------------
//  FILTROS Y ORDEN
// ------------------------------------------------
function filtrarCategoria(cat, btn) {
    filtroCategoria = cat;
    document.querySelectorAll('nav button').forEach(function(b) { b.classList.remove('activo'); });
    if (btn) btn.classList.add('activo');
    render();
}

function filtrarPrecio(rango, btn) {
    filtroPrecio = rango;
    document.querySelectorAll('.filtros-bar button').forEach(function(b) { b.classList.remove('activo'); });
    if (btn) btn.classList.add('activo');
    render();
}

function buscar(val)  { textoBusqueda = val;  render(); }
function ordenar(val) { ordenActual   = val;  render(); }


// ------------------------------------------------
//  MODAL
// ------------------------------------------------
function abrirModal(id) {
    productoEnModal = productos.find(function(x) { return x.id === id; });
    const p = productos.find(function(x) { return x.id === id; });
    if (!p) return;

    document.getElementById('m-nombre').innerHTML = p.nombre.replace(/ ([^ ]+)$/, ' <span>$1</span>');
    const modalImg = document.getElementById('m-emoji');
if (p.imagen) {
    modalImg.innerHTML = `<img src="${p.imagen}" alt="${p.nombre}" 
        style="width:100%; height:100%; object-fit:contain; border-radius:8px;"/>`;
} else {
    modalImg.textContent = p.emoji;
}
    document.getElementById('m-cat').textContent    = p.categoria.toUpperCase() + ' · ' + p.marca;
    document.getElementById('m-desc').textContent   = p.desc;
    document.getElementById('m-precio').textContent = '$' + p.precio.toLocaleString();

    document.getElementById('m-specs').innerHTML = (p.specs || []).map(function(s) {
        return `<div class="spec-item"><div class="s-lbl">${s.l}</div><div class="s-val">${s.v}</div></div>`;
    }).join('');

    document.getElementById('overlay').classList.add('abierto');
    document.body.style.overflow = 'hidden';
}

function cerrarModal(e) {
    const overlay = document.getElementById('overlay');
    if (e === true || e.target === overlay) {
        overlay.classList.remove('abierto');
        document.body.style.overflow = '';
    }
}


// ------------------------------------------------
//  INICIO: Cargar productos desde PHP + MySQL
// ------------------------------------------------
cargarProductos();

// ================================================
//  CARRITO — INTEGRACIÓN CON carrito.html
//  Los productos se guardan en localStorage para
//  que carrito.html los pueda leer.
// ================================================

// Variable para saber qué producto está abierto en el modal
let productoEnModal = null;


// ------------------------------------------------
//  AGREGAR PRODUCTO AL CARRITO
//  Guarda en localStorage y actualiza el badge
// ------------------------------------------------
function agregarAlCarrito(id) {
    const producto = productos.find(function(p) { return p.id === id; });
    if (!producto) return;

    // Leer el carrito actual desde localStorage
    let carrito = [];
    const datos = localStorage.getItem('carrito_laley');
    if (datos) carrito = JSON.parse(datos);

    // Ver si el producto ya está en el carrito
    const existente = carrito.find(function(item) { return item.id === id; });

    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({
            id:        producto.id,
            nombre:    producto.nombre,
            precio:    producto.precio,
            emoji:     producto.emoji,
            categoria: producto.categoria,
            cantidad:  1
        });
    }

    // Guardar el carrito actualizado
    localStorage.setItem('carrito_laley', JSON.stringify(carrito));

    // Actualizar el badge del botón
    actualizarBadge();

    // Mostrar notificación
    mostrarToast('✅ ' + producto.nombre + ' agregado al carrito');
}


// ------------------------------------------------
//  AGREGAR DESDE EL MODAL
// ------------------------------------------------
function agregarAlCarritoDesdeModal() {
    if (productoEnModal) {
        agregarAlCarrito(productoEnModal.id);
    }
}


// ------------------------------------------------
//  ACTUALIZAR EL BADGE (número amarillo del botón)
// ------------------------------------------------
function actualizarBadge() {
    const badge = document.getElementById('carrito-badge');
    if (!badge) return;

    const datos = localStorage.getItem('carrito_laley');
    const carrito = datos ? JSON.parse(datos) : [];

    // Sumar todas las cantidades
    const total = carrito.reduce(function(suma, item) {
        return suma + item.cantidad;
    }, 0);

    badge.textContent = total;

    if (total > 0) badge.classList.add('visible');
    else           badge.classList.remove('visible');
}


// ------------------------------------------------
//  IR AL CARRITO — abre carrito.html
// ------------------------------------------------
function irAlCarrito() {
    window.location.href = 'carrito.html';
}


// ------------------------------------------------
//  TOAST — Notificación pequeña al agregar
// ------------------------------------------------
function mostrarToast(mensaje) {
    // Quitar toast anterior si existe
    const anterior = document.getElementById('toast-msg');
    if (anterior) anterior.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.textContent = mensaje;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #1e1e1e;
        color: white;
        border: 1px solid #e31e24;
        padding: 13px 26px;
        border-radius: 10px;
        font-family: Barlow, sans-serif;
        font-size: 0.92rem;
        font-weight: 600;
        z-index: 999;
        box-shadow: 0 6px 24px rgba(0,0,0,0.6);
        pointer-events: none;
    `;
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.style.transition = 'opacity 0.4s';
        toast.style.opacity = '0';
        setTimeout(function() { toast.remove(); }, 400);
    }, 2500);
}


// ------------------------------------------------
//  Al cargar la página actualizar el badge
//  (por si el usuario ya tenía cosas en el carrito)
// ------------------------------------------------
actualizarBadge();
// Verificar si el usuario logueado es admin
function verificarRolAdmin() {
    const btn = document.getElementById('btn-agregar-flotante');
    if (!btn) return;

    // El rol se guarda en localStorage cuando hace login
    const sesion = localStorage.getItem('sesion_laley');
    if (!sesion) return;

    const datos = JSON.parse(sesion);
    if (datos.rol === 'admin') {
        btn.style.display = 'flex';
    }
}

verificarRolAdmin();
  
// ------------------------------------------------
//  CERRAR SESIÓN
// ------------------------------------------------
function cerrarSesion() {
    localStorage.removeItem('sesion_laley');
    localStorage.removeItem('usuario_nombre');
    localStorage.removeItem('usuario_correo');
    window.location.href = 'auth.html';
}

// Mostrar botón cerrar sesión si hay sesión activa
function verificarSesion() {
    const btn = document.getElementById('btn-cerrar-sesion');
    if (!btn) return;
    const sesion = localStorage.getItem('sesion_laley');
    if (sesion) {
        btn.style.display = 'flex';
    }
}

verificarSesion();
// Verificar si el usuario es admin
function esAdmin() {
    const sesion = localStorage.getItem('sesion_laley');
    if (!sesion) return false;
    return JSON.parse(sesion).rol === 'admin';
}