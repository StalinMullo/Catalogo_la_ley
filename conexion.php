<?php
$host     = "localhost";
$usuario  = "root";
$password = "";
$base     = "catalogo_la_ley";

$conexion = new mysqli($host, $usuario, $password, $base);

if ($conexion->connect_error) {
    die(json_encode([
        "error"   => true,
        "mensaje" => "No se pudo conectar a la base de datos: " . $conexion->connect_error
    ]));
}

$conexion->set_charset("utf8mb4");
?>