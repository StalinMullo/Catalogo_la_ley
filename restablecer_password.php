<?php
// ================================================
//  restablecer_password.php
//  Verifica el código y guarda la nueva contraseña
// ================================================

header('Content-Type: application/json; charset=utf-8');
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
    exit;
}

$data      = json_decode(file_get_contents('php://input'), true);
$correo    = trim($data['correo']   ?? '');
$codigo    = trim($data['codigo']   ?? '');
$nueva     = $data['nueva']         ?? '';
$confirma  = $data['confirma']      ?? '';

// Validaciones
if (empty($correo) || empty($codigo) || empty($nueva) || empty($confirma)) {
    echo json_encode(['success' => false, 'mensaje' => 'Todos los campos son obligatorios.']);
    exit;
}

if (strlen($nueva) < 6) {
    echo json_encode(['success' => false, 'campo' => 'nueva', 'mensaje' => 'La contraseña debe tener mínimo 6 caracteres.']);
    exit;
}

if ($nueva !== $confirma) {
    echo json_encode(['success' => false, 'campo' => 'confirma', 'mensaje' => 'Las contraseñas no coinciden.']);
    exit;
}

// Buscar usuario y verificar código
$stmt = $conexion->prepare("SELECT id, codigo_verificacion, codigo_expira FROM usuarios WHERE correo = ?");
$stmt->bind_param("s", $correo);
$stmt->execute();
$usuario = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$usuario) {
    echo json_encode(['success' => false, 'mensaje' => 'Usuario no encontrado.']);
    $conexion->close();
    exit;
}

// Verificar que el código no haya expirado
if (new DateTime() > new DateTime($usuario['codigo_expira'])) {
    echo json_encode(['success' => false, 'mensaje' => 'El código expiró. Solicita uno nuevo.']);
    $conexion->close();
    exit;
}

// Verificar que el código sea correcto
if ($codigo !== $usuario['codigo_verificacion']) {
    echo json_encode(['success' => false, 'campo' => 'codigo', 'mensaje' => 'Código incorrecto.']);
    $conexion->close();
    exit;
}

// Guardar nueva contraseña y limpiar código
$nuevoHash = password_hash($nueva, PASSWORD_BCRYPT);
$upd = $conexion->prepare("UPDATE usuarios SET contrasena = ?, codigo_verificacion = NULL, codigo_expira = NULL WHERE id = ?");
$upd->bind_param("si", $nuevoHash, $usuario['id']);
$upd->execute();
$upd->close();
$conexion->close();

echo json_encode([
    'success' => true,
    'mensaje' => '¡Contraseña restablecida correctamente! Ya puedes iniciar sesión.'
]);
?>