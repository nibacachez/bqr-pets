import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * POST /api/reportes
 * 
 * Endpoint PÚBLICO para recibir reportes de hallazgos de mascotas
 * 
 * ⚠️ IMPORTANTE: 
 * - NO requiere autenticación (cualquiera puede reportar)
 * - DEBE tener rate limiting para evitar spam
 * - INTEGRADO CON SUPABASE
 * 
 * Flujo:
 * 1. Valida los datos del rescatador
 * 2. Aplica rate limiting por IP
 * 3. Inserta en tabla reportes_extravio
 * 4. (Futuro) Envía notificación al dueño
 */

interface ReportePayload {
  mascota_id: string;
  nombre_rescatador: string;
  contacto_rescatador: string;
  tipo_contacto: 'whatsapp' | 'telefono' | 'email';
  mensaje_ubicacion: string;
  latitud?: number;
  longitud?: number;
}

/**
 * VALIDACIÓN: Rate limiting por IP
 * Máximo: 5 reportes por IP por hora
 */
const rateLimitMap = new Map<string, Array<{ timestamp: number }>>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip)!;
  const recentRequests = requests.filter((r) => r.timestamp > oneHourAgo);

  if (recentRequests.length >= 5) {
    return false;
  }

  recentRequests.push({ timestamp: now });
  rateLimitMap.set(ip, recentRequests);
  return true;
}

/**
 * VALIDACIÓN: Campos requeridos
 */
function validatePayload(data: unknown): data is ReportePayload {
  if (typeof data !== 'object' || data === null) return false;

  const payload = data as Record<string, unknown>;

  return (
    typeof payload.mascota_id === 'string' &&
    payload.mascota_id.length > 0 &&
    typeof payload.nombre_rescatador === 'string' &&
    payload.nombre_rescatador.length > 0 &&
    payload.nombre_rescatador.length <= 255 &&
    typeof payload.contacto_rescatador === 'string' &&
    payload.contacto_rescatador.length > 0 &&
    payload.contacto_rescatador.length <= 255 &&
    ['whatsapp', 'telefono', 'email'].includes(payload.tipo_contacto as string) &&
    typeof payload.mensaje_ubicacion === 'string' &&
    payload.mensaje_ubicacion.length > 0 &&
    payload.mensaje_ubicacion.length <= 2000 &&
    (payload.latitud === undefined || typeof payload.latitud === 'number') &&
    (payload.longitud === undefined || typeof payload.longitud === 'number')
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting por IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiados reportes. Intenta más tarde.' },
        { status: 429 }
      );
    }

    // 2. Parsear payload
    const payload = await request.json();

    // 3. Validar payload
    if (!validatePayload(payload)) {
      return NextResponse.json(
        {
          error: 'Datos inválidos. Verifica que todos los campos sean correctos.',
          details: {
            mascota_id: typeof payload.mascota_id === 'string' ? '✓' : '✗',
            nombre_rescatador: typeof payload.nombre_rescatador === 'string' ? '✓' : '✗',
            contacto_rescatador: typeof payload.contacto_rescatador === 'string' ? '✓' : '✗',
            tipo_contacto: ['whatsapp', 'telefono', 'email'].includes(
              payload.tipo_contacto as string
            )
              ? '✓'
              : '✗',
            mensaje_ubicacion: typeof payload.mensaje_ubicacion === 'string' ? '✓' : '✗',
          },
        },
        { status: 400 }
      );
    }

    // 4. INTEGRAR CON SUPABASE - Insertar en tabla reportes_extravio
    const { error: supabaseError, data } = await supabase
      .from('reportes_extravio')
      .insert({
        mascota_id: payload.mascota_id,
        nombre_rescatador: payload.nombre_rescatador,
        contacto_rescatador: payload.contacto_rescatador,
        tipo_contacto: payload.tipo_contacto,
        mensaje_ubicacion: payload.mensaje_ubicacion,
        latitud: payload.latitud || null,
        longitud: payload.longitud || null,
        estado: 'nuevo',
      })
      .select('id')
      .single();

    if (supabaseError) {
      console.error('Error al guardar reporte en Supabase:', supabaseError);
      
      // Si el error es por mascota no encontrada, responder apropiadamente
      if (supabaseError.code === '23503') {
        return NextResponse.json(
          { error: 'Mascota no encontrada' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Error al procesar el reporte' },
        { status: 500 }
      );
    }

    // 5. TODO: Enviar notificación al dueño
    // try {
    //   await enviarEmailAlDueno(payload.mascota_id, payload.contacto_rescatador);
    // } catch (err) {
    //   console.error('Error al enviar notificación:', err);
    //   // No fallar el reporte si la notificación falla
    // }

    // 6. Respuesta éxito
    return NextResponse.json(
      {
        success: true,
        message: 'Reporte recibido. El dueño será notificado pronto.',
        reference_id: data?.id || `REP-${Date.now()}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/reportes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reportes (Opcional)
 * 
 * Este endpoint podría ser protegido para que solo dueños
 * de mascotas vean sus propios reportes
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: 'Endpoint: POST para enviar un nuevo reporte',
      documentation: 'https://github.com/tu-repo/docs/api/reportes',
    },
    { status: 200 }
  );
}
