<?php
// ================================================
//  recuperar_password.php
//  Genera un código de recuperación y lo guarda
//  en la BD. En local se devuelve en la respuesta.
// ================================================

header('Content-Type: application/json; charset=utf-8');
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
    exit;
}

$data   = json_decode(file_get_contents('php://input'), true);
$correo = trim($data['correo'] ?? '');

if (empty($correo) || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'campo' => 'correo', 'mensaje' => 'Ingresa un correo válido.']);
    exit;
}

// Buscar si existe el usuario
$stmt = $conexion->prepare("SELECT id, nombre, verificado FROM usuarios WHERE correo = ?");
$stmt->bind_param("s", $correo);
$stmt->execute();
$usuario = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$usuario) {
    echo json_encode(['success' => false, 'campo' => 'correo', 'mensaje' => 'No existe una cuenta con ese correo.']);
    $conexion->close();
    exit;
}

if ($usuario['verificado'] == 0) {
    echo json_encode(['success' => false, 'mensaje' => 'Esta cuenta no ha sido verificada aún.']);
    $conexion->close();
    exit;
}

// Generar código de 6 dígitos
$codigo = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
$expira = date('Y-m-d H:i:s', strtotime('+15 minutes'));

// Guardar código en la BD (reutilizamos las columnas de verificación)
$upd = $conexion->prepare("UPDATE usuarios SET codigo_verificacion = ?, codigo_expira = ? WHERE id = ?");
$upd->bind_param("ssi", $codigo, $expira, $usuario['id']);
$upd->execute();
$upd->close();
$conexion->close();

echo json_encode([
    'success'    => true,
    'correo'     => $correo,
    'nombre'     => $usuario['nombre'],
    'codigo_dev' => $codigo, // Solo para pruebas locales
    'mensaje'    => 'Código generado. Úsalo para restablecer tu contraseña.'
]);
?>