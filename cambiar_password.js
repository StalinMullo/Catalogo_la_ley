// ================================================
//  cambiar_password.js
//  Controla el modal para cambiar contraseña
// ================================================


// ------------------------------------------------
//  ABRIR MODAL
// ------------------------------------------------
function abrirCambiarPassword() {
    // Cerrar Mi Cuenta primero
    document.getElementById('mc-overlay').classList.remove('abierto');

    // Limpiar campos y alertas
    document.getElementById('cp-actual').value    = '';
    document.getElementById('cp-nueva').value     = '';
    document.getElementById('cp-confirma').value  = '';

    document.querySelectorAll('.cp-grupo input').forEach(function(i) {
        i.classList.remove('invalido');
    });

    ocultarCpAlerta();

    // Rehabilitar botón
    const btn = document.getElementById('cp-btn-guardar');
    btn.disabled    = false;
    btn.textContent = '🔑 Cambiar Contraseña';

    // Mostrar modal
    document.getElementById('cp-overlay').classList.add('abierto');
    document.body.style.overflow = 'hidden';
}


// ------------------------------------------------
//  CERRAR MODAL
// ------------------------------------------------
function cerrarCambiarPassword(e) {
    if (e === true) {
        document.getElementById('cp-overlay').classList.remove('abierto');
        document.body.style.overflow = '';
        return;
    }
    if (e && e.target === document.getElementById('cp-overlay')) {
        document.getElementById('cp-overlay').classList.remove('abierto');
        document.body.style.overflow = '';
    }
}


// ------------------------------------------------
//  GUARDAR NUEVA CONTRASEÑA
// ------------------------------------------------
async function guardarNuevaPassword() {
    ocultarCpAlerta();

    const actual   = document.getElementById('cp-actual').value;
    const nueva    = document.getElementById('cp-nueva').value;
    const confirma = document.getElementById('cp-confirma').value;

    // Limpiar errores anteriores
    document.querySelectorAll('.cp-grupo input').forEach(function(i) {
        i.classList.remove('invalido');
    });

    // Validaciones
    let hayError = false;

    if (!actual) {
        document.getElementById('cp-actual').classList.add('invalido');
        hayError = true;
    }
    if (!nueva || nueva.length < 6) {
        document.getElementById('cp-nueva').classList.add('invalido');
        hayError = true;
    }
    if (!confirma || nueva !== confirma) {
        document.getElementById('cp-confirma').classList.add('invalido');
        hayError = true;
    }

    if (hayError) {
        mostrarCpAlerta('error', '❌ Corrige los campos marcados.');
        return;
    }

    // Enviar al servidor
    const btn = document.getElementById('cp-btn-guardar');
    btn.disabled    = true;
    btn.textContent = '⏳ Guardando...';

    try {
        const res = await fetch('cambiar_password.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                pass_actual:   actual,
                pass_nueva:    nueva,
                pass_confirma: confirma
            })
        });

        const data = await res.json();

        if (data.ok) {
            mostrarCpAlerta('exito', '✅ ' + data.msg);
            // Cerrar el modal después de 2 segundos
            setTimeout(function() {
                cerrarCambiarPassword(true);
            }, 2000);
        } else {
            mostrarCpAlerta('error', '❌ ' + data.msg);
            btn.disabled    = false;
            btn.textContent = '🔑 Cambiar Contraseña';
        }

    } catch (e) {
        mostrarCpAlerta('error', '❌ No se pudo conectar al servidor.');
        btn.disabled    = false;
        btn.textContent = '🔑 Cambiar Contraseña';
    }
}


// ------------------------------------------------
//  MOSTRAR / OCULTAR ALERTA
// ------------------------------------------------
function mostrarCpAlerta(tipo, msg) {
    const alerta = document.getElementById('cp-alerta');
    alerta.className = 'cp-alerta visible ' + tipo;
    alerta.innerHTML = msg;
}

function ocultarCpAlerta() {
    const alerta = document.getElementById('cp-alerta');
    alerta.className = 'cp-alerta';
    alerta.innerHTML = '';
}
function togglePass(inputId, icono) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type  = 'text';
        icono.textContent = '🙈';
    } else {
        input.type  = 'password';
        icono.textContent = '👁️';
    }
}