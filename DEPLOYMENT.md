# Guía de Deployment en Vercel

## Pasos que YA están hechos ✅

1. ✅ Configuración de `vercel.json` - Ya está configurado para:
   - Servir el backend en `/api`
   - Servir la app web de Expo
   - Manejar las rutas correctamente

2. ✅ Backend configurado con Hono en `backend/hono.ts`

3. ✅ API handler en `api/index.js` que usa Vercel Edge Runtime

4. ✅ Variables de entorno configuradas:
   - `.env.example` - Plantilla para variables de entorno
   - `.env` - Variables locales (no se sube a git)

## Pasos que DEBES hacer TÚ 🚀

### 1. Instalar Vercel CLI (si no lo tienes)
```bash
npm install -g vercel
```

### 2. Agregar scripts de build al package.json
Abre `package.json` y agrega estos scripts en la sección "scripts":
```json
"build": "npx expo export -p web",
"postbuild": "cp -r dist/_expo dist/expo || true"
```

El `package.json` debe quedar así:
```json
"scripts": {
  "start": "bunx rork start -p 2xhmyqurudkwv1h7s0dgs --tunnel",
  "start-web": "bunx rork start -p 2xhmyqurudkwv1h7s0dgs --web --tunnel",
  "start-web-dev": "DEBUG=expo* bunx rork start -p 2xhmyqurudkwv1h7s0dgs --web --tunnel",
  "lint": "expo lint",
  "build": "npx expo export -p web",
  "postbuild": "cp -r dist/_expo dist/expo || true"
}
```

### 3. Inicializar git (si no lo has hecho)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 4. Subir a GitHub
```bash
# Crea un repositorio en GitHub primero, luego:
git remote add origin https://github.com/tu-usuario/tu-repositorio.git
git branch -M main
git push -u origin main
```

### 5. Deploy a Vercel

#### Opción A: Desde la línea de comandos
```bash
vercel
```

Sigue las instrucciones:
- Link to existing project? → No
- Project name → (tu nombre de proyecto)
- Which directory? → ./
- Want to modify settings? → No

#### Opción B: Desde el dashboard de Vercel (Recomendado)
1. Ve a https://vercel.com
2. Click en "Add New..." → "Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente la configuración
5. En "Environment Variables", agrega:
   - `EXPO_PUBLIC_RORK_API_BASE_URL` = `https://tu-dominio.vercel.app`
6. Click en "Deploy"

### 6. Configurar la variable de entorno en Vercel

Después del primer deploy:
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - **Name**: `EXPO_PUBLIC_RORK_API_BASE_URL`
   - **Value**: `https://tu-dominio.vercel.app` (usa tu dominio real de Vercel)
   - **Environments**: Production, Preview, Development

4. Redeploy el proyecto para que tome la nueva variable

### 7. Verificar que funciona

Una vez deployado, visita:
- `https://tu-dominio.vercel.app` - Tu app
- `https://tu-dominio.vercel.app/api` - Tu backend (debería mostrar `{"status":"ok","message":"API is running"}`)
- `https://tu-dominio.vercel.app/api/trpc` - Tu tRPC endpoint

## Notas importantes 📝

1. **El archivo `.env` no se sube a git** - Cada desarrollador debe crear su propio `.env` basado en `.env.example`

2. **En producción**, la variable `EXPO_PUBLIC_RORK_API_BASE_URL` debe ser tu dominio de Vercel

3. **Cada push a main** hará un deploy automático si conectaste con GitHub

4. **Para hacer cambios**:
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push
   ```
   Vercel hará el deploy automáticamente

## Solución de problemas 🔧

### Si el API no funciona:
- Verifica que la variable de entorno esté bien configurada
- Revisa los logs en Vercel Dashboard → Tu Proyecto → Deployments → Click en el deployment → Logs

### Si la app no carga:
- Verifica que el build se completó correctamente
- Revisa que `vercel.json` tenga las rutas correctas

### Si AsyncStorage no funciona en web:
- Es normal, AsyncStorage en web usa localStorage
- Los datos son locales al navegador

## Comandos útiles

```bash
# Deploy a preview (no afecta producción)
vercel

# Deploy a producción
vercel --prod

# Ver logs
vercel logs

# Remover proyecto
vercel remove
```
