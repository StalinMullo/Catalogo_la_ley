// ================================================
//  admin_productos.js
//  Lógica para editar y eliminar productos
// ================================================


// ------------------------------------------------
//  ELIMINAR PRODUCTO
// ------------------------------------------------
async function eliminarProducto(id, nombre) {
    if (!confirm('¿Estás seguro de que quieres eliminar "' + nombre + '"?\nEsta acción no se puede deshacer.')) {
        return;
    }

    try {
        const sesion = localStorage.getItem('sesion_laley');
        const rol    = sesion ? JSON.parse(sesion).rol : '';

        const res  = await fetch('eliminar_producto.php', {
            method:  'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Rol':   rol
            },
            body: JSON.stringify({ id: id })
        });
        const data = await res.json();

        if (data.ok) {
            mostrarToast('🗑️ ' + data.msg);
            setTimeout(function() { cargarProductos(); }, 800);
        } else {
            alert('❌ ' + data.msg);
        }
    } catch(e) {
        alert('❌ No se pudo conectar al servidor.');
    }
}


// ------------------------------------------------
//  ABRIR MODAL DE EDICIÓN
// ------------------------------------------------
function abrirEditar(id) {
    const p = productos.find(function(x) { return x.id === id; });
    if (!p) return;

    // Llenar campos
    document.getElementById('ed-id').value           = p.id;
    document.getElementById('ed-nombre').value       = p.nombre;
    document.getElementById('ed-marca').value        = p.marca;
    document.getElementById('ed-categoria').value    = p.categoria;
    document.getElementById('ed-descripcion').value  = p.desc;
    document.getElementById('ed-precio').value       = p.precio;
    document.getElementById('ed-precio-antes').value = p.precioAntes || '';
    document.getElementById('ed-badge').value        = p.badge || '';

    // Imagen actual
    const preview    = document.getElementById('ed-imagen-preview');
    const previewImg = document.getElementById('ed-preview-img');
    if (p.imagen) {
        previewImg.src        = p.imagen;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }

    // Specs
    const lista = document.getElementById('ed-specs-lista');
    lista.innerHTML = '';
    (p.specs || []).forEach(function(s) {
        agregarFilaSpecEditar(s.l, s.v);
    });

    // Limpiar alerta
    const alerta = document.getElementById('ed-alerta');
    alerta.className = 'ap-alerta';
    alerta.innerHTML = '';

    // Habilitar botón
    const btn = document.getElementById('ed-btn-guardar');
    btn.disabled    = false;
    btn.textContent = '💾 Guardar Cambios';

    // Limpiar input imagen
    document.getElementById('ed-imagen').value = '';

    // Abrir modal
    document.getElementById('ed-overlay').classList.add('abierto');
    document.body.style.overflow = 'hidden';
}


// ------------------------------------------------
//  CERRAR MODAL DE EDICIÓN
// ------------------------------------------------
function cerrarEditar(e) {
    // Si se llama con true, cerrar directo
    if (e === true) {
        document.getElementById('ed-overlay').classList.remove('abierto');
        document.body.style.overflow = '';
        return;
    }
    // Si se llama con evento, solo cerrar si clic en el fondo
    if (e && e.target === document.getElementById('ed-overlay')) {
        document.getElementById('ed-overlay').classList.remove('abierto');
        document.body.style.overflow = '';
    }
}


// ------------------------------------------------
//  SPECS
// ------------------------------------------------
function agregarFilaSpecEditar(label, valor) {
    const lista = document.getElementById('ed-specs-lista');
    const fila  = document.createElement('div');
    fila.className = 'ap-spec-fila';
    fila.innerHTML =
        '<input type="text" placeholder="Ej: RAM" value="' + (label || '') + '"/>' +
        '<input type="text" placeholder="Ej: 8 GB" value="' + (valor || '') + '"/>' +
        '<button type="button" class="ap-btn-eliminar-spec" onclick="this.parentElement.remove()">✕</button>';
    lista.appendChild(fila);
}


// ------------------------------------------------
//  PREVISUALIZAR IMAGEN
// ------------------------------------------------
function previsualizarImagenEditar(input) {
    const preview    = document.getElementById('ed-imagen-preview');
    const previewImg = document.getElementById('ed-preview-img');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src        = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}


// ------------------------------------------------
//  GUARDAR CAMBIOS
// ------------------------------------------------
async function guardarEdicion() {
    const id          = document.getElementById('ed-id').value;
    const nombre      = document.getElementById('ed-nombre').value.trim();
    const marca       = document.getElementById('ed-marca').value.trim();
    const categoria   = document.getElementById('ed-categoria').value;
    const descripcion = document.getElementById('ed-descripcion').value.trim();
    const precio      = document.getElementById('ed-precio').value;
    const precioAntes = document.getElementById('ed-precio-antes').value;
    const badge       = document.getElementById('ed-badge').value;

    // Recoger specs
    const filas = document.querySelectorAll('#ed-specs-lista .ap-spec-fila');
    const specs = [];
    filas.forEach(function(fila) {
        const inputs = fila.querySelectorAll('input');
        if (inputs[0].value.trim() && inputs[1].value.trim()) {
            specs.push({ l: inputs[0].value.trim(), v: inputs[1].value.trim() });
        }
    });

    // Validar
    if (!nombre || !marca || !categoria || !descripcion || !precio) {
        mostrarEdAlerta('error', '❌ Completa todos los campos obligatorios.');
        return;
    }

    const btn = document.getElementById('ed-btn-guardar');
    btn.disabled    = true;
    btn.textContent = '⏳ Guardando...';

    try {
        const sesion = localStorage.getItem('sesion_laley');
        const rol    = sesion ? JSON.parse(sesion).rol : '';

        const formData = new FormData();
        formData.append('id',           id);
        formData.append('nombre',       nombre);
        formData.append('marca',        marca);
        formData.append('categoria',    categoria);
        formData.append('descripcion',  descripcion);
        formData.append('precio',       precio);
        formData.append('precio_antes', precioAntes || '');
        formData.append('emoji',        '🖥️');
        formData.append('badge',        badge || '');
        formData.append('specs',        JSON.stringify(specs));
        formData.append('rol',          rol);

        const inputImagen = document.getElementById('ed-imagen');
        if (inputImagen && inputImagen.files[0]) {
            formData.append('imagen', inputImagen.files[0]);
        }

        const res  = await fetch('editar_producto.php', {
            method: 'POST',
            body:   formData
        });
        const data = await res.json();

        if (data.ok) {
            mostrarEdAlerta('exito', '✅ ' + data.msg);
            setTimeout(function() {
                cerrarEditar(true);
                cargarProductos();
            }, 1500);
        } else {
            mostrarEdAlerta('error', '❌ ' + data.msg);
            btn.disabled    = false;
            btn.textContent = '💾 Guardar Cambios';
        }
    } catch(e) {
        mostrarEdAlerta('error', '❌ No se pudo conectar al servidor.');
        btn.disabled    = false;
        btn.textContent = '💾 Guardar Cambios';
    }
}


// ------------------------------------------------
//  ALERTA
// ------------------------------------------------
function mostrarEdAlerta(tipo, msg) {
    const alerta = document.getElementById('ed-alerta');
    alerta.className = 'ap-alerta visible ' + tipo;
    alerta.innerHTML = msg;
}


// ------------------------------------------------
//  VERIFICAR SI ES ADMIN
// ------------------------------------------------
function esAdmin() {
    const sesion = localStorage.getItem('sesion_laley');
    if (!sesion) return false;
    return JSON.parse(sesion).rol === 'admin';
}