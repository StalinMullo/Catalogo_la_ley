<?php
session_start();

if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] !== 'admin') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'msg' => 'Acceso denegado.']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'msg' => 'Metodo no permitido']);
    exit;
}

// Leer datos del formulario (ahora viene como FormData, no JSON)
$nombre      = trim($_POST['nombre']      ?? '');
$marca       = trim($_POST['marca']       ?? '');
$categoria   = trim($_POST['categoria']   ?? '');
$descripcion = trim($_POST['descripcion'] ?? '');
$precio      = floatval($_POST['precio']  ?? 0);
$precioAntes = (!empty($_POST['precio_antes']) && floatval($_POST['precio_antes']) > 0)
               ? floatval($_POST['precio_antes']) : null;
$emoji       = trim($_POST['emoji']       ?? '🖥️');
$badge       = trim($_POST['badge']       ?? '');
$specs       = json_decode($_POST['specs'] ?? '[]', true);

// Validaciones
if (empty($nombre))      { echo json_encode(['ok'=>false,'msg'=>'El nombre es obligatorio.']); exit; }
if (empty($marca))       { echo json_encode(['ok'=>false,'msg'=>'La marca es obligatoria.']); exit; }
if (empty($categoria))   { echo json_encode(['ok'=>false,'msg'=>'Selecciona una categoria.']); exit; }
if (empty($descripcion)) { echo json_encode(['ok'=>false,'msg'=>'La descripcion es obligatoria.']); exit; }
if ($precio <= 0)        { echo json_encode(['ok'=>false,'msg'=>'El precio debe ser mayor a 0.']); exit; }

// ── SUBIR IMAGEN ──────────────────────────────────
$imagenNombre = null;

if (!empty($_FILES['imagen']['name'])) {
    $carpeta    = 'uploads/productos/';
    
    // Crear carpeta si no existe
    if (!is_dir($carpeta)) {
        mkdir($carpeta, 0755, true);
    }

    $extension      = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
    $extensionesOk  = ['jpg', 'jpeg', 'png', 'webp'];

    if (!in_array($extension, $extensionesOk)) {
        echo json_encode(['ok'=>false,'msg'=>'Solo se permiten imágenes JPG, PNG o WEBP.']);
        exit;
    }

    // Nombre único para evitar sobreescribir
    $imagenNombre = uniqid('prod_') . '.' . $extension;

    if (!move_uploaded_file($_FILES['imagen']['tmp_name'], $carpeta . $imagenNombre)) {
        echo json_encode(['ok'=>false,'msg'=>'Error al subir la imagen.']);
        exit;
    }

    $imagenNombre = $carpeta . $imagenNombre; // ruta relativa
}

// Buscar categoría
$stmtCat = $conexion->prepare("SELECT id FROM categorias WHERE slug = ?");
$stmtCat->bind_param("s", $categoria);
$stmtCat->execute();
$resCat = $stmtCat->get_result()->fetch_assoc();
$stmtCat->close();

if (!$resCat) {
    echo json_encode(['ok'=>false,'msg'=>'Categoria no valida.']);
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

// INSERT
$sql = "INSERT INTO productos
            (nombre, marca, categoria_id, descripcion,
             precio, precio_antes, emoji, badge, especificaciones, imagen, activo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";

$stmt = $conexion->prepare($sql);
$stmt->bind_param(
    "ssisdsssss",
    $nombre, $marca, $categoriaId, $descripcion,
    $precio, $precioAntes, $emoji, $badgeVal, $specsJson, $imagenNombre
);

if (!$stmt->execute()) {
    echo json_encode(['ok'=>false,'msg'=>'Error BD: ' . $conexion->error]);
    exit;
}

$nuevoId = $stmt->insert_id;
$stmt->close();
$conexion->close();

echo json_encode([
    'ok'  => true,
    'id'  => $nuevoId,
    'msg' => 'Producto "' . $nombre . '" guardado correctamente con ID #' . $nuevoId
]);