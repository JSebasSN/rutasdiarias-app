# Configuración de Neon Database para Netlify

## ✅ Archivos Modificados

Se han actualizado los siguientes archivos para usar Neon Database:

1. **backend/db/neon-client.ts** - Cliente de Neon e inicialización de tablas
2. **backend/db/store.ts** - Store actualizado para usar Neon en lugar de memoria
3. **backend/db/schema.sql** - Esquema SQL de la base de datos
4. **backend/hono.ts** - Inicialización de la base de datos al arrancar
5. **.env** y **.env.example** - Variable DATABASE_URL agregada

## 📋 Pasos para Configurar

### 1. Crear Base de Datos en Neon

1. Ve a [console.neon.tech](https://console.neon.tech)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto (puedes nombrarlo "rutasapp" o como prefieras)
4. Copia la **Connection String** que aparece en el dashboard
   - Debe verse así: `postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require`

### 2. Configurar en Netlify

1. Ve a [app.netlify.com](https://app.netlify.com)
2. Selecciona tu sitio "rutasapp"
3. Ve a **Site configuration** → **Environment variables**
4. Haz clic en **Add a variable**
5. Agrega:
   - **Key**: `DATABASE_URL`
   - **Value**: Pega la Connection String de Neon
   - **Scopes**: Selecciona "All scopes" o al menos "Functions"
6. Haz clic en **Create variable**

### 3. Redesplegar en Netlify

Para que la nueva variable de entorno tome efecto:

1. Ve a la pestaña **Deploys**
2. Haz clic en **Trigger deploy** → **Deploy site**

O simplemente haz un nuevo commit y push a tu repositorio:

```bash
git add .
git commit -m "Configurar Neon database"
git push
```

### 4. Verificar que Funcione

1. Espera a que el despliegue termine
2. Abre tu app en [rutasapp.netlify.app](https://rutasapp.netlify.app)
3. Intenta:
   - Ver la lista de rutas (debería cargar las rutas por defecto)
   - Crear una nueva ruta
   - Ver el historial

4. Para verificar los logs:
   - Ve a Netlify → **Functions** → Selecciona la función `api`
   - Revisa los logs para confirmar que dice "Database initialized successfully"

## 🗄️ Estructura de la Base de Datos

La base de datos incluye 6 tablas:

- **route_templates** - Plantillas de rutas (TRAILER/FURGO)
- **route_records** - Registros históricos de rutas
- **saved_drivers** - Conductores guardados con frecuencia de uso
- **saved_tractors** - Tractores guardados
- **saved_trailers** - Remolques guardados
- **saved_vans** - Furgones guardados

Las tablas se crean automáticamente cuando el servidor arranca por primera vez.

## 🔍 Verificar la Base de Datos en Neon

1. Ve a tu proyecto en [console.neon.tech](https://console.neon.tech)
2. Haz clic en **SQL Editor**
3. Ejecuta consultas para ver los datos:

```sql
-- Ver todas las tablas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Ver rutas
SELECT * FROM route_templates;

-- Ver registros
SELECT * FROM route_records;

-- Ver conductores guardados
SELECT * FROM saved_drivers;
```

## 🐛 Solución de Problemas

### Error: "DATABASE_URL environment variable is not set"

- ✅ Verifica que agregaste la variable en Netlify
- ✅ Asegúrate de haber hecho un nuevo deploy después de agregar la variable
- ✅ Verifica que el scope incluya "Functions"

### Error de conexión a la base de datos

- ✅ Verifica que la Connection String sea correcta
- ✅ Asegúrate de incluir `?sslmode=require` al final
- ✅ Verifica que tu proyecto de Neon esté activo (no suspendido)

### Las operaciones no se guardan

- ✅ Revisa los logs de Netlify Functions para ver errores
- ✅ Verifica que la Connection String tenga permisos de escritura
- ✅ Confirma que las tablas se crearon correctamente en Neon SQL Editor

### 404 en las peticiones tRPC

- ✅ Verifica que hiciste un nuevo deploy después de los cambios
- ✅ Confirma que `netlify.toml` está correctamente configurado
- ✅ Revisa que la variable `EXPO_PUBLIC_RORK_API_BASE_URL` esté configurada

## 📊 Beneficios de Usar Neon

- ✅ **Persistencia**: Los datos se mantienen entre deploys
- ✅ **Escalabilidad**: Neon escala automáticamente según la demanda
- ✅ **Branching**: Puedes crear branches de tu base de datos para testing
- ✅ **Backups**: Backups automáticos incluidos
- ✅ **Free Tier**: 0.5 GB de almacenamiento gratis

## 🎉 ¡Listo!

Una vez que hayas configurado la variable `DATABASE_URL` en Netlify y redesplegado, tu aplicación estará usando Neon Database y todos los datos persistirán correctamente.
