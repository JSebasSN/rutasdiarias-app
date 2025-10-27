# Pruebas del Backend

Este documento te ayudará a verificar que el backend esté funcionando correctamente.

## Paso 1: Verificar que la función de Netlify esté activa

Abre tu navegador y visita:
```
https://rutasapp.netlify.app/api/
```

Deberías ver:
```json
{"status":"ok","message":"Backend API is running"}
```

Si ves un error 404, significa que la función no se desplegó correctamente. Verifica:
1. Que el directorio de funciones esté configurado como `api` en Netlify
2. Que el build se haya completado sin errores
3. Los logs de Netlify para ver qué salió mal

## Paso 2: Verificar el endpoint de salud

Visita:
```
https://rutasapp.netlify.app/api/health
```

Deberías ver:
```json
{"status":"ok","timestamp":"2025-01-..."}
```

## Paso 3: Probar una consulta tRPC desde el navegador

Abre la consola del navegador (F12) y ejecuta:

```javascript
fetch('https://rutasapp.netlify.app/api/trpc/routes.getRoutes', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('Routes:', data))
.catch(err => console.error('Error:', err));
```

Deberías ver las rutas guardadas en la base de datos.

## Paso 4: Verificar los logs de Netlify

1. Ve a tu sitio en Netlify
2. Haz clic en **Functions** en la barra lateral
3. Selecciona la función `api`
4. Revisa los logs para ver qué está sucediendo

Busca estos mensajes:
- `[Netlify Function] Received request:` - indica que la función recibió una petición
- `[Hono] Request:` - indica que Hono procesó la petición
- `[tRPC Error]` - indica un error en tRPC
- `Database initialized successfully` - indica que la base de datos se inicializó correctamente

## Errores Comunes

### Error: "Database URL environment variable is not set"
**Solución**: Configura la variable `NETLIFY_DATABASE_URL` en Netlify con tu connection string de Neon.

### Error 404 en todas las rutas
**Causas posibles**:
1. El directorio de funciones no está configurado como `api` en Netlify
2. La función no se desplegó correctamente
3. Hay un error en el código que impide que la función se inicialice

**Solución**: Revisa los logs de build en Netlify y asegúrate de que el build se completó sin errores.

### Error de CORS
**Solución**: Los headers CORS están configurados en múltiples lugares:
1. `netlify.toml` - headers para todas las rutas
2. `backend/hono.ts` - middleware de CORS en Hono
3. `api/index.js` - headers en la respuesta de la función

Si aún tienes problemas de CORS, verifica que estos archivos estén actualizados en tu repositorio.

### Error: "No 'Access-Control-Allow-Origin' header is present"
Este error significa que el servidor no está devolviendo los headers CORS correctos.

**Solución**:
1. Asegúrate de que hayas hecho deploy de los cambios más recientes
2. Limpia el caché del navegador (Ctrl+Shift+Delete)
3. Verifica los headers de respuesta en las DevTools del navegador (pestaña Network)

## Debugging Avanzado

Si los pasos anteriores no funcionan, puedes habilitar logs más detallados:

1. En `backend/hono.ts`, el middleware de logging ya está activo
2. En `api/index.js`, se están registrando todos los detalles de la petición
3. Revisa los logs en Netlify para ver exactamente qué está pasando

### Ver los logs en tiempo real

1. Instala Netlify CLI: `npm install -g netlify-cli`
2. Ejecuta: `netlify login`
3. Ejecuta: `netlify functions:log api`

Esto te mostrará los logs de la función en tiempo real.
