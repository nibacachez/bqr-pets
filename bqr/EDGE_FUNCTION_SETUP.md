# 🚀 SETUP COMPLETO: SUPABASE EDGE FUNCTION + EMAIL NOTIFICATIONS

## 📋 Resumen

Se ha creado una Edge Function en Deno que se ejecuta automáticamente cuando se inserta un nuevo reporte de mascota encontrada. La función envía un email profesional y estilizado al dueño de la mascota con todos los detalles del hallazgo.

## 📁 Archivos Creados

```
supabase/
├── functions/
│   └── notify-pet-found/
│       ├── index.ts                    ← Edge Function principal
│       ├── README.md                   ← Documentación detallada
│       └── dprint.json                 ← Configuración de formato
└── migrations/
    └── enable_edge_function_trigger.sql ← SQL para crear trigger
```

## 🔴 PASOS CRÍTICOS PARA IMPLEMENTAR

### PASO 1: Obtener SendGrid API Key

**SIN ESTO, NO FUNCIONARÁ EL ENVÍO DE EMAILS**

1. Ve a https://sendgrid.com
2. Haz clic en "Start Free"
3. Crea una cuenta
4. Verifica tu email
5. Inicia sesión en el dashboard
6. Ve a **Settings** → **API Keys**
7. Haz clic en **Create API Key**
   - Name: `BQR Mascotas`
   - Permisos: `Mail Send`
8. **COPIA LA CLAVE** (no se mostrará de nuevo)
9. También necesitas **verificar un email de envío**:
   - Ve a **Settings** → **Sender Authentication**
   - Click en **Verify a Single Sender**
   - Ingresa: `noreply@bqr-pets.com` (o tu email)
   - Verifica en tu bandeja

### PASO 2: Configurar Secrets en Supabase

1. Ve a https://supabase.com/dashboard
2. Abre tu proyecto BQR
3. Ve a **Settings** → **Secrets**
4. Click en **New Secret**

Agrega estos 3 secrets:

```
Nombre: SENDGRID_API_KEY
Valor: SG.xxxxxxxxxxxxxxxxxxxx  (la que copiaste de SendGrid)

Nombre: SENDGRID_FROM_EMAIL
Valor: noreply@bqr-pets.com

Nombre: ADMIN_EMAIL
Valor: tu-email@gmail.com
```

### PASO 3: Deploy la Edge Function

Opción A: Con Supabase CLI (Recomendado)

```bash
cd bqr

# 1. Instalar/actualizar Supabase CLI
npm install -g supabase

# 2. Login a Supabase
supabase login

# 3. Link al proyecto
supabase link --project-ref tu-proyecto-id

# 4. Deploy función
supabase functions deploy notify-pet-found

# 5. Verifica que se deployó
supabase functions list
```

Opción B: Manual desde Dashboard

1. Ve a https://supabase.com/dashboard/project/[ID]/functions
2. Click en **Create new function**
3. Nombre: `notify-pet-found`
4. Copia el contenido de `supabase/functions/notify-pet-found/index.ts`
5. Pega en el editor
6. Click **Deploy**

### PASO 4: Ejecutar SQL para Crear el Trigger

**MUY IMPORTANTE: Este paso vincula la Edge Function a la tabla**

1. Ve a tu proyecto Supabase
2. Ve a **SQL Editor**
3. Click en **New query**
4. Copia TODO el contenido de:
   `supabase/migrations/enable_edge_function_trigger.sql`
5. Pega en el editor
6. Click **Run**

Debería ver: "Query successful"

### PASO 5: Verificar que Funciona

En el SQL Editor, ejecuta:

```sql
-- Ver que el trigger existe
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'trigger_notify_pet_found';

-- Debería devolver: trigger_notify_pet_found
```

## ✅ TESTING

### Test 1: Insertar Reporte de Prueba

En el SQL Editor:

```sql
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
    '550e8400-e29b-41d4-a716-446655440000',  -- UUID de mascota existente
    'Juan Prueba',
    'admin@gmail.com',  -- Cámbialo por tu email
    'email',
    'Encontrado en el parque central, cerca del árbol grande',
    40.7128,
    -74.0060,
    'nuevo'
);
```

### Test 2: Ver Logs

```sql
-- Ver los últimos logs de la función
SELECT * FROM public.get_function_logs(10);

-- O directamente en el dashboard:
-- Supabase > Functions > notify-pet-found > Logs (esquina derecha)
```

### Test 3: Revisar tu Email

- Abre tu email (el que usaste en `ADMIN_EMAIL`)
- Deberías recibir un email de: `noreply@bqr-pets.com`
- Asunto: `🐾 ¡ALERTA! Hallazgo de Mascota`
- El email debe incluir:
  - Información de la mascota
  - Datos del rescatador
  - Ubicación descripta
  - Link a Google Maps (si hay coordenadas)

## 🎨 Características del Email

El email que recibe el dueño incluye:

✅ **Header profesional** con branding BQR  
✅ **Alerta visual** en color amarillo  
✅ **Foto de la mascota** (si existe)  
✅ **Detalles**: Especie, Raza, Color  
✅ **Notas médicas** (si las tiene)  
✅ **Datos del rescatador** con su contacto  
✅ **Link directo a Google Maps** con coordenadas GPS  
✅ **Botón para ver reporte** en dashboard  
✅ **Responsivo** en teléfono, tablet, desktop  
✅ **ID de referencia** del reporte  

## 🔧 Estructura Técnica

```
Flujo:
┌──────────────────────────────────────┐
│ Rescatador escanea QR                │
│ └─ Abre /pet/[id]                    │
│    └─ Llena formulario               │
│       └─ Click "Reportar hallazgo"   │
└──────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│ INSERT en tabla reportes_extravio    │
│ (desde /pet/[id]/page.tsx)           │
└──────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│ TRIGGER: trigger_notify_pet_found    │
│ └─ Función PL/PGSQL                 │
│    └─ Llama Edge Function via HTTP   │
└──────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│ EDGE FUNCTION: notify-pet-found      │
│ (Deno - TypeScript)                 │
│ ├─ Obtiene datos de Supabase         │
│ ├─ Crea link Google Maps             │
│ ├─ Genera HTML del email             │
│ └─ Envía vía SendGrid                │
└──────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│ 📧 EMAIL ENVIADO AL DUEÑO            │
│                                      │
│ Dueño recibe:                        │
│ ✓ Alerta de hallazgo                 │
│ ✓ Datos del rescatador               │
│ ✓ Ubicación exacta (Maps)            │
│ ✓ Detalles de la mascota             │
└──────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Email no se envía

**Solución:**

1. Verifica en Dashboard > Functions > notify-pet-found > Logs
   - ¿Qué error ves?

2. Comprueba que el Secret `SENDGRID_API_KEY` está correcto:
   ```bash
   supabase secrets list
   ```

3. Verifica que SendGrid tiene el email verificado:
   - Ir a: SendGrid > Settings > Sender Authentication
   - ¿Está en "Verified"?

4. Prueba que la API Key de SendGrid es válida:
   ```bash
   curl -X GET https://api.sendgrid.com/v3/mail/settings \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

### Trigger no se ejecuta

**Solución:**

1. Verifica que el trigger existe:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'trigger_notify_pet_found';
   ```

2. Verifica que las extensiones están habilitadas:
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('http', 'pg_net');
   ```

3. Intenta recrear el trigger:
   ```sql
   DROP TRIGGER trigger_notify_pet_found ON reportes_extravio;
   
   -- Luego ejecuta nuevamente el SQL de setup
   ```

### Coordenadas GPS mal formateadas

**Solución:**

- Las coordenadas deben ser números: `40.7128` (no string)
- Google Maps URL correcta: `https://www.google.com/maps?q=40.7128,-74.0060`
- Si no hay coordenadas, el link no se incluye en el email

## 📱 Alternativas a SendGrid

### Resend (Recomendado para Startups)

1. Ve a https://resend.com
2. Crea cuenta gratuita
3. Obtén API Key
4. Modifica `index.ts` para usar Resend (código incluido como comentario)

### Mailgun

1. https://www.mailgun.com
2. Plan gratuito: 100 emails/mes
3. Buen soporte en JavaScript/Deno

### AWS SES

1. https://aws.amazon.com/ses
2. Plan gratuito: 62,000 emails/mes
3. Requiere configuración AWS

## 🚀 Próximas Mejoras

- [ ] Notificaciones SMS (Twilio)
- [ ] Notificaciones push (Firebase)
- [ ] Chat privado entre rescatador y dueño
- [ ] Dashboard en tiempo real
- [ ] Estadísticas de hallazgos
- [ ] Integración con Google Calendar
- [ ] QR dinámicos (actualizar ubicación)

## 📚 Links Útiles

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [SendGrid API Docs](https://docs.sendgrid.com)
- [Deno Documentation](https://deno.land/manual)
- [Google Maps URL Scheme](https://developers.google.com/maps/documentation/urls/get-started)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)

## ❓ FAQ

**P: ¿Cuánto cuesta SendGrid?**  
R: Gratuito para los primeros 100 emails/día. Luego desde $19.95/mes.

**P: ¿Qué pasa si SendGrid falla?**  
R: El reporte se guarda igual. Solo falla el email. Puedes ver en los logs.

**P: ¿Puedo enviar a múltiples emails?**  
R: Sí, modifica `notify-pet-found/index.ts` para enviar a dueño + administrador.

**P: ¿Y si no hay email del usuario?**  
R: Usa el fallback `ADMIN_EMAIL`.

**P: ¿Funciona offline?**  
R: No. Necesita internet para consultar Supabase y SendGrid.

---

**¡Ya está todo listo! 🎉**

Si tienes problemas, revisa los logs en:
Dashboard > Functions > notify-pet-found > Logs
