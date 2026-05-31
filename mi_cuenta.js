// ================================================
//  mi_cuenta.js
//  Controla el modal de "Mi Cuenta"
//
//  FUNCIONES:
//  - abrirMiCuenta()       → abre el modal y llena los datos
//  - cerrarMiCuenta()      → cierra el modal
//  - verificarSesionCuenta() → muestra el botón si hay sesión
// ================================================


// ------------------------------------------------
//  ABRIR EL MODAL DE MI CUENTA
//  Lee los datos guardados en localStorage
//  y los muestra en el modal
// ------------------------------------------------
function abrirMiCuenta() {
    const sesion = localStorage.getItem('sesion_laley');

    // Si no hay sesión, redirigir al login
    if (!sesion) {
        window.location.href = 'auth.html';
        return;
    }

    const datos = JSON.parse(sesion);

    // Llenar saludo y correo del perfil
    document.getElementById('mc-saludo').textContent      = '¡Hola, ' + (datos.nombre || 'Usuario') + '!';
    document.getElementById('mc-correo').textContent      = datos.correo || '—';

    // Llenar grid de datos
    document.getElementById('mc-nombre').textContent      = datos.nombre || '—';
    document.getElementById('mc-correo-dato').textContent = datos.correo || '—';

    // Badge de rol (admin o cliente)
    const rolBadge = document.getElementById('mc-rol-badge');
    if (datos.rol === 'admin') {
        rolBadge.textContent = '👑 Administrador';
        rolBadge.style.background = '#c5a500';
    } else {
        rolBadge.textContent = '👤 Cliente';
        rolBadge.style.background = 'var(--gris-borde)';
        rolBadge.style.color      = 'var(--blanco)';
    }

    // Mostrar el modal
    document.getElementById('mc-overlay').classList.add('abierto');
    document.body.style.overflow = 'hidden';
}


// ------------------------------------------------
//  CERRAR EL MODAL
// ------------------------------------------------
function cerrarMiCuenta(e) {
    // Si se llama con evento, solo cerrar si se hizo clic en el fondo
    if (e && e.target !== document.getElementById('mc-overlay')) return;

    document.getElementById('mc-overlay').classList.remove('abierto');
    document.body.style.overflow = '';
}


// ------------------------------------------------
//  MOSTRAR EL BOTÓN "MI CUENTA" EN EL HEADER
//  Solo aparece si hay una sesión activa
// ------------------------------------------------
function verificarSesionCuenta() {
    const btn = document.getElementById('btn-mi-cuenta');
    if (!btn) return;

    const sesion = localStorage.getItem('sesion_laley');
    if (sesion) {
        btn.style.display = 'flex';
    }
}


// ------------------------------------------------
//  INICIALIZAR AL CARGAR LA PÁGINA
// ------------------------------------------------
verificarSesionCuenta();