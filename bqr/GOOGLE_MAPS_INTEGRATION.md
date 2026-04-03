# Integración Google Maps + Notificaciones

## 🗺️ Cómo Funciona el Sistema

### 1. **Captura de GPS en la Página Pública** (`/pet/[id]`)

Cuando el rescatador escanea el QR de una mascota perdida:

1. **Abre la página pública** `/pet/[id]` donde ve la foto y datos de la mascota
2. **Llenar formulario** con su nombre, contacto y descripción de dónde encontró la mascota
3. **Presiona botón GPS** "📍 Enviar Mi Ubicación GPS"
   - El navegador solicita permiso de ubicación
   - Se capturan `latitud` y `longitud` automáticamente
   - Se muestra un indicador de éxito con las coordenadas

```javascript
// Ejemplo de coordenadas capturadas:
latitud: 4.7110,
longitud: -74.0060  // Bogotá, Colombia
```

### 2. **Guardar Reporte en Supabase**

El formulario se envía a la tabla `reportes_extravio` con:

```typescript
{
  mascota_id: "uuid-de-mascota",
  nombre_rescatador: "Juan Pérez",
  contacto_rescatador: "+57 312 456 7890",
  tipo_contacto: "whatsapp",
  mensaje_ubicacion: "Encontré la mascota cerca de...",
  latitud: 4.7110,
  longitud: -74.0060,
  maps_link: "https://maps.google.com/?q=4.7110,-74.0060",  // ← GENERADO AUTOMÁTICO
  fecha_reporte: "2024-04-02T10:30:00Z",
  estado: "pendiente"
}
```

### 3. **Trigger Automático para Notificación**

Una base de datos trigger en Supabase detecta cuando se inserta un nuevo reporte:

```sql
-- En supabase/migrations/enable_edge_function_trigger.sql
CREATE OR REPLACE FUNCTION notify_pet_found()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('reportes_extravio', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_reportes_extravio_insert
  AFTER INSERT ON reportes_extravio
  FOR EACH ROW
  EXECUTE FUNCTION notify_pet_found();
```

### 4. **Edge Function Envía Email con Google Maps**

La Edge Function en Supabase (`supabase/functions/notify-pet-found/index.ts`) ejecuta:

1. **Obtiene los datos:**
   - Info del reporte (incluyendo `maps_link`)
   - Info de la mascota
   - Info del dueño (usuario que creó la mascota)

2. **Genera HTML profesional** con:
   - Foto de la mascota
   - Nombre de la mascota
   - Datos del rescatador (nombre, contacto)
   - Descripción de dónde se encontró
   - **LINK DIRECTO A GOOGLE MAPS** con las coordenadas

3. **Envía por SendGrid** al email del dueño

### 5. **Ejemplo de Email que Recibe el Dueño**

```
ASUNTO: 🐾 ¡ENCONTRARON A MI MASCOTA! - [Nombre Mascota]

CONTENIDO HTML:
┌─────────────────────────────────────┐
│ BQR - Recuperación de Mascotas      │
├─────────────────────────────────────┤
│                                     │
│  🐾 ¡BUENAS NOTICIAS!              │
│                                     │
│  Alguien encontró a tu mascota:     │
│  [FOTO DE LA MASCOTA]               │
│                                     │
│  Nombre: Max                        │
│  Tipo: Perro                        │
│                                     │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│  ┃ INFORMACIÓN DEL RESCATADOR    ┃ │
│  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ │
│  ┃ Nombre: Juan Martínez         ┃ │
│  ┃ Contacto: +57 312 456 7890    ┃ │
│  ┃ Tipo: WhatsApp                ┃ │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                     │
│  📍 UBICACIÓN:                      │
│  "Lo encontré cerca de la plaza,    │
│   calle 5 con carrera 7"            │
│                                     │
│  🗺️  VER EN GOOGLE MAPS:            │
│  [BOTÓN ROJO: VER UBICACIÓN]        │
│  https://maps.google.com/?q=4.7110,-74.0060
│                                     │
│  COORDENADAS: 4.7110° N, -74.0060° O
│                                     │
│  ℹ️  Presiona el botón para ver     │
│  exactamente dónde está tu mascota  │
│                                     │
└─────────────────────────────────────┘
```

## 📱 URLs de Google Maps

### Formato Básico
```
https://maps.google.com/?q=LATITUD,LONGITUD
```

### Ejemplos
```
# Bogotá, Colombia
https://maps.google.com/?q=4.7110,-74.0060

# Buenos Aires, Argentina
https://maps.google.com/?q=-34.6037,-58.3816

# Madrid, España
https://maps.google.com/?q=40.4168,-3.7038
```

### Qué Funciona
✅ Abre en Google Maps Web
✅ Abre en Google Maps App (si está instalada)
✅ Muestra marcador en ubicación exacta
✅ Permite navegar desde ubicación actual del usuario

### Parámetros Adicionales (Opcionales)
```
# Con zoom
https://maps.google.com/?q=4.7110,-74.0060&z=15

# Con nombre/etiqueta
https://maps.google.com/?q=4.7110,-74.0060+(Mascota Encontrada)

# Con vista de satélite
https://maps.google.com/?q=4.7110,-74.0060&layer=c
```

## 🔄 Flujo Completo

```
1. Rescatador abre /pet/[id]
   ↓
2. Ve foto y datos de mascota
   ↓
3. Llena formulario + presiona GPS
   ↓
4. Navegador captura: "4.7110, -74.0060"
   ↓
5. Se genera Maps link:
   "https://maps.google.com/?q=4.7110,-74.0060"
   ↓
6. Reporte se envía a Supabase
   ↓
7. Database Trigger dispara Edge Function
   ↓
8. Edge Function obtiene reporte + mascota + usuario
   ↓
9. Genera HTML profesional CON BOTÓN DE MAPS
   ↓
10. SendGrid envía email al dueño
    ↓
11. Dueño presiona botón "VER UBICACIÓN"
    ↓
12. Google Maps abre en navegador/app
    ↓
13. Ve exactamente dónde está su mascota.
```

## 🚀 Implementación en Edge Function

```typescript
// supabase/functions/notify-pet-found/index.ts

// Crear el link de Google Maps
let mapsLink = null;
if (reporte.latitud && reporte.longitud) {
  mapsLink = `https://maps.google.com/?q=${reporte.latitud},${reporte.longitud}`;
}

// Incluir en HTML del email
const htmlContent = `
  ...
  <a href="${mapsLink}" class="button">
    <strong>🗺️ VER UBICACIÓN EN GOOGLE MAPS</strong>
  </a>
  ...
`;

// Enviar al dueño
await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get("SENDGRID_API_KEY")}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email: usuario.email }],
    }],
    from: { email: 'noreply@bqr.mascotas.com' },
    subject: `🐾 ¡ENCONTRARON A ${mascota.nombre}!`,
    html: htmlContent,
  }),
});
```

## 📊 Base de Datos

### Tabla `reportes_extravio`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| mascota_id | UUID | Link a tabla mascotas |
| nombre_rescatador | VARCHAR | Nombre de quien encontró |
| contacto_rescatador | VARCHAR | Teléfono/Email/WhatsApp |
| tipo_contacto | ENUM | 'whatsapp', 'telefono', 'email' |
| mensaje_ubicacion | TEXT | Descripción del lugar |
| latitud | FLOAT | Coordenada GPS |
| longitud | FLOAT | Coordenada GPS |
| **maps_link** | VARCHAR | ← **Google Maps URL** |
| fecha_reporte | TIMESTAMP | Cuándo se reportó |
| estado | ENUM | 'pendiente', 'completado', 'rechazado' |

## ⚙️ Variables de Entorno Necesarias

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Para Edge Function
SENDGRID_API_KEY=SG.xxxx...
```

## 🧪 Testing

### 1. Test del GPS
```javascript
// En navegador (console)
navigator.geolocation.getCurrentPosition(pos => {
  console.log(`Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`);
});
```

### 2. Test del Maps Link
```javascript
// Generar link de prueba
const lat = 4.7110, lng = -74.0060;
const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
window.open(mapsUrl); // ← Debe abrir Google Maps
```

### 3. Test de Email
```sql
-- En Supabase SQL Editor
-- Ejecutar esto genera un reporte que disparará la Edge Function:
INSERT INTO reportes_extravio (
  mascota_id,
  nombre_rescatador,
  contacto_rescatador,
  tipo_contacto,
  mensaje_ubicacion,
  latitud,
  longitud,
  estado
) VALUES (
  'uuid-mascota-aqui',
  'Test User',
  '+57 300 000 0000',
  'whatsapp',
  'Test location description',
  4.7110,
  -74.0060,
  'pendiente'
);
-- Verificar en logs de SendGrid si se envió correctamente
```

## 🐛 Troubleshooting

### El GPS no funciona
- ✅ Verificar que el sitio esté en HTTPS
- ✅ Permitir permisos de ubicación en navegador
- ✅ Probar en dispositivo móvil (más preciso)
- ✅ Verificar conexión de datos/WiFi

### El email no llega
- ✅ Verificar SENDGRID_API_KEY en variables de entorno
- ✅ Revisar spam/promotions en bandeja de entrada
- ✅ Verificar logs de Supabase Edge Functions
- ✅ Confirmar que el usuario tiene email en tabla

### El Maps link no abre
- ✅ Verificar que latitud y longitud no sean nulas
- ✅ Probar URL directamente en navegador
- ✅ Confirmar que formato es correcto: `q=LAT,LNG`

## 🔐 Seguridad

- ✅ GPS es opcional (rescatador puede describir ubicación manualmente)
- ✅ Datos del rescatador son protegidos con email del dueño
- ✅ No se muestra información del dueño en página pública
- ✅ Maps link es público pero apunta a ubicación general (puede estar imprecisa)

## 📚 Recursos

- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [SendGrid Email API](https://sendgrid.com/docs/for-developers/sending-email/)
