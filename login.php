<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'conexion.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
    exit;
}

$data     = json_decode(file_get_contents('php://input'), true);
$correo   = trim($data['correo']   ?? '');
$password = $data['password']      ?? '';

// ── Validaciones básicas ─────────────────────────
if (empty($correo) || empty($password)) {
    echo json_encode(['success' => false, 'campo' => 'general', 'mensaje' => 'Por favor completa todos los campos.']);
    exit;
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'campo' => 'correo', 'mensaje' => 'Ingresa un correo válido.']);
    exit;
}

// ── Buscar usuario en BD ─────────────────────────
$stmt = $conexion->prepare("SELECT id, nombre, apellido, correo, contrasena, verificado, rol FROM usuarios WHERE correo = ?");
$stmt->bind_param("s", $correo);
$stmt->execute();
$resultado = $stmt->get_result();
$usuario   = $resultado->fetch_assoc();
$stmt->close();

// Usuario no existe
if (!$usuario) {
    echo json_encode([
        'success'   => false,
        'campo'     => 'correo',
        'no_existe' => true,
        'mensaje'   => 'No existe una cuenta con ese correo. ¿Deseas registrarte?'
    ]);
    $conexion->close();
    exit;
}

// Cuenta no verificada
if ($usuario['verificado'] == 0) {
    echo json_encode([
        'success'                => false,
        'pendiente_verificacion' => true,
        'correo'                 => $correo,
        'mensaje'                => 'Tu cuenta aún no ha sido verificada. Revisa tu correo.'
    ]);
    $conexion->close();
    exit;
}

// Contraseña incorrecta
if (!password_verify($password, $usuario['contrasena'])) {
    echo json_encode([
        'success' => false,
        'campo'   => 'password',
        'mensaje' => 'Contraseña incorrecta. Inténtalo de nuevo.'
    ]);
    $conexion->close();
    exit;
}

// ── Login exitoso ────────────────────────────────
$upd = $conexion->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
$upd->bind_param("i", $usuario['id']);
$upd->execute();
$upd->close();
$conexion->close();

$_SESSION['usuario_id']       = $usuario['id'];
$_SESSION['usuario_nombre']   = $usuario['nombre'];
$_SESSION['usuario_apellido'] = $usuario['apellido'];
$_SESSION['usuario_correo']   = $usuario['correo'];
$_SESSION['rol']              = $usuario['rol']; // ← lee el rol desde la BD

echo json_encode([
    'success' => true,
    'mensaje' => '¡Bienvenido, ' . htmlspecialchars($usuario['nombre']) . '!',
    'rol'     => $usuario['rol'], // ← se lo mandamos al frontend también
    'usuario' => [
        'id'       => $usuario['id'],
        'nombre'   => $usuario['nombre'],
        'apellido' => $usuario['apellido'],
        'correo'   => $usuario['correo'],
    ]
]);
?>