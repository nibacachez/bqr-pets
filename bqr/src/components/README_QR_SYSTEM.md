/**
 * DOCUMENTACIÓN: SISTEMA DE CÓDIGOS QR
 * 
 * Aquí se documenta cómo implementar y usar el sistema de códigos QR
 * para recuperación de mascotas en la aplicación BQR.
 */

// ============================================
// 1. INSTALACIÓN
// ============================================

/**
 * npm install qrcode.react @types/qrcode.react
 * 
 * Paquetes instalados:
 * - qrcode.react: Generador de códigos QR React
 * - @types/qrcode.react: Tipos TypeScript
 */

// ============================================
// 2. ESTRUCTURA DE ARCHIVOS
// ============================================

/**
 * src/components/QRCodeGenerator.tsx
 *   - Componente principal para generar QRs
 *   - 'use client' (Client Component)
 *   - Props: mascotaId, mascotaNombre, tamaño
 *   - Funciones: descargar, imprimir
 * 
 * src/app/pet/[mascotaId]/page.tsx
 *   - Página PÚBLICA para reportar hallazgos
 *   - Accesible por QR
 *   - Formulario de reporte
 * 
 * src/app/dashboard/mascota-ejemplo/page.tsx
 *   - Página PROTEGIDA del dashboard
 *   - Ejemplo de uso de QRCodeGenerator
 *   - Solo visible para propietarios
 * 
 * src/app/api/reportes/route.ts
 *   - Endpoint público para recibir reportes
 *   - Rate limiting incluido
 * 
 * src/lib/SECURITY.ts
 *   - Documentación de seguridad
 *   - Checklist de validaciones
 */

// ============================================
// 3. FLUJO DE USO
// ============================================

/**
 * FLUJO USUARIO DUEÑO:
 * 
 * 1. Login en /login
 * 2. Ir a /dashboard/mis-mascotas
 * 3. Crear mascota:
 *    - Nombre, especie, foto, notas médicas
 *    - Sistema genera mascota_id (UUID)
 *    - Sistema genera automáticamente código QR
 * 4. Descargar o imprimir QR
 * 5. Colocar en collar/etiqueta/pegatina
 * 
 * FLUJO USUARIO RESCATADOR:
 * 
 * 1. Encuentra mascota perdida
 * 2. Escanea QR con teléfono
 * 3. QR apunta a: https://bqr-pets.vercel.app/pet/[mascotaId]
 * 4. Se abre formulario de reporte
 * 5. Llena: nombre, contacto, ubicación, GPS
 * 6. Envía reporte
 * 7. Dueño recibe notificación con datos de rescatador
 */

// ============================================
// 4. USO BÁSICO DEL COMPONENTE
// ============================================

/**
 * ✅ CORRECTO - En página protegida:
 * 
 * import QRCodeGenerator from '@/components/QRCodeGenerator';
 * 
 * export default function DashboardPage() {
 *   return (
 *     <QRCodeGenerator
 *       mascotaId="550e8400-e29b-41d4-a716-446655440000"
 *       mascotaNombre="Max - Pastor Alemán"
 *       tamaño={300}
 *     />
 *   );
 * }
 */

// ============================================
// 5. URLS Y ENDPOINTS
// ============================================

/**
 * PÚBLICAS (sin autenticación):
 * 
 * GET /pet/[mascotaId]
 *   - Formulario de reporte
 *   - URL: https://bqr-pets.vercel.app/pet/550e8400-e29b-41d4-a716-446655440000
 * 
 * POST /api/reportes
 *   - Recibir reporte
 *   - Payload: { mascota_id, nombre_rescatador, contacto_rescatador, ... }
 * 
 * PROTEGIDAS (requieren autenticación):
 * 
 * GET /dashboard/mascota/[mascotaId]
 *   - Ver Dashboard con QR
 *   - auth.uid() === mascota.dueno_id
 * 
 * GET /dashboard/reportes
 *   - Ver reportes recibidos
 *   - auth.uid() === mascota.dueno_id
 */

// ============================================
// 6. CONFIGURACIÓN SUPABASE
// ============================================

/**
 * ✅ Crear tabla mascotas:
 * 
 * CREATE TABLE mascotas (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   dueno_id UUID NOT NULL REFERENCES usuarios(id),
 *   nombre VARCHAR(100) NOT NULL,
 *   qr_codigo VARCHAR(255) UNIQUE,
 *   -- otros campos...
 * );
 * 
 * ✅ Crear tabla reportes_extravio:
 * 
 * CREATE TABLE reportes_extravio (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   mascota_id UUID NOT NULL REFERENCES mascotas(id),
 *   nombre_rescatador VARCHAR(255) NOT NULL,
 *   contacto_rescatador VARCHAR(255) NOT NULL,
 *   mensaje_ubicacion TEXT,
 *   latitud DECIMAL(10, 8),
 *   longitud DECIMAL(11, 8),
 *   fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 * );
 * 
 * ✅ Habilitar RLS en mascotas:
 * 
 * ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;
 * 
 * CREATE POLICY "usuarios_ver_mascotas_propias"
 * ON mascotas FOR SELECT
 * USING (dueno_id = auth.uid());
 * 
 * ✅ Habilitar RLS en reportes:
 * 
 * ALTER TABLE reportes_extravio ENABLE ROW LEVEL SECURITY;
 * 
 * CREATE POLICY "usuarios_insertar_reportes"
 * ON reportes_extravio FOR INSERT
 * WITH CHECK (true); -- Público
 * 
 * CREATE POLICY "usuarios_ver_prop_reportes"
 * ON reportes_extravio FOR SELECT
 * USING (
 *   mascota_id IN (
 *     SELECT id FROM mascotas
 *     WHERE dueno_id = auth.uid()
 *   )
 * );
 */

// ============================================
// 7. CARACTERÍSTICAS DEL COMPONENTE
// ============================================

/**
 * ✓ Genera QR con UUID único
 * ✓ URL personalizada apuntando a /pet/[mascotaId]
 * ✓ Logo embebido en el centro del QR
 * ✓ Descarga como PNG
 * ✓ Impresión directa
 * ✓ Validación de datos
 * ✓ Responsivo
 * ✓ Estilos corporativos (azul y celeste)
 * ✓ Aviso de confidencialidad
 * ✓ Typo-safe con TypeScript
 */

// ============================================
// 8. EJEMPLO COMPLETO DE INTEGRACIÓN
// ============================================

/**
 * src/app/dashboard/mascotas/[id]/page.tsx
 * 
 * import { redirect } from 'next/navigation';
 * import QRCodeGenerator from '@/components/QRCodeGenerator';
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export default async function MascotaPage({
 *   params,
 * }: {
 *   params: { id: string };
 * }) {
 *   const supabase = createClient();
 *   
 *   // 1. Validar autenticación
 *   const { data: { session } } = await supabase.auth.getSession();
 *   if (!session) redirect('/login');
 *   
 *   // 2. Obtener mascota
 *   const { data: mascota, error } = await supabase
 *     .from('mascotas')
 *     .select('*')
 *     .eq('id', params.id)
 *     .eq('dueno_id', session.user.id)
 *     .single();
 *   
 *   if (error || !mascota) redirect('/dashboard');
 *   
 *   // 3. Renderizar con QR
 *   return (
 *     <div className="container mx-auto py-8">
 *       <QRCodeGenerator
 *         mascotaId={mascota.id}
 *         mascotaNombre={mascota.nombre}
 *       />
 *     </div>
 *   );
 * }
 */

// ============================================
// 9. TESTING DEL FLUJO
// ============================================

/**
 * 1. Instalar aplicación QR reader en tu teléfono
 * 2. Ir a /dashboard/mascota-ejemplo
 * 3. Descargar el QR (descargará imagen PNG)
 * 4. Escanear con teléfono
 * 5. Debería abrir: https://bqr-pets.vercel.app/pet/550e8400-e29b-41d4-a716-446655440000
 * 6. Llenar formulario y enviar
 * 7. Verificar en consola que llega el reporte (actualmente JSON)
 */

// ============================================
// 10. PRÓXIMOS PASOS
// ============================================

/**
 * TODO:
 * 
 * [ ] Integrar Supabase en /api/reportes
 * [ ] Enviar notificación email al dueño cuando llegue reporte
 * [ ] Crear página /dashboard/reportes para ver hallazgos
 * [ ] Implementar middleware de autenticación
 * [ ] Crear página de login y registro
 * [ ] Implementar actualización de mascota
 * [ ] Agregar foto de mascota en formulario
 * [ ] Crear vista de mapa con reportes
 * [ ] Integrar sistema de notificaciones push
 * [ ] Agregar pruebas unitarias para QR
 */

export {};
