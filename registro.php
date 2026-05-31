<?php
// ================================================
//  registro.php — SIN PHPMAILER (funciona en XAMPP)
//  El código se guarda en BD y se muestra en pantalla
//  para que puedas probarlo localmente.
// ================================================

header('Content-Type: application/json; charset=utf-8');
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
    exit;
}

$data     = json_decode(file_get_contents('php://input'), true);
$nombre   = trim($data['nombre']   ?? '');
$apellido = trim($data['apellido'] ?? '');
$correo   = trim($data['correo']   ?? '');
$password = $data['password']      ?? '';
$password2= $data['password2']     ?? '';

// ── Validaciones ──────────────────────────────────────
if (empty($nombre) || empty($apellido) || empty($correo) || empty($password) || empty($password2)) {
    echo json_encode(['success' => false, 'campo' => 'general', 'mensaje' => 'Todos los campos son obligatorios.']);
    exit;
}
if (!preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/', $nombre)) {
    echo json_encode(['success' => false, 'campo' => 'nombre', 'mensaje' => 'El nombre solo debe contener letras.']);
    exit;
}
if (!preg_match('/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/', $apellido)) {
    echo json_encode(['success' => false, 'campo' => 'apellido', 'mensaje' => 'El apellido solo debe contener letras.']);
    exit;
}
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'campo' => 'correo', 'mensaje' => 'Correo inválido.']);
    exit;
}
if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'campo' => 'password', 'mensaje' => 'La contraseña debe tener mínimo 6 caracteres.']);
    exit;
}
if ($password !== $password2) {
    echo json_encode(['success' => false, 'campo' => 'password2', 'mensaje' => 'Las contraseñas no coinciden.']);
    exit;
}

// ── Verificar si ya existe el correo ──────────────────
$stmt = $conexion->prepare("SELECT id, verificado FROM usuarios WHERE correo = ?");
$stmt->bind_param("s", $correo);
$stmt->execute();
$existente = $stmt->get_result()->fetch_assoc();
$stmt->close();

if ($existente && $existente['verificado'] == 1) {
    echo json_encode(['success' => false, 'campo' => 'correo', 'mensaje' => 'Este correo ya está registrado. Inicia sesión.']);
    $conexion->close();
    exit;
}

// ── Generar código de 6 dígitos ───────────────────────
$codigo = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
$expira = date('Y-m-d H:i:s', strtotime('+15 minutes'));
$hash   = password_hash($password, PASSWORD_BCRYPT);

// ── Insertar o actualizar usuario ─────────────────────
if ($existente) {
    // Ya existe pero no verificado: actualizar código
    $upd = $conexion->prepare("UPDATE usuarios SET nombre=?, apellido=?, contrasena=?, codigo_verificacion=?, codigo_expira=? WHERE correo=?");
    $upd->bind_param("ssssss", $nombre, $apellido, $hash, $codigo, $expira, $correo);
    $upd->execute();
    $upd->close();
} else {
    // Usuario nuevo
    $ins = $conexion->prepare("INSERT INTO usuarios (nombre, apellido, correo, contrasena, verificado, codigo_verificacion, codigo_expira) VALUES (?, ?, ?, ?, 0, ?, ?)");
    $ins->bind_param("ssssss", $nombre, $apellido, $correo, $hash, $codigo, $expira);
    if (!$ins->execute()) {
        echo json_encode(['success' => false, 'mensaje' => 'Error al guardar: ' . $conexion->error]);
        $ins->close(); $conexion->close(); exit;
    }
    $ins->close();
}
$conexion->close();

// ── Respuesta ─────────────────────────────────────────
// En XAMPP local no se puede enviar email real.
// El código se devuelve en la respuesta para que puedas probarlo.
// En producción: quita 'codigo_dev' y usa PHPMailer con Gmail SMTP.
echo json_encode([
    'success'                => true,
    'pendiente_verificacion' => true,
    'correo'                 => $correo,
    'nombre'                 => $nombre,
    'codigo_dev'             => $codigo,   // ← Solo para pruebas locales
    'mensaje'                => 'Registro exitoso. Usa el código que aparece en pantalla para verificar tu cuenta.'
]);
?>