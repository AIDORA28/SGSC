# SGSC - Sistema de Gestión de Seguridad Ciudadana

Sistema web para la Sub Gerencia de Seguridad Ciudadana de Asia (Cañete, Lima, Perú).

## Desarrollo local

Para ejecutar el servidor de desarrollo:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

## Configuración de Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. En la sección SQL Editor, ejecuta las migraciones para crear las tablas necesarias
4. Configura la autenticación por correo electrónico y contraseña
5. Configura el almacenamiento para archivos (Storage)
6. Actualiza los valores en `.env.local` y `.env.production` con tus credenciales

## Despliegue en Vercel

Para desplegar este proyecto en Vercel:

1. Crea una cuenta en [Vercel](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Configura las siguientes variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto en Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anónima de tu proyecto en Supabase

## Tecnologías utilizadas

- Next.js 15
- Supabase (Auth, Database, Storage)
- Tailwind CSS
- TypeScript
- React Icons
- Chart.js
