# Migraciones de Supabase - SGSC

Este directorio contiene las migraciones SQL para configurar la base de datos del Sistema de Gestión de Serenazgo y Control (SGSC).

## Archivos de Migración

### 001_create_tables.sql
Crea todas las tablas principales del sistema:
- `turno` - Gestión de turnos de trabajo
- `sector` - Sectores de patrullaje
- `personal` - Información del personal de serenazgo
- `anexo` - Anexos por sector
- `cabina` - Cabinas de control
- `movilidad` - Vehículos y movilidades
- `patrullaje` - Registro de patrullajes
- `supervisor` - Asignación de supervisores
- `incidencia` - Registro de incidencias
- `bitacora_cabina` - Bitácora digital de cabinas

### 002_insert_initial_data.sql
Inserta datos iniciales básicos:
- Turnos estándar (Mañana, Tarde, Noche)
- Sectores básicos (Centro, Norte, Sur, Este, Oeste)
- Anexos por sector
- Cabinas iniciales
- Personal de ejemplo
- Movilidades básicas
- Supervisores iniciales

### 003_enable_rls.sql
Configura la seguridad a nivel de fila (RLS):
- Habilita RLS en todas las tablas
- Define políticas de acceso por rol
- Crea funciones de utilidad para verificación de roles

## Cómo ejecutar las migraciones

### Opción 1: Desde el Dashboard de Supabase
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Ejecuta los archivos en orden:
   - Primero: `001_create_tables.sql`
   - Segundo: `002_insert_initial_data.sql`
   - Tercero: `003_enable_rls.sql`

### Opción 2: Usando Supabase CLI
```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar proyecto local
supabase init

# Vincular con tu proyecto remoto
supabase link --project-ref YOUR_PROJECT_REF

# Ejecutar migraciones
supabase db push
```

### Opción 3: Usando psql
```bash
# Conectar a tu base de datos
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Ejecutar cada archivo
\i 001_create_tables.sql
\i 002_insert_initial_data.sql
\i 003_enable_rls.sql
```

## Estructura de la Base de Datos

El sistema está diseñado siguiendo el flujo documentado en `DOC/FlujoTablas.md` y permite:

- **Gestión de Personal**: Control de serenos, supervisores, choferes y operadores de cámara
- **Control de Turnos**: Asignación y seguimiento de turnos de trabajo
- **Patrullaje**: Registro de patrullajes a pie, móviles y en moto
- **Incidencias**: Reporte y seguimiento de incidencias
- **Bitácora Digital**: Reemplazo digital de cuadernos físicos de cabina
- **Movilidad**: Control de vehículos y asignaciones

## Roles y Permisos

El sistema maneja los siguientes roles:
- **admin**: Acceso completo a todas las funciones
- **supervisor**: Puede gestionar personal y revisar reportes
- **sereno**: Puede crear patrullajes, incidencias y bitácoras
- **chofer**: Puede actualizar información de movilidad asignada
- **camara**: Acceso de solo lectura con permisos específicos

## Notas Importantes

1. **Seguridad**: Todas las tablas tienen RLS habilitado
2. **Auditoría**: Campos `created_at` y `updated_at` en todas las tablas
3. **Integridad**: Claves foráneas para mantener consistencia
4. **Índices**: Optimización para consultas frecuentes
5. **Triggers**: Actualización automática de timestamps