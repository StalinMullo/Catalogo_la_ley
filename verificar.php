<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
    exit;
}

$data   = json_decode(file_get_contents('php://input'), true);
$correo = trim($data['correo'] ?? '');
$codigo = trim($data['codigo'] ?? '');

if (empty($correo) || empty($codigo)) {
    echo json_encode(['success' => false, 'mensaje' => 'Correo y código son requeridos.']);
    exit;
}
if (!preg_match('/^\d{6}$/', $codigo)) {
    echo json_encode(['success' => false, 'campo' => 'codigo', 'mensaje' => 'El código debe ser de 6 dígitos numéricos.']);
    exit;
}

$stmt = $conexion->prepare("SELECT id, nombre, codigo_verificacion, codigo_expira, verificado FROM usuarios WHERE correo = ?");
$stmt->bind_param("s", $correo);
$stmt->execute();
$usuario = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$usuario) {
    echo json_encode(['success' => false, 'mensaje' => 'Usuario no encontrado.']);
    $conexion->close(); exit;
}
if ($usuario['verificado'] == 1) {
    echo json_encode(['success' => true, 'mensaje' => 'Esta cuenta ya estaba verificada. Puedes iniciar sesión.']);
    $conexion->close(); exit;
}
// Verificar expiración
if (new DateTime() > new DateTime($usuario['codigo_expira'])) {
    echo json_encode(['success' => false, 'campo' => 'codigo', 'mensaje' => 'El código expiró. Regístrate de nuevo para obtener uno nuevo.']);
    $conexion->close(); exit;
}
// Verificar código
if ($codigo !== $usuario['codigo_verificacion']) {
    echo json_encode(['success' => false, 'campo' => 'codigo', 'mensaje' => 'Código incorrecto. Inténtalo de nuevo.']);
    $conexion->close(); exit;
}

// Activar cuenta
$upd = $conexion->prepare("UPDATE usuarios SET verificado = 1, codigo_verificacion = NULL, codigo_expira = NULL WHERE id = ?");
$upd->bind_param("i", $usuario['id']);
$upd->execute();
$upd->close();
$conexion->close();

echo json_encode([
    'success' => true,
    'nombre'  => $usuario['nombre'],
    'mensaje' => '¡Cuenta verificada! Ya puedes iniciar sesión.'
]);
?>