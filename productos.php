<?php
// ================================================
//  productos.php
//  Este archivo recibe las peticiones del navegador,
//  consulta MySQL y devuelve los productos en JSON.
//
//  El navegador llama a este archivo así:
//  fetch('productos.php')                  → todos
//  fetch('productos.php?categoria=laptop') → filtrado
//  fetch('productos.php?buscar=hp')        → búsqueda
// ================================================

// Incluir la conexión a la base de datos
require_once 'conexion.php';

// ── DECIRLE AL NAVEGADOR QUE LA RESPUESTA ES JSON ──
header('Content-Type: application/json; charset=utf-8');

// ── LEER PARÁMETROS QUE MANDA EL NAVEGADOR ──
// $_GET recoge lo que viene en la URL después del ?
$categoria = isset($_GET['categoria']) ? $_GET['categoria'] : 'todos';
$buscar    = isset($_GET['buscar'])    ? $_GET['buscar']    : '';
$orden     = isset($_GET['orden'])     ? $_GET['orden']     : 'default';

// ── CONSTRUIR LA CONSULTA SQL ──
// Empezamos con la consulta base (JOIN une las dos tablas)
$sql = "SELECT 
          p.id,
          p.nombre,
          p.marca,
          c.slug      AS categoria,
          c.nombre    AS categoria_nombre,
          p.descripcion,
          p.precio,
          p.precio_antes,
          p.emoji,
          p.badge,
          p.especificaciones,
          p.imagen
        FROM productos p
        JOIN categorias c ON p.categoria_id = c.id
        WHERE p.activo = 1";

// Array para guardar los parámetros de la consulta
$params = [];
$types  = "";

// ── FILTRO POR CATEGORÍA ──
if ($categoria !== 'todos' && $categoria !== '') {
    $sql    .= " AND c.slug = ?";
    $params[] = $categoria;
    $types   .= "s"; // "s" = string (texto)
}

// ── FILTRO POR BÚSQUEDA ──
if ($buscar !== '') {
    $termino  = "%" . $buscar . "%"; // Los % permiten buscar en cualquier parte
    $sql     .= " AND (p.nombre LIKE ? OR p.marca LIKE ? OR p.descripcion LIKE ?)";
    $params[] = $termino;
    $params[] = $termino;
    $params[] = $termino;
    $types   .= "sss";
}

// ── ORDENAMIENTO ──
switch ($orden) {
    case 'precio-asc':
        $sql .= " ORDER BY p.precio ASC";
        break;
    case 'precio-desc':
        $sql .= " ORDER BY p.precio DESC";
        break;
    case 'nombre':
        $sql .= " ORDER BY p.nombre ASC";
        break;
    default:
        $sql .= " ORDER BY p.id ASC";
        break;
}

// ── PREPARAR Y EJECUTAR LA CONSULTA ──
// "Preparar" protege contra ataques de inyección SQL
$stmt = $conexion->prepare($sql);

// Si hay filtros, los agregamos a la consulta preparada
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

// Ejecutar la consulta
$stmt->execute();

// Obtener los resultados
$resultado = $stmt->get_result();

// ── CONVERTIR RESULTADOS A ARRAY ──
$productos = [];

while ($fila = $resultado->fetch_assoc()) {

    // Las especificaciones vienen como texto JSON, hay que convertirlas a array
    $specs = [];
    if (!empty($fila['especificaciones'])) {
        $specs = json_decode($fila['especificaciones'], true);
        // Si hay error en el JSON, dejamos array vacío
        if (json_last_error() !== JSON_ERROR_NONE) {
            $specs = [];
        }
    }

    // Construir el objeto del producto
    $productos[] = [
        'id'          => (int) $fila['id'],
        'nombre'      => $fila['nombre'],
        'marca'       => $fila['marca'],
        'categoria'   => $fila['categoria'],
        'desc'        => $fila['descripcion'],
        'precio'      => (float) $fila['precio'],
        'precioAntes' => $fila['precio_antes'] ? (float) $fila['precio_antes'] : null,
        'emoji'       => $fila['emoji'],
        'badge'       => $fila['badge'],
        'specs'       => $specs,
        'imagen'      => $fila['imagen']
    ];
}

// ── CERRAR CONEXIÓN ──
$stmt->close();
$conexion->close();

// ── ENVIAR RESPUESTA JSON AL NAVEGADOR ──
echo json_encode([
    'total'     => count($productos),
    'productos' => $productos
]);
?>