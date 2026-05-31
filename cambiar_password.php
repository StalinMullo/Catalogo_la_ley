<?php
// ================================================
//  cambiar_password.php
//  Recibe la contraseña actual y la nueva,
//  verifica que la actual sea correcta y
//  guarda la nueva en la base de datos.
// ================================================

header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'conexion.php';

// Verificar que haya sesión activa
if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['ok' => false, 'msg' => 'No has iniciado sesión.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'msg' => 'Método no permitido.']);
    exit;
}

// Leer datos enviados
$data         = json_decode(file_get_contents('php://input'), true);
$passActual   = $data['pass_actual']  ?? '';
$passNueva    = $data['pass_nueva']   ?? '';
$passConfirma = $data['pass_confirma'] ?? '';

// Validaciones
if (empty($passActual) || empty($passNueva) || empty($passConfirma)) {
    echo json_encode(['ok' => false, 'msg' => 'Todos los campos son obligatorios.']);
    exit;
}

if (strlen($passNueva) < 6) {
    echo json_encode(['ok' => false, 'msg' => 'La nueva contraseña debe tener mínimo 6 caracteres.']);
    exit;
}

if ($passNueva !== $passConfirma) {
    echo json_encode(['ok' => false, 'msg' => 'Las contraseñas nuevas no coinciden.']);
    exit;
}

// Buscar usuario en la BD
$stmt = $conexion->prepare("SELECT id, contrasena FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $_SESSION['usuario_id']);
$stmt->execute();
$usuario = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$usuario) {
    echo json_encode(['ok' => false, 'msg' => 'Usuario no encontrado.']);
    exit;
}

// Verificar que la contraseña actual sea correcta
if (!password_verify($passActual, $usuario['contrasena'])) {
    echo json_encode(['ok' => false, 'msg' => 'La contraseña actual es incorrecta.']);
    exit;
}

// Guardar la nueva contraseña con hash
$nuevoHash = password_hash($passNueva, PASSWORD_BCRYPT);
$upd = $conexion->prepare("UPDATE usuarios SET contrasena = ? WHERE id = ?");
$upd->bind_param("si", $nuevoHash, $_SESSION['usuario_id']);
$upd->execute();
$upd->close();
$conexion->close();

echo json_encode([
    'ok'  => true,
    'msg' => '¡Contraseña actualizada correctamente!'
]);
?>