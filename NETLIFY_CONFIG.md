# Configuración de Netlify para la Aplicación de Rutas

## Variables de Entorno Requeridas

En el panel de Netlify, ve a **Site settings > Environment variables** y agrega:

### 1. NETLIFY_DATABASE_URL
- **Valor**: Tu connection string de Neon Database
- **Formato**: `postgresql://[user]:[password]@[endpoint]/[dbname]?sslmode=require`
- Esta es la variable que la aplicación usa para conectarse a la base de datos
- **IMPORTANTE**: Asegúrate de que termine con `?sslmode=require`

## Build Settings

Ve a **Site settings > Build & deploy > Build settings** y configura:

### 1. Base directory
- Dejar **vacío** (raíz del proyecto)

### 2. Build command
```bash
npm run build
```

### 3. Publish directory
```bash
dist
```

### 4. Functions directory
```bash
api
```
**IMPORTANTE**: Esta casilla debe tener el valor `api` (no dejarla vacía)

### 5. Node version
- La versión de Node está definida en `.nvmrc` (Node 20)
- Netlify la detectará automáticamente

## Configuración Automática

Los siguientes archivos configuran automáticamente Netlify:

1. **netlify.toml**: Define las redirecciones y configuración de build
2. **.nvmrc**: Especifica Node.js v20 para el build
3. **api/index.js**: Función serverless que maneja el backend

## Verificación Post-Deploy

Después de hacer deploy, verifica:

1. **Función API funcionando**: Visita `https://tu-sitio.netlify.app/api/`
   - Deberías ver: `{"status":"ok","message":"Backend API is running"}`

2. **Logs de Netlify**: Ve a **Deploys > [último deploy] > Function logs**
   - Busca mensajes de inicialización de la base de datos
   - Verifica que no haya errores de conexión

## Solución de Problemas

### Error 404 en /api/trpc/*
1. Verifica que la variable `NETLIFY_DATABASE_URL` esté configurada
2. Verifica que el directorio de funciones esté configurado como `api`
3. Revisa los logs de la función en Netlify

### Error de conexión a base de datos
1. Verifica que el connection string de Neon sea correcto
2. Asegúrate de que la IP de Netlify no esté bloqueada en Neon
3. Revisa los logs de Netlify para ver el error específico

### Función no se encuentra
1. Asegúrate de que el archivo `api/index.js` exporta `handler`
2. Verifica que el build se completó sin errores
3. Revisa que el directorio `api` esté incluido en el deploy

## Re-deploy

Si haces cambios en el backend:
1. Haz commit y push de los cambios
2. Netlify automáticamente hará rebuild
3. Espera a que el deploy termine (2-5 minutos)
4. Limpia el caché del navegador si es necesario
