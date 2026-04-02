# CONFIGURACIÓN DE SUPABASE Y PÁGINA DE REPORTE

## 📋 Resumen

Se han implementado:

1. **Cliente de Supabase** (`src/lib/supabase/client.ts`)
   - Configuración centralizada para todas las consultas a Supabase

2. **Página Pública de Reporte** (`src/app/pet/[id]/page.tsx`)
   - Ruta: `/pet/[id]` (accesible públicamente por QR)
   - Características completas implementadas

3. **Variables de Entorno** (`.env.local.example`)
   - Plantilla de configuración

## 🚀 CONFIGURACIÓN REQUERIDA

### Paso 1: Copiar el archivo de ejemplo

```bash
cp .env.local.example .env.local
```

### Paso 2: Obtener credenciales de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Crea un nuevo proyecto o abre uno existente
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Paso 3: Actualizar `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-llave-anonima-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Paso 4: Ejecutar migraciones SQL

```bash
# Copiar y ejecutar el SQL completo en el editor SQL de Supabase
# Archivo: ../schema.sql (SQL para crear tablas)
```

## ✅ CARACTERÍSTICAS IMPLEMENTADAS EN `/pet/[id]`

### 1. **Obtener datos de la mascota** ✓
- Consulta a tabla `mascotas` usando el ID
- Campos: nombre, especie, raza, color, foto_url, notas_medicas
- Manejo de errores si no existe

### 2. **Mensaje Amigable** ✓
```
¡Hola! 🐾
Me llamo [Nombre] y estoy perdido...
```

### 3. **Formulario Profesional** ✓
**Campos:**
- **Nombre rescatador** - Text input con placeholder
- **Tipo de Contacto** - Select: WhatsApp / Teléfono / Email
- **Contacto rescatador** - Text/Email con placeholder dinámico
- **Mensaje ubicación** - TextArea con instrucciones detalladas

### 4. **Botón GPS** ✓
- Usa `navigator.geolocation` de HTML5 Geolocation API
- Obtiene latitud y longitud automáticamente
- Manejo de permisos y errores
- Muestra coordenadas obtenidas
- Guardadas en estado oculto del formulario

### 5. **Guardar en Supabase** ✓
```typescript
await supabase
  .from('reportes_extravio')
  .insert([{
    mascota_id,
    nombre_rescatador,
    contacto_rescatador,
    tipo_contacto,
    mensaje_ubicacion,
    latitud,
    longitud,
    estado: 'nuevo'
  }])
```

## 📱 FLUJO DE USUARIO

```
1. Rescatador encuentra mascota perdida
2. Escanea QR con teléfono
3. QR apunta a: https://bqr-pets.vercel.app/pet/550e8400-e29b-41d4-a716-446655440000
4. Página carga datos de la mascota (nombre, foto, especie, etc)
5. Muestra mensaje: "¡Hola! Me llamo Max y estoy perdido"
6. Rescatador llena formulario:
   - Su nombre y contacto
   - Dónde exactamente encontró la mascota
   - (Opcional) Presiona botón de GPS
7. Envía el formulario
8. Reporte se guarda en tabla reportes_extravio
9. Dueño recibe notificación (implementar después)
```

## 🔐 SEGURIDAD

### Tabla: `mascotas`
```sql
ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;

-- Solo el dueño puede ver sus mascotas
CREATE POLICY "usuarios_ver_mascotas_propias" ON mascotas
FOR SELECT USING (dueno_id = auth.uid());
```

### Tabla: `reportes_extravio`
```sql
ALTER TABLE reportes_extravio ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede crear reportes (página pública)
CREATE POLICY "reportes_crear_publico" ON reportes_extravio
FOR INSERT WITH CHECK (true);

-- Solo el dueño de la mascota ve los reportes
CREATE POLICY "reportes_ver_propios" ON reportes_extravio
FOR SELECT USING (
  mascota_id IN (
    SELECT id FROM mascotas
    WHERE dueno_id = auth.uid()
  )
);
```

## 🧪 TESTING LOCAL

```bash
cd bqr
npm run dev
```

Acceso:
- Página de ejemplo: `http://localhost:3000/dashboard/mascota-ejemplo`
- Generar QR desde dashboard
- Escanear QR o acceder a: `http://localhost:3000/pet/550e8400-e29b-41d4-a716-446655440000`

## 📦 DEPENDENCIAS INSTALADAS

```json
{
  "@supabase/supabase-js": "^2.x.x",
  "qrcode.react": "^1.x.x"
}
```

## 🎯 PRÓXIMOS PASOS

1. **Notificaciones**
   - Enviar email al dueño cuando llega reporte
   - Elegir: SendGrid, Resend, o AWS SES

2. **Dashboard de Reportes**
   - Crear `/dashboard/reportes` para ver hallazgos
   - Mostrar en mapa usando leaflet o mapbox

3. **Autenticación**
   - Implementar login/registro con Supabase Auth
   - Proteger rutas `/dashboard/*`

4. **Notificaciones Push**
   - Agregar push notifications cuando alguien reporta
   - Usar Firebase Cloud Messaging

5. **Sistema de Mensajes**
   - Chat privado entre rescatador y dueño
   - Evitar compartir datos directamente

## 📝 ESTRUCTURA DE ARCHIVOS

```
src/
├── app/
│   ├── pet/
│   │   ├── [id]/
│   │   │   └── page.tsx              ← NUEVA PÁGINA PÚBLICA
│   │   └── [mascotaId]/
│   │       └── page.tsx              ← Página anterior
│   └── ...
├── lib/
│   └── supabase/
│       └── client.ts                 ← NUEVO: Cliente de Supabase
├── components/
│   └── QRCodeGenerator.tsx
└── ...
.env.local.example                     ← Plantilla de variables
```

## ❓ TROUBLESHOOTING

### Error: "Supabase no está configurado"
- Verifica que `.env.local` exista
- Comprueba que las variables estén correctas
- Reinicia el servidor (`npm run dev`)

### Error: "mascota_id" does not exist
- La tabla `mascotas` no existe en tu Supabase
- Ejecuta el SQL de creación de tablas

### Error: Geolocation not working
- El navegador necesita HTTPS en producción
- En localhost funciona HTTP
- Asegúrate de que el usuario permita acceso a ubicación

### Error: CORS
- Configura CORS en Supabase
- Ve a Settings → Auth → Redirect URLs
- Agregar: `http://localhost:3000` y `https://tu-app.vercel.app`

## 🎓 REFERENCIAS

- [Supabase Docs](https://supabase.com/docs)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
