# Diagnóstico y Solución del Error 502

## ¿Qué se ha hecho?

He optimizado el backend para solucionar el error 502. Los cambios principales son:

### 1. **Optimización de Migraciones de Base de Datos**
- **Antes**: Cada query llamaba a `ensureTablesExist()`, lo cual podía tomar varios segundos
- **Después**: Las migraciones se ejecutan una sola vez al inicio y se cachean

### 2. **Mejoras en Logs y Debugging**
- Agregado Request IDs para rastrear requests específicos
- Logs de tiempo de ejecución en cada paso
- Timeout de 25 segundos para detectar requests lentos
- Mejor manejo de errores con stack traces completos

### 3. **Configuración de Neon Database**
- Agregadas opciones de fetch para evitar caching
- Mejor manejo de errores en la conexión
- Logs detallados de inicialización

## ¿Qué debes verificar en Netlify?

### Variables de Entorno
Asegúrate de que en Netlify tienes configurada la variable:
- `NETLIFY_DATABASE_URL` = tu string de conexión de Neon

**IMPORTANTE**: La variable debe llamarse exactamente `NETLIFY_DATABASE_URL` (no `DATABASE_URL` solo).

### Configuración de Netlify
1. Ve a **Site configuration** → **Environment variables**
2. Verifica que `NETLIFY_DATABASE_URL` esté configurada
3. Ve a **Site configuration** → **Build & deploy** → **Functions**
4. Verifica que **Functions directory** esté configurado como `api`

### Verifica el Deploy
Después de hacer push de estos cambios:

1. **Espera a que termine el deploy**
2. **Verifica los logs de Netlify Functions**:
   - Ve a **Functions** en el dashboard de Netlify
   - Haz clic en la función `api`
   - Revisa los logs en tiempo real

## Endpoints de Prueba

Prueba estos endpoints en orden:

### 1. Health Check (debe funcionar inmediatamente)
```bash
curl https://rutasapp.netlify.app/api/health
```
Debe retornar:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 2. Debug (verifica variables de entorno)
```bash
curl https://rutasapp.netlify.app/api/debug
```
Debe mostrar que `hasNetlifyDbUrl: true`

### 3. Test Database (verifica conexión a Neon)
```bash
curl https://rutasapp.netlify.app/api/test-db
```
Debe retornar información de PostgreSQL

### 4. tRPC Queries (prueba el sistema completo)
```bash
# En el navegador o desde tu app
https://rutasapp.netlify.app/api/trpc/routes.getRoutes?input=%7B%22json%22%3Anull%7D
```

## Cambios Realizados

### Archivos Modificados:
1. **backend/db/neon-client.ts**
   - Agregadas opciones de fetch
   - Mejor logging
   - Manejo de errores mejorado

2. **backend/db/store.ts**
   - Eliminadas llamadas a `ensureTablesExist()` en cada query
   - Queries más rápidos

3. **backend/db/migrate.ts** (nuevo)
   - Sistema de migraciones optimizado
   - Se ejecuta una sola vez al inicio

4. **backend/hono.ts**
   - Sistema de migraciones lazy
   - Mejores logs de tiempo
   - Manejo de errores mejorado

5. **api/index.js**
   - Request IDs para tracking
   - Timeout de 25 segundos
   - Logs mejorados con duración

## Posibles Problemas y Soluciones

### Si sigues viendo 502:

1. **Verifica los logs de Netlify Functions**:
   - Busca `[DB] Error` para errores de base de datos
   - Busca `timeout` para problemas de tiempo
   - Busca el Request ID específico del error

2. **Verifica que la variable de entorno esté correcta**:
   ```bash
   # Debe empezar con postgres:// o postgresql://
   # Debe contener el host de Neon
   ```

3. **Verifica que Neon esté activo**:
   - Ve al dashboard de Neon
   - Verifica que el proyecto esté activo (no suspendido)
   - Verifica que el endpoint esté habilitado

4. **Cold start largo**:
   - La primera request después de deploy puede tomar hasta 10-15 segundos
   - Esto es normal para funciones serverless
   - Las siguientes requests serán mucho más rápidas

### Si ves timeout:

La función tiene un timeout de 25 segundos. Si alcanza este límite:
1. Verifica la latencia de tu base de datos Neon
2. Considera usar Neon con regiones más cercanas
3. Revisa que las tablas e índices estén creados correctamente

## Próximos Pasos

1. **Haz commit y push** de estos cambios
2. **Espera el deploy** en Netlify (2-3 minutos)
3. **Prueba los endpoints** en orden
4. **Revisa los logs** si algo falla
5. **Copia los logs completos** si necesitas más ayuda

## Logs a Buscar

Cuando abras tu app, deberías ver en los logs de Netlify Functions:

```
[Netlify Function] ========== NEW REQUEST ==========
[Netlify Function] Request ID: xxxxx
[Hono] Request: GET ...
[Migration] Starting database migrations...
[Migration] Migrations completed successfully in XXXms
[Store] Getting routes...
[Store] Retrieved X routes
[Hono] Response status: 200 in XXXms
[Netlify Function] Request xxxxx completed successfully in XXXms
```

Si ves errores, copia el stack trace completo para diagnosticar.
