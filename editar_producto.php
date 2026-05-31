<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');
require_once 'conexion.php';

// Verificar admin — acepta sesión PHP o rol desde FormData
$rolSesion  = $_SESSION['rol'] ?? '';
$rolFormData = $_POST['rol']   ?? '';
$rolFinal   = !empty($rolSesion) ? $rolSesion : $rolFormData;

if ($rolFinal !== 'admin') {
    echo json_encode(['ok' => false, 'msg' => 'Acceso denegado.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'msg' => 'Método no permitido.']);
    exit;
}

// Leer datos (FormData por si hay imagen)
$id          = intval($_POST['id']          ?? 0);
$nombre      = trim($_POST['nombre']        ?? '');
$marca       = trim($_POST['marca']         ?? '');
$categoria   = trim($_POST['categoria']     ?? '');
$descripcion = trim($_POST['descripcion']   ?? '');
$precio      = floatval($_POST['precio']    ?? 0);
$precioAntes = (!empty($_POST['precio_antes']) && floatval($_POST['precio_antes']) > 0)
               ? floatval($_POST['precio_antes']) : null;
$emoji       = trim($_POST['emoji']         ?? '🖥️');
$badge       = trim($_POST['badge']         ?? '');
$specs       = json_decode($_POST['specs']  ?? '[]', true);

// Validaciones
if ($id <= 0)            { echo json_encode(['ok'=>false,'msg'=>'ID inválido.']); exit; }
if (empty($nombre))      { echo json_encode(['ok'=>false,'msg'=>'El nombre es obligatorio.']); exit; }
if (empty($marca))       { echo json_encode(['ok'=>false,'msg'=>'La marca es obligatoria.']); exit; }
if (empty($categoria))   { echo json_encode(['ok'=>false,'msg'=>'Selecciona una categoría.']); exit; }
if (empty($descripcion)) { echo json_encode(['ok'=>false,'msg'=>'La descripción es obligatoria.']); exit; }
if ($precio <= 0)        { echo json_encode(['ok'=>false,'msg'=>'El precio debe ser mayor a 0.']); exit; }

// Buscar categoría
$stmtCat = $conexion->prepare("SELECT id FROM categorias WHERE slug = ?");
$stmtCat->bind_param("s", $categoria);
$stmtCat->execute();
$resCat = $stmtCat->get_result()->fetch_assoc();
$stmtCat->close();

if (!$resCat) {
    echo json_encode(['ok'=>false,'msg'=>'Categoría no válida.']);
    exit;
}
$categoriaId = (int)$resCat['id'];

// Specs
$specsLimpias = [];
if (is_array($specs)) {
    foreach ($specs as $s) {
        if (!empty($s['l']) && !empty($s['v'])) {
            $specsLimpias[] = ['l' => trim($s['l']), 'v' => trim($s['v'])];
        }
    }
}
$specsJson = json_encode($specsLimpias, JSON_UNESCAPED_UNICODE);
$badgeVal  = !empty($badge) ? $badge : null;

// Manejar imagen nueva (si se subió una)
$imagenNueva = null;
if (!empty($_FILES['imagen']['name'])) {
    $carpeta   = 'uploads/productos/';
    if (!is_dir($carpeta)) mkdir($carpeta, 0755, true);

    $extension     = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
    $extensionesOk = ['jpg', 'jpeg', 'png', 'webp'];

    if (!in_array($extension, $extensionesOk)) {
        echo json_encode(['ok'=>false,'msg'=>'Solo JPG, PNG o WEBP.']);
        exit;
    }

    $imagenNueva = $carpeta . uniqid('prod_') . '.' . $extension;

    if (!move_uploaded_file($_FILES['imagen']['tmp_name'], $imagenNueva)) {
        echo json_encode(['ok'=>false,'msg'=>'Error al subir la imagen.']);
        exit;
    }

    // Borrar imagen anterior
    $stmtImg = $conexion->prepare("SELECT imagen FROM productos WHERE id = ?");
    $stmtImg->bind_param("i", $id);
    $stmtImg->execute();
    $imgAnterior = $stmtImg->get_result()->fetch_assoc();
    $stmtImg->close();

    if (!empty($imgAnterior['imagen']) && file_exists($imgAnterior['imagen'])) {
        unlink($imgAnterior['imagen']);
    }
}

// UPDATE
if ($imagenNueva) {
    $sql = "UPDATE productos SET 
                nombre=?, marca=?, categoria_id=?, descripcion=?,
                precio=?, precio_antes=?, emoji=?, badge=?,
                especificaciones=?, imagen=?
            WHERE id=?";
    $stmt = $conexion->prepare($sql);
   $stmt->bind_param(
    "ssisdssssi",
        $nombre, $marca, $categoriaId, $descripcion,
        $precio, $precioAntes, $emoji, $badgeVal,
        $specsJson, $imagenNueva, $id
    );
} else {
    $sql = "UPDATE productos SET 
                nombre=?, marca=?, categoria_id=?, descripcion=?,
                precio=?, precio_antes=?, emoji=?, badge=?,
                especificaciones=?
            WHERE id=?";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param(
    "ssisdssssi",
        $nombre, $marca, $categoriaId, $descripcion,
        $precio, $precioAntes, $emoji, $badgeVal,
        $specsJson, $id
    );
}

if (!$stmt->execute()) {
    echo json_encode(['ok'=>false,'msg'=>'Error BD: ' . $conexion->error]);
    exit;
}

$stmt->close();
$conexion->close();

echo json_encode([
    'ok'  => true,
    'msg' => 'Producto "' . $nombre . '" actualizado correctamente.'
]);
?>