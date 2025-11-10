# MiniMonday - Gestión de Proyectos

Una aplicación de gestión de proyectos estilo Monday.com para agencias de marketing, construida con Next.js 14, TypeScript y Google Sheets como base de datos.

## 🚀 Características

- **Gestión de Workspaces**: Organiza proyectos por equipos
- **Vista Kanban**: Drag & drop para gestión visual de tareas
- **Vista Lista**: Lista ordenable de tareas
- **Vista Calendario**: Visualización temporal de tareas
- **Mi Trabajo**: Dashboard personal de tareas asignadas
- **Comentarios y Archivos**: Colaboración en tiempo real
- **Roles y Permisos**: Control de acceso granular
- **Búsqueda Avanzada**: Filtros por etiquetas, estado, prioridad

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Estado**: TanStack Query (React Query)
- **Formularios**: React Hook Form + Zod
- **Autenticación**: NextAuth.js con Google OAuth
- **Base de Datos**: Google Sheets API
- **Drag & Drop**: @dnd-kit
- **Editor Markdown**: @uiw/react-md-editor
- **Iconos**: lucide-react

## 📋 Prerrequisitos

1. **Node.js** 18+ y npm
2. **Cuenta de Google** para Google Sheets API
3. **Cuenta de Google Cloud** para OAuth

## 🔧 Configuración

### 1. Clonar y Instalar Dependencias

```bash
git clone <repository-url>
cd MiniMonday
npm install
```

### 2. Configurar Google Sheets API

#### Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Sheets API**:
   - Ve a "APIs y servicios" > "Biblioteca"
   - Busca "Google Sheets API" y habilítala

#### Paso 2: Crear Service Account

1. Ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "Crear credenciales" > "Cuenta de servicio"
3. Completa los detalles:
   - **Nombre**: `mini-monday-service`
   - **Descripción**: `Service account para MiniMonday`
4. Haz clic en "Crear y continuar"
5. En "Permisos", selecciona "Editor" (o crea un rol personalizado)
6. Haz clic en "Listo"

#### Paso 3: Generar Clave JSON

1. En la lista de cuentas de servicio, haz clic en la que acabas de crear
2. Ve a la pestaña "Claves"
3. Haz clic en "Agregar clave" > "Crear nueva clave"
4. Selecciona "JSON" y haz clic en "Crear"
5. **Guarda el archivo JSON** de forma segura

#### Paso 4: Crear Spreadsheet

1. Ve a [Google Sheets](https://sheets.google.com/)
2. Crea una nueva hoja de cálculo
3. Nómbrala "MiniMonday Agencia"
4. Copia el **ID de la hoja** de la URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

#### Paso 5: Compartir Spreadsheet

1. En tu spreadsheet, haz clic en "Compartir"
2. Agrega el email de la **Service Account** (del archivo JSON)
3. Dale permisos de "Editor"
4. El email se ve así: `mini-monday-service@tu-proyecto.iam.gserviceaccount.com`

### 3. Configurar Google OAuth

#### Paso 1: Crear OAuth Client

1. En Google Cloud Console, ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "Crear credenciales" > "ID de cliente de OAuth 2.0"
3. Selecciona "Aplicación web"
4. Configura:
   - **Nombre**: `MiniMonday Web Client`
   - **Orígenes autorizados**: `http://localhost:3000`
   - **URI de redirección**: `http://localhost:3000/api/auth/callback/google`
5. Haz clic en "Crear"
6. **Guarda el Client ID y Client Secret**

### 4. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Google Sheets API Configuration
GOOGLE_PROJECT_ID=tu-proyecto-id
GOOGLE_CLIENT_EMAIL=mini-monday-service@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n"
SHEETS_SPREADSHEET_ID=tu-spreadsheet-id

# NextAuth Configuration
NEXTAUTH_SECRET=tu-nextauth-secret-key-aqui
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (for NextAuth)
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

**Importante**: 
- Reemplaza `TU_PRIVATE_KEY_AQUI` con la clave privada del archivo JSON (mantén los `\n`)
- Genera un `NEXTAUTH_SECRET` seguro: `openssl rand -base64 32`

### 5. Poblar Base de Datos

Ejecuta el script de seed para crear las tablas y datos de demostración:

```bash
npm run seed
```

Este script creará:
- ✅ Todas las hojas necesarias en Google Sheets
- ✅ Workspace de demostración "Agencia Marketing"
- ✅ 3 proyectos de ejemplo
- ✅ 9 tareas de demostración
- ✅ Etiquetas y miembros

### 6. Ejecutar la Aplicación

```bash
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Estructura del Proyecto

```
MiniMonday/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Páginas de autenticación
│   ├── (dash)/                   # Dashboard principal
│   ├── api/                      # API endpoints
│   └── globals.css               # Estilos globales
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base (shadcn/ui)
│   ├── KanbanBoard.tsx           # Tablero Kanban
│   ├── TaskCard.tsx              # Tarjeta de tarea
│   └── TaskDrawer.tsx            # Panel lateral de tarea
├── lib/                          # Utilidades y lógica
│   ├── sheets/                   # Acceso a Google Sheets
│   │   ├── client.ts             # Cliente de Google Sheets
│   │   └── dao/                  # Data Access Objects
│   ├── auth.ts                   # Configuración NextAuth
│   ├── validation.ts             # Esquemas Zod
│   └── utils.ts                  # Utilidades generales
├── scripts/                      # Scripts de utilidad
│   └── seed-sheets.ts            # Seed de base de datos
└── README.md                     # Este archivo
```

## 🎯 Uso de la Aplicación

### 1. **Autenticación**
- Inicia sesión con tu cuenta de Google
- La aplicación creará automáticamente tu perfil

### 2. **Workspaces**
- Cada workspace representa un equipo o cliente
- Los miembros pueden tener roles: Owner, Admin, Member

### 3. **Proyectos**
- Organiza tareas por proyecto dentro de un workspace
- Cada proyecto puede tener su propio equipo

### 4. **Tareas**
- **Estados**: Backlog → Por Hacer → En Progreso → Revisión → Completado
- **Prioridades**: Baja, Media, Alta, Urgente
- **Asignación**: Asigna tareas a miembros del equipo
- **Fechas**: Establece fechas de vencimiento y estimaciones

### 5. **Vistas**
- **Kanban**: Drag & drop entre columnas de estado
- **Lista**: Vista tabular ordenable
- **Calendario**: Vista temporal de tareas
- **Mi Trabajo**: Dashboard personal

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests E2E
npm run test:e2e
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Despliega automáticamente

### Variables de Entorno en Producción

Asegúrate de configurar todas las variables de entorno en tu plataforma de despliegue:

```env
GOOGLE_PROJECT_ID=tu-proyecto-id
GOOGLE_CLIENT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SHEETS_SPREADSHEET_ID=tu-spreadsheet-id
NEXTAUTH_SECRET=tu-secret-seguro
NEXTAUTH_URL=https://tu-dominio.com
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

## 🔒 Seguridad

- ✅ Autenticación con NextAuth.js
- ✅ Autorización basada en roles
- ✅ Validación de datos con Zod
- ✅ Optimistic locking para prevenir conflictos
- ✅ Variables de entorno seguras

## 📈 Próximas Características

- [ ] Notificaciones en tiempo real
- [ ] Integración con Google Calendar
- [ ] Sincronización con Google Drive
- [ ] Reportes y analytics
- [ ] API webhooks
- [ ] Modo oscuro
- [ ] Aplicación móvil

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas:

1. Revisa la [documentación de Google Sheets API](https://developers.google.com/sheets/api)
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el Service Account tenga permisos en el spreadsheet
4. Revisa los logs de la consola para errores específicos

---

**¡Disfruta gestionando tus proyectos con MiniMonday! 🎉**
