# 🚀 Guía de Despliegue a Vercel

Esta guía te ayudará a subir tu aplicación MiniMonday a GitHub y desplegarla en Vercel.

## 📋 Prerequisitos

- Cuenta de GitHub
- Cuenta de Vercel (gratis)
- Variables de entorno configuradas

## 🔧 Paso 1: Preparar el Proyecto

### 1.1 Verificar que no haya errores

```bash
npm run build
```

Si hay errores, corrígelos antes de continuar.

### 1.2 Verificar .gitignore

Asegúrate de que `.gitignore` incluya:
- `.env*.local`
- `.env`
- `node_modules/`
- `.next/`
- `.vercel/`

## 📦 Paso 2: Subir a GitHub

### 2.1 Inicializar Git (si no está inicializado)

```bash
git init
```

### 2.2 Agregar todos los archivos

```bash
git add .
```

### 2.3 Hacer commit inicial

```bash
git commit -m "Initial commit: MiniMonday ready for deployment"
```

### 2.4 Crear repositorio en GitHub

1. Ve a [GitHub](https://github.com)
2. Haz clic en el botón **"+"** en la esquina superior derecha
3. Selecciona **"New repository"**
4. Nombra tu repositorio (ej: `mini-monday`)
5. **NO** marques "Initialize with README" (ya tienes archivos)
6. Haz clic en **"Create repository"**

### 2.5 Conectar tu repositorio local con GitHub

GitHub te mostrará comandos similares a estos. Ejecútalos en tu terminal:

```bash
git remote add origin https://github.com/TU_USUARIO/mini-monday.git
git branch -M main
git push -u origin main
```

**Nota**: Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

### 2.6 Autenticación con GitHub

Si es la primera vez que subes código, GitHub te pedirá autenticarte. Puedes usar:
- **Personal Access Token** (recomendado)
- **GitHub CLI** (`gh auth login`)

## 🌐 Paso 3: Desplegar en Vercel

### 3.1 Crear cuenta en Vercel

1. Ve a [Vercel](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Selecciona **"Continue with GitHub"**
4. Autoriza a Vercel a acceder a tus repositorios

### 3.2 Importar Proyecto

1. En el dashboard de Vercel, haz clic en **"Add New..."** > **"Project"**
2. Selecciona tu repositorio `mini-monday`
3. Vercel detectará automáticamente que es un proyecto Next.js

### 3.3 Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega las siguientes variables:

```
GOOGLE_CLIENT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n"
SHEETS_SPREADSHEET_ID=tu-spreadsheet-id
JWT_SECRET=tu-jwt-secret-super-seguro
NEXTAUTH_SECRET=tu-nextauth-secret
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

**⚠️ IMPORTANTE**:
- Para `GOOGLE_PRIVATE_KEY`: Copia la clave completa incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
- Reemplaza los `\n` literales con saltos de línea reales, o usa el formato con comillas dobles como se muestra arriba
- `NEXTAUTH_URL` se actualizará automáticamente después del primer deploy

### 3.4 Configurar Build Settings

Vercel debería detectar automáticamente:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install`

### 3.5 Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que termine el build (2-5 minutos)
3. Una vez completado, tendrás una URL como: `https://mini-monday.vercel.app`

## 🔄 Paso 4: Configurar Dominio Personalizado (Opcional)

### 4.1 Agregar Dominio

1. En el dashboard de Vercel, ve a tu proyecto
2. Ve a **"Settings"** > **"Domains"**
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar DNS

### 4.2 Actualizar NEXTAUTH_URL

Después de agregar un dominio personalizado, actualiza `NEXTAUTH_URL` en las variables de entorno con tu nuevo dominio.

## 🔐 Paso 5: Configurar Google OAuth para Producción

### 5.1 Actualizar OAuth Credentials

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Ve a **"APIs y servicios"** > **"Credenciales"**
3. Edita tu **OAuth 2.0 Client ID**
4. Agrega a **"Orígenes autorizados"**:
   - `https://tu-dominio.vercel.app`
   - `https://mini-monday.vercel.app` (si usas el dominio de Vercel)
5. Agrega a **"URI de redirección autorizadas"**:
   - `https://tu-dominio.vercel.app/api/auth/callback/google`
   - `https://mini-monday.vercel.app/api/auth/callback/google`

### 5.2 Actualizar Variables de Entorno en Vercel

Si cambiaste las credenciales de OAuth, actualiza:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

En el dashboard de Vercel: **Settings** > **Environment Variables**

## ✅ Paso 6: Verificar Despliegue

### 6.1 Probar la Aplicación

1. Visita tu URL de Vercel
2. Prueba iniciar sesión
3. Verifica que todas las funcionalidades trabajen correctamente

### 6.2 Revisar Logs

Si hay problemas:
1. Ve a **"Deployments"** en Vercel
2. Haz clic en el deployment más reciente
3. Revisa los **"Build Logs"** y **"Function Logs"**

## 🔄 Actualizaciones Futuras

Cada vez que hagas `git push` a la rama `main`, Vercel desplegará automáticamente:

```bash
git add .
git commit -m "Descripción de los cambios"
git push origin main
```

Vercel detectará el push y desplegará automáticamente.

## 🆘 Solución de Problemas

### Error: "Module not found"
- Verifica que todas las dependencias estén en `package.json`
- Ejecuta `npm install` localmente para verificar

### Error: "Environment variable not found"
- Verifica que todas las variables de entorno estén configuradas en Vercel
- Asegúrate de que los nombres coincidan exactamente

### Error: "Build failed"
- Revisa los logs de build en Vercel
- Verifica que `npm run build` funcione localmente

### Error: "Google Sheets API error"
- Verifica que la Service Account tenga acceso al spreadsheet
- Verifica que `GOOGLE_PRIVATE_KEY` esté correctamente formateado (con saltos de línea)

## 📞 Soporte

Si tienes problemas, revisa:
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Next.js](https://nextjs.org/docs)
- Logs de build en el dashboard de Vercel

