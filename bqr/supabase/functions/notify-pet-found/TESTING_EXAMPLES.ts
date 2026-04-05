/**
 * EJEMPLOS DE TESTING PARA EDGE FUNCTION
 * 
 * Usa estos ejemplos para probar la Edge Function
 * en diferentes escenarios
 */

// ============================================
// EJEMPLO 1: Payload con coordenadas GPS
// ============================================

const payload1 = {
  record: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    mascota_id: "550e8400-e29b-41d4-a716-446655440000",
    nombre_rescatador: "María García",
    contacto_rescatador: "+34 666 123 456",
    tipo_contacto: "whatsapp",
    mensaje_ubicacion: "Encontré a la mascota en el parque central, cerca del árbol grande. Estaba deambulando sin collar. Parece estar en buen estado de salud.",
    latitud: 40.7128,
    longitud: -74.0060,
    estado: "nuevo",
    fecha_reporte: "2024-04-02T10:30:00Z"
  }
};

// ============================================
// EJEMPLO 2: Payload sin coordenadas GPS
// ============================================

const payload2 = {
  record: {
    id: "234e5678-f90c-23e4-b567-537725285111",
    mascota_id: "550e8400-e29b-41d4-a716-446655440000",
    nombre_rescatador: "Juan Pérez",
    contacto_rescatador: "juan@example.com",
    tipo_contacto: "email",
    mensaje_ubicacion: "Encontré este perrita en la calle Avenida Principal, esquina con Calle Secundaria. Tiene collar azul pero sin nombre.",
    latitud: null,
    longitud: null,
    estado: "nuevo",
    fecha_reporte: "2024-04-02T15:45:00Z"
  }
};

// ============================================
// EJEMPLO 3: Testing local con curl
// ============================================

/*
# Test 1: Con coordenadas GPS

curl -X POST http://localhost:54321/functions/v1/notify-pet-found \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPABASE_ANON_KEY" \
  -d '{
    "record": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "mascota_id": "550e8400-e29b-41d4-a716-446655440000",
      "nombre_rescatador": "María García",
      "contacto_rescatador": "maria@example.com",
      "tipo_contacto": "email",
      "mensaje_ubicacion": "Encontrado en el parque central",
      "latitud": 40.7128,
      "longitud": -74.0060,
      "estado": "nuevo",
      "fecha_reporte": "2024-04-02T10:30:00Z"
    }
  }'

# Test 2: Sin coordenadas GPS

curl -X POST http://localhost:54321/functions/v1/notify-pet-found \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPABASE_ANON_KEY" \
  -d '{
    "record": {
      "id": "234e5678-f90c-23e4-b567-537725285111",
      "mascota_id": "550e8400-e29b-41d4-a716-446655440000",
      "nombre_rescatador": "Juan Pérez",
      "contacto_rescatador": "juan@example.com",
      "tipo_contacto": "email",
      "mensaje_ubicacion": "Encontrado en la esquina de Calle Principal",
      "latitud": null,
      "longitud": null,
      "estado": "nuevo",
      "fecha_reporte": "2024-04-02T10:30:00Z"
    }
  }'
*/

// ============================================
// EJEMPLO 4: Test desde Node.js
// ============================================

/*
const fetch = require('node-fetch');

async function testEdgeFunction() {
  const response = await fetch(
    'http://localhost:54321/functions/v1/notify-pet-found',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SUPABASE_ANON_KEY'
      },
      body: JSON.stringify({
        record: {
          id: "test-123",
          mascota_id: "550e8400-e29b-41d4-a716-446655440000",
          nombre_rescatador: "Test User",
          contacto_rescatador: "test@example.com",
          tipo_contacto: "email",
          mensaje_ubicacion: "Test location",
          latitud: 40.7128,
          longitud: -74.0060,
          estado: "nuevo",
          fecha_reporte: new Date().toISOString()
        }
      })
    }
  );

  const result = await response.json();
  console.log('Response:', result);
}

testEdgeFunction();
*/

// ============================================
// EJEMPLO 5: SQL para insertar reporte de test
// ============================================

/*
-- Test 1: Insertar mascota primero (si no existe)
INSERT INTO mascotas (
  id,
  dueno_id,
  nombre,
  especie,
  raza,
  color,
  foto_url,
  notas_medicas,
  fecha_registro
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'user-uuid-aqui',
  'Max',
  'Perro',
  'Pastor Alemán',
  'Negro y Marrón',
  null,
  'Alérgico a la penicilina',
  NOW()
);

-- Test 2: Insertar el reporte (esto DEBE activar el trigger)
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
  '550e8400-e29b-41d4-a716-446655440000',
  'María García',
  'maria@example.com',
  'email',
  'Encontrado en el parque central, cerca del árbol grande',
  40.7128,
  -74.0060,
  'nuevo'
);

-- Test 3: Ver el log de la ejecución
SELECT * FROM public.get_function_logs(5) ORDER BY created_at DESC;
*/

// ============================================
// EJEMPLO 6: Validación de coordenadas
// ============================================

const validateCoordinates = (lat, lng) => {
  // Latitud: -90 a 90
  if (lat && (lat < -90 || lat > 90)) {
    return false;
  }
  
  // Longitud: -180 a 180
  if (lng && (lng < -180 || lng > 180)) {
    return false;
  }
  
  return true;
};

// ============================================
// EJEMPLO 7: Construir URL de Google Maps
// ============================================

const buildGoogleMapsUrl = (lat, lng) => {
  if (!lat || !lng) return null;
  
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

// Ejemplos:
console.log(buildGoogleMapsUrl(40.7128, -74.0060));
// Output: https://www.google.com/maps?q=40.7128,-74.0060

console.log(buildGoogleMapsUrl(null, null));
// Output: null

// ============================================
// EJEMPLO 8: Estructuras TypeScript
// ============================================

interface ReportData {
  id: string;
  mascota_id: string;
  nombre_rescatador: string;
  contacto_rescatador: string;
  tipo_contacto: 'whatsapp' | 'telefono' | 'email';
  mensaje_ubicacion: string;
  latitud: number | null;
  longitud: number | null;
  estado: string;
  fecha_reporte: string;
}

interface MascotaData {
  id: string;
  nombre: string;
  especie: string;
  raza?: string;
  color?: string;
  foto_url?: string;
  dueno_id: string;
  notas_medicas?: string;
}

interface UsuarioData {
  id: string;
  email: string;
  nombre_completo: string;
  telefono?: string;
}

// ============================================
// EJEMPLO 9: Response esperados
// ============================================

/*
ÉXITO (200):
{
  "success": true,
  "message": "Notificación enviada exitosamente",
  "report_id": "123e4567-e89b-12d3-a456-426614174000",
  "email_sent_to": "maria@example.com"
}

ERROR - MASCOTA NO ENCONTRADA (404):
{
  "success": false,
  "error": "Mascota no encontrada"
}

ERROR - USUARIO NO ENCONTRADO (404):
{
  "success": false,
  "error": "Usuario no encontrado"
}

ERROR - SENDGRID NO CONFIGURADO (200):
{
  "success": false,
  "message": "SendGrid no configurado",
  "report_id": "123e4567-e89b-12d3-a456-426614174000"
}

ERROR - EMAIL SEND FAILED (500):
{
  "success": false,
  "error": "Email send failed",
  "details": "Invalid SendGrid API Key"
}
*/

// ============================================
// EJEMPLO 10: Debugging la Edge Function
// ============================================

/*
// Enable debug logs en la Edge Function:

// En index.ts, agrega al inicio:
Deno.env.set('DEBUG', 'true');

// Luego usa:
if (Deno.env.get('DEBUG')) {
  console.log('DEBUG:', variableName);
}

// Ver logs en:
// Dashboard > Functions > notify-pet-found > Logs
*/

// ============================================
// CHECKLIST ANTES DE PRODUCCIÓN
// ============================================

/*
✅ SendGrid API Key configurado como Secret
✅ SENDGRID_FROM_EMAIL verificado en SendGrid
✅ Trigger create en Supabase
✅ Edge Function deployada correctamente
✅ RLS habilitado en mascotas y usuarios
✅ Permisos correctos en Supabase
✅ Email template testeado
✅ Google Maps URLs funcionan
✅ Logs se guardan correctamente
✅ Fallback a ADMIN_EMAIL si no hay usuario
✅ Rate limiting implementado
✅ Error handling cubierto
✅ CORS configurado en Supabase

Las coordenadas GPS válidas son:
- Latitud: -90 a 90
- Longitud: -180 a 180
*/
