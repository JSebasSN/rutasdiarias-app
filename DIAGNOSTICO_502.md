# Diagnóstico del Error 502 Bad Gateway

## Resumen del Problema

Estás recibiendo un error **502 Bad Gateway** al intentar hacer peticiones a la API a través de tRPC. Esto indica que la función serverless de Netlify está fallando o expirando.

## Cambios Realizados

### 1. **Arreglado `neon-client.ts`**
   - **Problema**: El Proxy de `sql` estaba mal configurado y causaba errores
   - **Solución**: Convertido `sql` a una función directa que llama a `getSql()`
   - **Beneficio**: Eliminamos la complejidad del Proxy que podía causar problemas

### 2. **Mejorada la inicialización de tablas**
   - **Problema**: `ensureTablesExist()` se llamaba en cada petición sin sincronización
   - **Solución**: Agregada una promesa compartida para evitar múltiples inicializaciones simultáneas
   - **Beneficio**: Evita race conditions y timeouts

### 3. **Logging mejorado**
   - Agregados logs detallados en todas las capas: Netlify Function → Hono → Store → DB
   - Todos los errores ahora se loguean con stack trace completo
   - Cada operación registra cuánto tiempo toma

### 4. **Nuevos endpoints de diagnóstico**
   - `GET /api/debug`: Muestra información del entorno y configuración
   - `GET /api/test-db`: Prueba la conexión directa a la base de datos

## Pasos para Diagnosticar

### Paso 1: Verificar Variables de Entorno en Netlify

1. Ve a tu sitio en Netlify
2. **Site settings > Environment variables**
3. Verifica que existe la variable **`NETLIFY_DATABASE_URL`**
4. El valor debe ser tu connection string de Neon:
   ```
   postgresql://[usuario]:[contraseña]@[endpoint].neon.tech/[database]?sslmode=require
   ```

### Paso 2: Verificar Build Settings

1. **Site settings > Build & deploy > Build settings**
2. **Functions directory** debe ser: `api` (no vacío)
3. Si cambias esto, haz un nuevo deploy

### Paso 3: Probar los Endpoints de Diagnóstico

Después de hacer deploy, prueba estos endpoints en tu navegador:

#### A. Endpoint raíz
```
https://rutasapp.netlify.app/api/
```
Deberías ver:
```json
{"status":"ok","message":"Backend API is running"}
```

#### B. Endpoint de debug
```
https://rutasapp.netlify.app/api/debug
```
Deberías ver algo como:
```json
{
  "status": "ok",
  "environment": {
    "hasNetlifyDbUrl": true,
    "hasDbUrl": false,
    "dbUrlPrefix": "postgresql://...",
    "nodeEnv": "production"
  },
  "database": {
    "connectionInitialized": true
  }
}
```

**⚠️ IMPORTANTE**: `hasNetlifyDbUrl` debe ser `true`

#### C. Endpoint de prueba de base de datos
```
https://rutasapp.netlify.app/api/test-db
```
Deberías ver:
```json
{
  "status": "ok",
  "message": "Database connection successful",
  "result": {
    "current_time": "2024-...",
    "postgres_version": "PostgreSQL 16..."
  }
}
```

### Paso 4: Revisar los Logs de Netlify

1. Ve a **Deploys** en Netlify
2. Click en el último deploy
3. Click en **Functions** en el menú lateral
4. Click en la función **api**
5. Revisa los logs en tiempo real

Busca:
- `[DB] Initializing database connection` - Indica que está intentando conectar
- `[DB] Tables created/verified successfully` - Indica que las tablas se crearon
- `[Store] Getting routes...` - Indica que está intentando obtener datos
- Cualquier mensaje de error con `[ERROR]`

### Paso 5: Verificar Permisos en Neon Database

1. Ve a tu proyecto en [Neon Console](https://console.neon.tech/)
2. Ve a **Settings**
3. Verifica que **IP Allow** no esté bloqueando a Netlify
   - Lo mejor es dejarlo en "Allow all" para desarrollo
4. Verifica que tu base de datos esté activa y no suspendida

## Posibles Causas del 502

### 1. Variable de entorno no configurada
**Síntoma**: El endpoint `/api/debug` muestra `hasNetlifyDbUrl: false`

**Solución**:
- Agrega `NETLIFY_DATABASE_URL` en las variables de entorno de Netlify
- Haz un nuevo deploy después de agregar la variable

### 2. Connection string inválido
**Síntoma**: El endpoint `/api/test-db` devuelve error

**Solución**:
- Verifica que el connection string de Neon sea correcto
- Asegúrate de que incluya `?sslmode=require` al final
- Copia el connection string directamente desde Neon Console

### 3. Timeout en la inicialización de tablas
**Síntoma**: Los logs muestran timeout después de crear tablas

**Solución**:
- Las funciones serverless de Netlify tienen un timeout de 10 segundos en el plan gratuito
- Considera pre-crear las tablas manualmente en Neon Console usando el archivo `backend/db/schema.sql`

### 4. Problemas de red con Neon
**Síntoma**: Error de conexión en los logs

**Solución**:
- Verifica el status de Neon en https://neonstatus.com/
- Prueba la conexión desde otro lugar
- Verifica que tu proyecto de Neon no esté pausado

### 5. Función no encontrada
**Síntoma**: Error 404 en lugar de 502

**Solución**:
- Verifica que `Functions directory` sea `api` en Netlify
- Verifica que el archivo `api/index.js` exista en tu repositorio
- Haz un rebuild completo

## Comandos Útiles

### Limpiar y hacer rebuild en Netlify
1. Ve a **Deploys**
2. **Deploy settings > Clear cache and retry deploy**

### Verificar localmente (si tienes la BD configurada localmente)
```bash
# Crear un archivo .env.local con tu NETLIFY_DATABASE_URL
npm run start-web
```

## Próximos Pasos

1. **Ejecuta los 3 endpoints de diagnóstico** (/, /debug, /test-db)
2. **Revisa los logs de Netlify** y busca mensajes de error específicos
3. **Verifica las variables de entorno** en Netlify
4. **Comparte los resultados** de los endpoints y los logs para diagnóstico adicional

## Información Adicional de los Logs

Los nuevos logs incluyen:
- `[Netlify Function]` - Logs de la función serverless
- `[Hono]` - Logs del servidor web
- `[tRPC Error]` - Errores específicos de tRPC
- `[DB]` - Logs de la conexión a base de datos
- `[Store]` - Logs de las operaciones de datos
- Duración en milisegundos de cada operación

Todos los logs ahora incluyen detalles completos de errores con stack traces.
