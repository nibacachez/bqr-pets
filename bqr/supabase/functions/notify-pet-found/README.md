# SUPABASE EDGE FUNCTION: notify-pet-found

Esta Edge Function se ejecuta automáticamente cuando se inserta un nuevo registro en la tabla `reportes_extravio`.

## ✅ Características

- ✓ Se ejecuta automáticamente por trigger en Supabase
- ✓ Obtiene datos del reporte, mascota y usuario
- ✓ Crea link de Google Maps con coordenadas GPS
- ✓ Envía email HTML profesional y responsivo
- ✓ Manejo de errores y logs
- ✓ Soporta múltiples tipos de contacto (WhatsApp, Teléfono, Email)

## 🚀 Deployment

### Opción 1: Deploy Automático (Recomendado)

```bash
# 1. Asegúrate de estar en la raíz del proyecto
cd bqr

# 2. Deploy a Supabase
supabase functions deploy notify-pet-found

# 3. Verifica que se haya deployado correctamente
supabase functions list
```

### Opción 2: Deploy Manual

1. Ve a https://supabase.com/dashboard/project/[ID]/functions
2. Click en "Create new function"
3. Nombre: `notify-pet-found`
4. Copia el código de `index.ts`
5. Deploy

## 🔧 Configuración de Variables de Entorno

La Edge Function requiere estas variables de entorno en Supabase:

### 1. SENDGRID_API_KEY (Requerido para enviar emails)

```bash
# En el dashboard de Supabase:
# Settings > Secrets > New Secret

# Nombre: SENDGRID_API_KEY
# Valor: tu-api-key-de-sendgrid
```

#### Cómo obtener SendGrid API Key:

1. Ve a https://sendgrid.com
2. Crea cuenta gratuita (hasta 100 emails/día)
3. Ve a Settings > API Keys
4. Click "Create API Key"
5. Nombre: "BQR Notifications"
6. Permisos: Mail Send
7. Copia la clave

### 2. SENDGRID_FROM_EMAIL (Requerido)

```bash
# Nombre: SENDGRID_FROM_EMAIL
# Valor: noreply@bqr-pets.com (o tu email verificado en SendGrid)
```

### 3. ADMIN_EMAIL (Opcional - fallback)

```bash
# Nombre: ADMIN_EMAIL
# Valor: tu-email@tudominio.com

# Se usa si no hay email del usuario en la base de datos
```

## 🔗 Configurar Trigger Automático

Esta es la parte MÁS IMPORTANTE para que la función se ejecute automáticamente.

### Paso 1: Crear Función SQL en Supabase

En el SQL Editor de Supabase, ejecuta:

```sql
-- 1. Crear tabla de logs (opcional, para debugging)
CREATE TABLE IF NOT EXISTS functions_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT,
    report_id UUID,
    status TEXT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear función que llama a la Edge Function
CREATE OR REPLACE FUNCTION public.notify_pet_found()
RETURNS TRIGGER AS $$
BEGIN
    -- Llamar a la Edge Function usando http_post
    -- Esta función usa la extensión http que Supabase proporciona
    PERFORM
        net.http_post(
            url := concat(
                'https://',
                current_setting('app.supabase_url') -> 'host',
                '/functions/v1/notify-pet-found'
            ),
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', concat('Bearer ', current_setting('app.supabase_service_role_key'))
            ),
            body := jsonb_build_object(
                'record', row_to_json(NEW)
            )
        );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log del error
    INSERT INTO functions_logs (function_name, report_id, status, message)
    VALUES ('notify_pet_found', NEW.id, 'error', SQLERRM);
    
    -- No fallar la inserción del reporte, solo loguear el error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear trigger en tabla reportes_extravio
DROP TRIGGER IF EXISTS trigger_notify_pet_found ON reportes_extravio;

CREATE TRIGGER trigger_notify_pet_found
AFTER INSERT ON reportes_extravio
FOR EACH ROW
EXECUTE FUNCTION public.notify_pet_found();

-- 4. Habilitar extensión http (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA public;
```

### Alternativa Más Simple: Usar pg_net

Si la opción anterior no funciona, usa pg_net (recomendado):

```sql
-- Crear función con pg_net (más confiable)
CREATE OR REPLACE FUNCTION public.notify_pet_found()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://tu-proyecto.supabase.co/functions/v1/notify-pet-found',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ANON_KEY_AQUI'
        ),
        body := row_to_json(NEW)::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_pet_found
AFTER INSERT ON reportes_extravio
FOR EACH ROW
EXECUTE FUNCTION public.notify_pet_found();
```

## 🧪 Testing Local

### 1. Con Supabase CLI (Development)

```bash
# 1. Inicia Supabase local
supabase start

# 2. Serve la función localmente
supabase functions serve notify-pet-found

# 3. En otra terminal, inserta un reporte de prueba
supabase db push

# O usando curl:
curl -X POST http://localhost:54321/functions/v1/notify-pet-found \
  -H "Content-Type: application/json" \
  -d '{
    "record": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "mascota_id": "550e8400-e29b-41d4-a716-446655440000",
      "nombre_rescatador": "Juan Pérez",
      "contacto_rescatador": "juan@email.com",
      "tipo_contacto": "email",
      "mensaje_ubicacion": "Encontrado en el parque central",
      "latitud": 40.7128,
      "longitud": -74.0060,
      "estado": "nuevo",
      "fecha_reporte": "2024-04-02T10:30:00Z"
    }
  }'
```

### 2. Testing en Producción

1. Ve a https://supabase.com/dashboard/project/[ID]/functions
2. Click en `notify-pet-found`
3. Click en "Invoke" en la esquina derecha
4. Usa el payload JSON de ejemplo
5. Observa los logs

## 📊 Estructura del Email

El email incluye:

- Header con branding BQR
- ✅ Alerta principal visual
- 🐾 Información de la mascota (nombre, especie, raza, color)
- 👤 Datos del rescatador (nombre, contacto, tipo)
- 📍 Ubicación textual descrita
- 🗺️ Link a Google Maps con coordenadas
- ⚠️ Notas médicas (si existen)
- 📋 Detalles de la fecha y hora
- Botón para ver reporte completo
- ID de referencia del reporte

## 🔐 Seguridad

- Usa `SUPABASE_SERVICE_ROLE_KEY` para acceder a datos (solo en Edge Functions)
- Los emails solo se envían si hay credenciales de SendGrid
- Rate limiting en SendGrid (plan gratuito: 100 emails/día)
- Fallback a admin email si no hay email del usuario
- Logs de errores para debugging

## 📝 Logs y Debugging

Para ver los logs de la función:

```bash
# Ver logs en tiempo real
supabase functions list
supabase functions logs notify-pet-found --limit 50

# O en el dashboard:
# Dashboard > Functions > notify-pet-found > Logs
```

## 🐛 Troubleshooting

### Email no se envía

**Solución:**
1. Verifica que `SENDGRID_API_KEY` esté configurado en Secrets
2. Asegúrate de que SendGrid tiene saldo
3. Verifica los logs: Dashboard > Functions > Logs
4. Comprueba el email `SENDGRID_FROM_EMAIL` está verificado en SendGrid

### Trigger no se ejecuta

**Solución:**
1. Verifica que el trigger esté creado: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_notify_pet_found';`
2. Chequea que la extensión `http` esté habilitada: `SELECT * FROM pg_extension WHERE extname = 'http';`
3. Revisa los logs de Supabase
4. Intenta insertar manualmente: `INSERT INTO reportes_extravio (...) VALUES (...);`

### Coordenadas GPS mal formateadas

**Solución:**
- Las coordenadas se esperan como DECIMAL(10,8) y DECIMAL(11,8)
- Google Maps acepta: `https://www.google.com/maps?q=40.7128,-74.0060`
- Si no hay coordenadas, simplemente no se muestra el link de Google Maps

## 🚀 Próximos Pasos

1. **Implementar notificaciones SMS** (Twilio)
2. **Agregar notificaciones push** (Firebase Cloud Messaging)
3. **Sistema de chat** entre rescatador y dueño
4. **Tracking de reporte** (estado: nuevo → contactado → resuelto)
5. **Reportes estadísticos** (mascotas encontradas, tiempo promedio, etc.)

## 📚 Referencias

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [SendGrid Email API](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
