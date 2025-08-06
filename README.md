# Documentación - Tabla `tbl_geofences`

## Descripción General

La tabla `tbl_geofences` almacena información sobre geocercas (geofences) o perímetros geográficos virtuales que pueden ser utilizados para el seguimiento de ubicaciones, asignación de territorios de ventas, control de acceso por zonas, o cualquier aplicación que requiera delimitar áreas geográficas específicas.

## Estructura de la Tabla

```sql
CREATE TABLE tbl_geofences (
    id_geo                  INT AUTO_INCREMENT PRIMARY KEY,
    nombre                  VARCHAR(250) NULL,
    codigo                  VARCHAR(50) NULL,
    sector                  VARCHAR(250) NULL,
    `direccion_referencia ` TEXT NULL,
    ciudad                  VARCHAR(100) NULL,
    provincia               VARCHAR(100) NULL,
    pais                    VARCHAR(100) NULL,
    latitud                 DECIMAL(10, 8) NULL,
    longitud                DECIMAL(11, 8) NULL,
    poligono_coordenadas    JSON NULL,
    area_metros_cuadrados   DECIMAL(15, 2) NULL,
    perimetro_metros        DECIMAL(10, 2) NULL,
    estado                  CHAR DEFAULT 'A' NULL,
    activa                  TINYINT(1) NULL,
    color_mapa              VARCHAR(7) NULL,
    prioridad               INT NULL,
    descripcion             TEXT NULL,
    creado_en               TIMESTAMP DEFAULT NOW() NULL,
    actualizado_en          TIMESTAMP DEFAULT NOW() NULL,
    tipo_area               VARCHAR(100) NULL
);
```

## Descripción de Campos

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id_geo` | INT AUTO_INCREMENT | Identificador único y clave primaria de la geocerca | `1, 2, 3...` |
| `nombre` | VARCHAR(250) | Nombre descriptivo de la geocerca | `"Zona Norte Centro Histórico"` |
| `codigo` | VARCHAR(50) | Código único identificador para referencias rápidas | `"NORTE-001", "CTR-QTO-01"` |
| `sector` | VARCHAR(250) | Sector o zona geográfica a la que pertenece | `"Centro Histórico", "La Carolina"` |
| `direccion_referencia` | TEXT | Dirección de referencia principal del área | `"Av. 10 de Agosto y Bogotá, Centro Histórico"` |
| `ciudad` | VARCHAR(100) | Ciudad donde se encuentra la geocerca | `"Quito", "Guayaquil"` |
| `provincia` | VARCHAR(100) | Provincia donde se encuentra la geocerca | `"Pichincha", "Guayas"` |
| `pais` | VARCHAR(100) | País donde se encuentra la geocerca | `"Ecuador"` |
| `latitud` | DECIMAL(10,8) | Coordenada de latitud del punto central | `-0.22032100` |
| `longitud` | DECIMAL(11,8) | Coordenada de longitud del punto central | `-78.51269000` |
| `poligono_coordenadas` | JSON | Array de coordenadas que forman el polígono del perímetro | Ver ejemplos abajo |
| `area_metros_cuadrados` | DECIMAL(15,2) | Área calculada de la geocerca en metros cuadrados | `125000.75` |
| `perimetro_metros` | DECIMAL(10,2) | Perímetro calculado en metros | `1420.50` |
| `estado` | CHAR | Estado de la geocerca (A=Activo, I=Inactivo, S=Suspendido) | `'A'`, `'I'`, `'S'` |
| `activa` | TINYINT(1) | Indica si la geocerca está activa (1) o inactiva (0) | `1`, `0` |
| `color_mapa` | VARCHAR(7) | Color hexadecimal para representación en mapas | `"#FF6B35"`, `"#2ECC71"` |
| `prioridad` | INT | Nivel de prioridad (1=Alta, 2=Media, 3=Baja, etc.) | `1`, `2`, `3` |
| `descripcion` | TEXT | Descripción detallada de la geocerca y su propósito | `"Área comercial principal..."` |
| `creado_en` | TIMESTAMP | Fecha y hora de creación del registro | `2024-01-15 10:30:00` |
| `actualizado_en` | TIMESTAMP | Fecha y hora de última actualización | `2024-01-20 14:45:30` |
| `tipo_area` | VARCHAR(100) | Clasificación del tipo de área | `"Comercial", "Residencial", "Industrial"` |

## Índices Definidos

```sql
-- Índice compuesto para consultas frecuentes por estado, ciudad y código
CREATE INDEX tbl_geofences_activa_ciudad_codigo_index
    ON tbl_geofences (activa, ciudad, codigo);

-- Índice para consultas geoespaciales por coordenadas
CREATE INDEX tbl_geofences_latitud_longitud_index
    ON tbl_geofences (latitud, longitud);

-- Índice para filtros por sector
CREATE INDEX tbl_geofences_sector_index
    ON tbl_geofences (sector);
```

## Estados Válidos

| Estado | Descripción |
|--------|-------------|
| `'A'` | Activo - La geocerca está en uso |
| `'I'` | Inactivo - La geocerca está deshabilitada temporalmente |
| `'S'` | Suspendido - La geocerca está suspendida por algún motivo específico |

## Ejemplo de Formato JSON para Polígono

```json
[
    [-0.220321, -78.512690],
    [-0.219850, -78.511200],
    [-0.221100, -78.510800],
    [-0.221500, -78.513100],
    [-0.220321, -78.512690]
]
```

**Nota:** El polígono debe cerrarse repitiendo la primera coordenada al final.

## Ejemplos de Inserción

### Ejemplo Básico

```sql
INSERT INTO tbl_geofences (
    nombre, codigo, sector, `direccion_referencia `, ciudad, provincia, pais,
    latitud, longitud, poligono_coordenadas, area_metros_cuadrados, 
    perimetro_metros, estado, activa, color_mapa, prioridad, descripcion, tipo_area
) VALUES (
    'Centro Histórico Norte',
    'CTR-HIST-001',
    'Centro Histórico',
    'Plaza de la Independencia, Quito',
    'Quito',
    'Pichincha',
    'Ecuador',
    -0.220321,
    -78.512690,
    JSON_ARRAY(
        JSON_ARRAY(-0.220321, -78.512690),
        JSON_ARRAY(-0.219850, -78.511200),
        JSON_ARRAY(-0.221100, -78.510800),
        JSON_ARRAY(-0.221500, -78.513100),
        JSON_ARRAY(-0.220321, -78.512690)
    ),
    125000.75,
    1420.50,
    'A',
    1,
    '#FF6B35',
    1,
    'Zona comercial principal del centro histórico con alta afluencia peatonal',
    'Comercial'
);
```

### Ejemplo de Inserción Masiva

```sql
INSERT INTO tbl_geofences (
    nombre, codigo, sector, ciudad, provincia, pais, latitud, longitud,
    estado, activa, color_mapa, tipo_area
) VALUES 
('La Carolina Business', 'CAR-BUS-001', 'La Carolina', 'Quito', 'Pichincha', 'Ecuador', -0.183333, -78.483333, 'A', 1, '#2ECC71', 'Comercial'),
('Quitumbe Sur', 'QTB-SUR-001', 'Quitumbe', 'Quito', 'Pichincha', 'Ecuador', -0.298542, -78.524583, 'A', 1, '#E74C3C', 'Residencial'),
('Valle Chillos', 'VCH-001', 'Valle de los Chillos', 'Sangolquí', 'Pichincha', 'Ecuador', -0.323056, -78.444722, 'A', 1, '#9B59B6', 'Mixto');
```

## Consultas Útiles

### Consultar geocercas activas por ciudad

```sql
SELECT id_geo, nombre, codigo, sector, area_metros_cuadrados, creado_en
FROM tbl_geofences 
WHERE ciudad = 'Quito' 
  AND estado = 'A' 
  AND activa = 1
ORDER BY sector, nombre;
```

### Obtener estadísticas por sector

```sql
SELECT 
    sector,
    COUNT(*) as total_geocercas,
    SUM(area_metros_cuadrados) as area_total_m2,
    AVG(area_metros_cuadrados) as area_promedio_m2,
    MIN(area_metros_cuadrados) as area_minima_m2,
    MAX(area_metros_cuadrados) as area_maxima_m2
FROM tbl_geofences 
WHERE estado = 'A' AND activa = 1
GROUP BY sector
ORDER BY area_total_m2 DESC;
```

### Buscar geocercas por proximidad (ejemplo básico)

```sql
SELECT 
    nombre,
    codigo,
    sector,
    latitud,
    longitud,
    SQRT(
        POW(69.1 * (latitud - (-0.220321)), 2) +
        POW(69.1 * ((-78.512690) - longitud) * COS(latitud / 57.3), 2)
    ) as distancia_millas
FROM tbl_geofences 
WHERE estado = 'A' 
  AND activa = 1
HAVING distancia_millas < 1
ORDER BY distancia_millas;
```

### Geocercas creadas en los últimos 30 días

```sql
SELECT 
    nombre,
    codigo,
    sector,
    ciudad,
    tipo_area,
    creado_en
FROM tbl_geofences 
WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY creado_en DESC;
```

## Consideraciones Técnicas

### Rendimiento
- Los índices están optimizados para consultas frecuentes por ubicación y estado
- Para consultas geoespaciales complejas, considere usar tipos de datos espaciales de MySQL 8.0+
- El campo JSON puede ser pesado; considere normalizarlo si maneja miles de geocercas

### Validaciones Recomendadas
- **Coordenadas para Ecuador**: Latitud entre -5.0 y 2.0, Longitud entre -82.0 y -75.0
- **Código único**: Implemente validación a nivel de aplicación o agregue constraint UNIQUE
- **Color hexadecimal**: Validar formato #RRGGBB
- **Polígono cerrado**: Verificar que la primera y última coordenada sean iguales

### Mantenimiento
- Actualizar `actualizado_en` manualmente o crear trigger
- Considerar soft delete manteniendo registros históricos
- Backup regular debido a la importancia de los datos geográficos

## Nota sobre el Campo `direccion_referencia`

⚠️ **Advertencia**: El campo tiene un espacio extra al final del nombre (`direccion_referencia `). Se recomienda corregir esto:

```sql
ALTER TABLE tbl_geofences 
CHANGE `direccion_referencia ` direccion_referencia TEXT NULL;
```

## Versionado

| Versión | Fecha | Cambios |
|---------|--------|---------|
| 1.0 | 2024-01-01 | Estructura inicial de la tabla |
| 1.1 | 2024-02-01 | Agregado campo `tipo_area` |
