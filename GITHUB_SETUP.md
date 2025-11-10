# 🔐 Configuración de GitHub para Deploy Automático

Esta guía te ayudará a configurar GitHub para que los cambios se desplieguen automáticamente en Vercel.

## 📋 Opción 1: Push Manual (Recomendada para empezar)

### Ventajas:
- ✅ Simple y seguro
- ✅ Tú controlas cuándo se despliega
- ✅ No necesitas configurar nada extra

### Cómo funciona:
1. Yo te preparo los cambios en tu código
2. Te doy los comandos exactos para ejecutar
3. Tú ejecutas los comandos en tu terminal
4. Vercel detecta el push y despliega automáticamente

### Comandos que usarás:

```bash
# Ver qué archivos cambiaron
git status

# Agregar todos los cambios
git add .

# Hacer commit con un mensaje descriptivo
git commit -m "Descripción de los cambios"

# Subir a GitHub
git push origin main
```

---

## 📋 Opción 2: GitHub CLI (Más automatizado)

### Ventajas:
- ✅ Puedo ejecutar comandos git directamente
- ✅ Autenticación más fácil
- ✅ Integración con GitHub

### Instalación:

**En macOS:**
```bash
brew install gh
```

**En Linux:**
```bash
# Ubuntu/Debian
sudo apt install gh

# Fedora
sudo dnf install gh
```

**En Windows:**
```bash
# Con Chocolatey
choco install gh

# O descarga desde: https://cli.github.com/
```

### Configuración:

```bash
# Autenticarte con GitHub
gh auth login

# Seguir las instrucciones:
# 1. Selecciona "GitHub.com"
# 2. Selecciona "HTTPS"
# 3. Selecciona "Login with a web browser"
# 4. Copia el código que te da
# 5. Presiona Enter
# 6. Se abrirá tu navegador, pega el código
# 7. Autoriza la aplicación
```

### Después de configurar:

Una vez autenticado, yo podré ejecutar comandos git directamente en tu terminal.

---

## 📋 Opción 3: Personal Access Token (Avanzado)

### Ventajas:
- ✅ Control total sobre permisos
- ✅ Puedes revocar el acceso cuando quieras

### Creación del Token:

1. Ve a GitHub: https://github.com/settings/tokens
2. Haz clic en "Generate new token" > "Generate new token (classic)"
3. Configura:
   - **Note**: "MiniMonday Deploy"
   - **Expiration**: Elige una fecha (o "No expiration" si prefieres)
   - **Scopes**: Marca solo `repo` (todos los permisos de repositorio)
4. Haz clic en "Generate token"
5. **IMPORTANTE**: Copia el token inmediatamente (solo se muestra una vez)

### Configurar Git con el Token:

```bash
# Configurar git para usar el token
git remote set-url origin https://TU_TOKEN@github.com/TU_USUARIO/mini-monday.git

# O configurar credenciales globalmente
git config --global credential.helper store
# Cuando git pida credenciales, usa:
# Username: TU_USUARIO
# Password: TU_TOKEN
```

**⚠️ IMPORTANTE**: Nunca compartas tu token. Guárdalo de forma segura.

---

## 🚀 Flujo de Trabajo Recomendado

### Para cambios pequeños (Opción 1):

1. Yo te preparo los cambios
2. Te doy estos comandos:
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push origin main
   ```
3. Tú los ejecutas
4. Vercel despliega automáticamente

### Para cambios frecuentes (Opción 2):

1. Instalas GitHub CLI (`brew install gh`)
2. Te autenticas (`gh auth login`)
3. Yo ejecuto los comandos directamente
4. Vercel despliega automáticamente

---

## 🔄 Configuración Inicial (Una sola vez)

### Paso 1: Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `mini-monday`
3. Descripción: "MiniMonday - Sistema de gestión de proyectos"
4. **NO** marques "Initialize with README"
5. Haz clic en "Create repository"

### Paso 2: Conectar tu repositorio local

```bash
# Inicializar git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit: MiniMonday ready for deployment"

# Agregar el repositorio remoto (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/mini-monday.git

# Cambiar a rama main
git branch -M main

# Subir a GitHub
git push -u origin main
```

### Paso 3: Conectar con Vercel

1. Ve a https://vercel.com
2. "Add New..." > "Project"
3. Selecciona tu repositorio `mini-monday`
4. Configura las variables de entorno
5. Haz clic en "Deploy"

---

## ✅ Verificar que todo funciona

Después de hacer push, verifica:

1. **GitHub**: Ve a tu repositorio y verifica que los archivos estén ahí
2. **Vercel**: Ve al dashboard y verifica que el deploy esté en progreso
3. **URL**: Una vez completado, visita tu URL de Vercel

---

## 🆘 Solución de Problemas

### Error: "remote origin already exists"
```bash
# Ver el remote actual
git remote -v

# Cambiar el URL
git remote set-url origin https://github.com/TU_USUARIO/mini-monday.git
```

### Error: "authentication failed"
- Verifica que tu token/usuario sea correcto
- Si usas token, asegúrate de que tenga permisos `repo`

### Error: "branch 'main' does not exist"
```bash
# Crear y cambiar a main
git checkout -b main
git push -u origin main
```

---

## 📞 ¿Qué opción prefieres?

Dime qué opción te parece mejor y te ayudo a configurarla:

1. **Opción 1**: Push manual (tú ejecutas los comandos)
2. **Opción 2**: GitHub CLI (yo ejecuto los comandos)
3. **Opción 3**: Personal Access Token (más control)

