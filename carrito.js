
function leerCarrito() {
    const datos = localStorage.getItem('carrito_laley');
    return datos ? JSON.parse(datos) : [];
}


function guardarCarrito(carrito) {
    localStorage.setItem('carrito_laley', JSON.stringify(carrito));
}


let carrito = leerCarrito();



function agregarAlCarrito(producto) {
    carrito = leerCarrito(); 

    
    const existente = carrito.find(function(item) {
        return item.id === producto.id;
    });

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

    guardarCarrito(carrito);
    actualizarBadgeHeader();
    renderCarrito();
}

function eliminarProducto(id) {
    carrito = carrito.filter(function(item) {
        return item.id !== id;
    });
    guardarCarrito(carrito);
    renderCarrito();
}



function aumentarCantidad(id) {
    const item = carrito.find(function(i) { return i.id === id; });
    if (item) {
        item.cantidad += 1;
        guardarCarrito(carrito);
        renderCarrito();
    }
}



function disminuirCantidad(id) {
    const item = carrito.find(function(i) { return i.id === id; });
    if (item) {
        item.cantidad -= 1;
        if (item.cantidad <= 0) {
            eliminarProducto(id);
            return;
        }
        guardarCarrito(carrito);
        renderCarrito();
    }
}



function vaciarCarrito() {
    if (carrito.length === 0) return;

    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        carrito = [];
        guardarCarrito(carrito);
        renderCarrito();
    }
}



function calcularTotales() {
    
    const subtotal = carrito.reduce(function(suma, item) {
        return suma + (item.precio * item.cantidad);
    }, 0);

    const iva      = subtotal * 0.15;   
    const envio    = 0;                 
    const total    = subtotal + iva + envio;

    return { subtotal, iva, envio, total };
}

function renderCarrito() {
    const lista    = document.getElementById('lista-carrito');
    const btnVaciar = document.getElementById('btn-vaciar');
    const btnPagar  = document.getElementById('btn-pagar');
    const contador  = document.getElementById('contador-items');

    const totalItems = carrito.reduce(function(s, i) { return s + i.cantidad; }, 0);
    contador.textContent = totalItems + (totalItems === 1 ? ' producto' : ' productos');

    if (carrito.length === 0) {
        lista.innerHTML = `
            <div class="carrito-vacio">
                <div class="vacio-icono">🛒</div>
                <h3>Tu carrito está vacío</h3>
                <p>Todavía no has agregado ningún producto.<br/>Explora el catálogo y encuentra lo que necesitas.</p>
                <a href="index.html" class="btn-ir-catalogo">Ver catálogo de productos</a>
            </div>`;

        btnVaciar.style.display = 'none';
        btnPagar.disabled = true;
        btnPagar.textContent = '💳 Proceder al Pago';

        document.getElementById('r-subtotal').textContent = '$0.00';
        document.getElementById('r-iva').textContent      = '$0.00';
        document.getElementById('r-total').textContent    = '$0.00';
        return;
    }

    lista.innerHTML = carrito.map(function(item) {
        const subtotalItem = (item.precio * item.cantidad).toFixed(2);
        return `
            <div class="item-carrito" id="item-${item.id}">

                <!-- Emoji del producto -->
                <div class="item-emoji">${item.emoji}</div>

                <!-- Información del producto -->
                <div class="item-info">
                    <div class="item-categoria">${(item.categoria || '').toUpperCase()}</div>
                    <div class="item-nombre">${item.nombre}</div>
                    <div class="item-precio-unitario">Precio unitario: $${item.precio.toFixed(2)}</div>

                    <!-- Controles de cantidad: − cantidad + -->
                    <div class="item-controles">
                        <button class="btn-cantidad" onclick="disminuirCantidad(${item.id})" title="Disminuir">−</button>
                        <span class="item-cantidad">${item.cantidad}</span>
                        <button class="btn-cantidad" onclick="aumentarCantidad(${item.id})" title="Aumentar">+</button>
                    </div>
                </div>

                <!-- Subtotal y botón eliminar -->
                <div class="item-acciones">
                    <div class="item-subtotal">
                        $${subtotalItem}
                        <small>USD</small>
                    </div>
                    <button class="btn-eliminar" onclick="eliminarProducto(${item.id})">
                        🗑️ Eliminar
                    </button>
                </div>

            </div>`;
    }).join('');

    
    btnVaciar.style.display = 'inline-block';
    btnPagar.disabled = false;
    btnPagar.textContent = '💳 Proceder al Pago';

    // ── Actualizar totales en el resumen ──
    const t = calcularTotales();
    document.getElementById('r-subtotal').textContent = '$' + t.subtotal.toFixed(2);
    document.getElementById('r-iva').textContent      = '$' + t.iva.toFixed(2);
    document.getElementById('r-total').textContent    = '$' + t.total.toFixed(2);
}

function actualizarBadgeHeader() {
    
    const badge = document.getElementById('carrito-badge');
    if (!badge) return;

    const total = carrito.reduce(function(s, i) { return s + i.cantidad; }, 0);
    badge.textContent = total;
    if (total > 0) badge.classList.add('visible');
    else badge.classList.remove('visible');
}




function abrirPago() {
    if (carrito.length === 0) return;

    
    const t = calcularTotales();
    let html = carrito.map(function(item) {
        return `<div class="pago-resumen-item">
            <span>${item.emoji} ${item.nombre}${item.cantidad > 1 ? ' ×' + item.cantidad : ''}</span>
            <span>$${(item.precio * item.cantidad).toFixed(2)}</span>
        </div>`;
    }).join('');

    html += `<div class="pago-resumen-item">
        <span>IVA (15%)</span>
        <span>$${t.iva.toFixed(2)}</span>
    </div>`;

    html += `<div class="pago-resumen-total">
        <span>TOTAL A PAGAR</span>
        <span>$${t.total.toFixed(2)}</span>
    </div>`;

    document.getElementById('pago-resumen').innerHTML = html;

    document.getElementById('pago-overlay').classList.add('abierto');
    document.body.style.overflow = 'hidden';
}

function cerrarPago(e) {
    const overlay = document.getElementById('pago-overlay');
    if (e === true || e.target === overlay) {
        overlay.classList.remove('abierto');
        document.body.style.overflow = '';
    }
}



function confirmarPedido() {
   
    const nombre    = document.getElementById('p-nombre');
    const telefono  = document.getElementById('p-telefono');
    const correo    = document.getElementById('p-correo');
    const direccion = document.getElementById('p-direccion');
    const metodo    = document.getElementById('p-metodo');

    
    [nombre, telefono, correo, direccion, metodo].forEach(function(campo) {
        campo.classList.remove('error');
    });

   
    let hayError = false;

    if (!nombre.value.trim()) {
        nombre.classList.add('error');
        hayError = true;
    }
    if (!telefono.value.trim()) {
        telefono.classList.add('error');
        hayError = true;
    }
    if (!correo.value.trim() || !correo.value.includes('@')) {
        correo.classList.add('error');
        hayError = true;
    }
    if (!direccion.value.trim()) {
        direccion.classList.add('error');
        hayError = true;
    }
    if (!metodo.value) {
        metodo.classList.add('error');
        hayError = true;
    }

    
    if (hayError) {
        alert('⚠️ Por favor completa todos los campos marcados en rojo.');
        return;
    }

    
    const t = calcularTotales();


    document.getElementById('pago-overlay').classList.remove('abierto');

    const metodosTexto = {
        tarjeta:       '💳 Tarjeta de crédito/débito',
        transferencia: '🏦 Transferencia bancaria',
        efectivo:      '💵 Pago en efectivo'
    };

    document.getElementById('exito-mensaje').innerHTML = `
        Hola <strong>${nombre.value}</strong>, tu pedido por
        <strong>$${t.total.toFixed(2)}</strong> ha sido registrado.<br/><br/>
        Te contactaremos al <strong>${telefono.value}</strong> para coordinar
        la entrega en <strong>${direccion.value}</strong>.<br/><br/>
        Método de pago: ${metodosTexto[metodo.value]}<br/>
        ¡Gracias por comprar en <strong>LA LEY</strong>! 🎉
    `;

    document.getElementById('exito-overlay').classList.add('abierto');

    carrito = [];
    guardarCarrito(carrito);
    document.body.style.overflow = '';
}

renderCarrito();