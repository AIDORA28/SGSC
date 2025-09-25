# Guía de Despliegue - SGSC

Esta guía te ayudará a desplegar el Sistema de Gestión de Serenazgo y Control (SGSC) en producción usando Vercel y Supabase.

## 📋 Prerrequisitos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Supabase](https://supabase.com)
- Repositorio en GitHub con el código del proyecto
- Node.js 18+ instalado localmente

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Crea un nuevo proyecto
3. Anota la **URL del proyecto** y la **clave anónima**

### 2. Ejecutar Migraciones

Ejecuta los scripts SQL en el siguiente orden desde el **SQL Editor** de Supabase:

```sql
-- 1. Crear tablas
-- Ejecutar: supabase/migrations/001_create_tables.sql

-- 2. Insertar datos iniciales
-- Ejecutar: supabase/migrations/002_insert_initial_data.sql

-- 3. Configurar seguridad
-- Ejecutar: supabase/migrations/003_enable_rls.sql
```

### 3. Configurar Autenticación

1. Ve a **Authentication > Settings**
2. Configura los **Site URL** permitidos:
   - `http://localhost:3000` (desarrollo)
   - `https://tu-dominio.vercel.app` (producción)
3. Habilita los proveedores de autenticación que necesites

## 🚀 Despliegue en Vercel

### Opción 1: Despliegue Automático (Recomendado)

1. **Conectar Repositorio**:
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Clic en "New Project"
   - Importa tu repositorio de GitHub: `https://github.com/AIDORA28/SGSC.git`

2. **Configurar Variables de Entorno**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

3. **Configurar Build Settings**:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

4. **Deploy**: Clic en "Deploy"

### Opción 2: Despliegue Manual con CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Hacer login
vercel login

# Desplegar
vercel --prod
```

### Opción 3: GitHub Actions (Automático)

El proyecto incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`) que se ejecuta automáticamente en cada push a `main`.

**Configurar Secrets en GitHub**:
1. Ve a tu repositorio > Settings > Secrets and variables > Actions
2. Agrega los siguientes secrets:
   ```
   VERCEL_TOKEN=tu-token-de-vercel
   VERCEL_ORG_ID=tu-org-id
   VERCEL_PROJECT_ID=tu-project-id
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

## 🔧 Variables de Entorno

### Desarrollo (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

### Producción (.env.production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

## 🔍 Verificación del Despliegue

### 1. Verificar Conexión a Supabase
- La página de login debe cargar sin errores
- No debe aparecer "Invalid supabaseUrl" en la consola

### 2. Verificar Autenticación
- Intenta hacer login con credenciales de prueba
- Verifica que la redirección al dashboard funcione

### 3. Verificar Base de Datos
- Comprueba que las tablas se crearon correctamente
- Verifica que los datos iniciales están presentes

## 🛠️ Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción
npm run start

# Verificar tipos TypeScript
npm run type-check

# Linting
npm run lint
```

## 🔒 Configuración de Seguridad

### Row Level Security (RLS)
- Todas las tablas tienen RLS habilitado
- Las políticas están configuradas por rol de usuario
- Los usuarios solo pueden acceder a sus propios datos

### Roles de Usuario
- **admin**: Acceso completo
- **supervisor**: Gestión de personal y reportes
- **sereno**: Crear patrullajes e incidencias
- **chofer**: Actualizar movilidad asignada

## 📊 Monitoreo

### Vercel Analytics
- Habilita Analytics en el dashboard de Vercel
- Monitorea el rendimiento y errores

### Supabase Monitoring
- Revisa las métricas en el dashboard de Supabase
- Configura alertas para errores de base de datos

## 🐛 Solución de Problemas

### Error: "Invalid supabaseUrl"
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que la URL de Supabase sea válida

### Error de Build en Vercel
- Revisa los logs de build en Vercel
- Verifica que todas las dependencias estén en package.json

### Error de Conexión a Base de Datos
- Verifica que las migraciones se ejecutaron correctamente
- Comprueba la configuración de RLS

## 📞 Soporte

Si encuentras problemas durante el despliegue:
1. Revisa los logs de Vercel y Supabase
2. Verifica la configuración de variables de entorno
3. Asegúrate de que las migraciones se ejecutaron correctamente

---

¡Tu aplicación SGSC estará lista para producción siguiendo estos pasos! 🎉