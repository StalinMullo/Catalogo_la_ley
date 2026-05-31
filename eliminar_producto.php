<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'msg' => 'Método no permitido.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id   = intval($data['id']  ?? 0);
$rol  = $data['rol']        ?? '';

// Verificar admin
$rolSesion = $_SESSION['rol'] ?? '';
$rolFinal  = !empty($rolSesion) ? $rolSesion : $rol;

if ($rolFinal !== 'admin') {
    echo json_encode(['ok' => false, 'msg' => 'Acceso denegado.']);
    exit;
}

if ($id <= 0) {
    echo json_encode(['ok' => false, 'msg' => 'ID inválido.']);
    exit;
}

// Obtener imagen para borrarla
$stmt = $conexion->prepare("SELECT imagen FROM productos WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$prod = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$prod) {
    echo json_encode(['ok' => false, 'msg' => 'Producto no encontrado.']);
    $conexion->close();
    exit;
}

// Borrar imagen si existe
if (!empty($prod['imagen']) && file_exists($prod['imagen'])) {
    unlink($prod['imagen']);
}

// Eliminar de la BD
$del = $conexion->prepare("DELETE FROM productos WHERE id = ?");
$del->bind_param("i", $id);
$del->execute();
$del->close();
$conexion->close();

echo json_encode([
    'ok'  => true,
    'msg' => 'Producto eliminado correctamente.'
]);
?>