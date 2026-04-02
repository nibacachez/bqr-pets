import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Tipos
interface ReportData {
  id: string;
  mascota_id: string;
  nombre_rescatador: string;
  contacto_rescatador: string;
  tipo_contacto: string;
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

/**
 * SUPABASE EDGE FUNCTION: notify-pet-found
 * 
 * Trigger: Automáticamente cuando se inserta un nuevo registro en reportes_extravio
 * 
 * Acciones:
 * 1. Obtiene datos del reporte insertado
 * 2. Obtiene datos de la mascota
 * 3. Obtiene email del dueño
 * 4. Crea link de Google Maps con GPS
 * 5. Envía email HTML profesional al dueño
 * 
 * Variables de entorno requeridas:
 * - SENDGRID_API_KEY (para enviar emails)
 * - ADMIN_EMAIL (email de administrador como fallback)
 */

serve(async (req: Request) => {
  try {
    // 1. VALIDAR MÉTODO
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // 2. OBTENER DATOS DEL REPORTE
    const payload = await req.json();
    
    // Supabase envía los datos en este formato:
    const reportData: ReportData = payload.record;

    if (!reportData || !reportData.mascota_id) {
      console.error("Datos de reporte inválidos:", payload);
      return new Response(
        JSON.stringify({ error: "Invalid report data" }),
        { status: 400 }
      );
    }

    console.log("📨 Procesando nuevo reporte:", reportData.id);

    // 3. INICIALIZAR CLIENTE DE SUPABASE
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 4. OBTENER DATOS DE LA MASCOTA
    const { data: mascota, error: mascotaError } = await supabase
      .from("mascotas")
      .select("*")
      .eq("id", reportData.mascota_id)
      .single();

    if (mascotaError || !mascota) {
      console.error("Error al obtener mascota:", mascotaError);
      return new Response(
        JSON.stringify({ error: "Mascota no encontrada" }),
        { status: 404 }
      );
    }

    const mascotaData: MascotaData = mascota;

    // 5. OBTENER DATOS DEL DUEÑO
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", mascotaData.dueno_id)
      .single();

    if (usuarioError || !usuario) {
      console.error("Error al obtener usuario:", usuarioError);
      return new Response(
        JSON.stringify({ error: "Usuario no encontrado" }),
        { status: 404 }
      );
    }

    const usuarioData: UsuarioData = usuario;

    // 6. EMAIL DEL DESTINATARIO (dueño o admin)
    const destinatarioEmail = usuarioData.email || Deno.env.get("ADMIN_EMAIL");

    if (!destinatarioEmail) {
      console.error("No hay email disponible para enviar");
      return new Response(
        JSON.stringify({ error: "No email target" }),
        { status: 400 }
      );
    }

    // 7. CREAR LINK DE GOOGLE MAPS
    let googleMapsLink = "";
    if (reportData.latitud && reportData.longitud) {
      googleMapsLink = `https://www.google.com/maps?q=${reportData.latitud},${reportData.longitud}`;
    }

    // 8. CREAR HTML DEL EMAIL
    const emailHtml = generarEmailHTML(
      mascotaData,
      reportData,
      usuarioData,
      googleMapsLink
    );

    // 9. ENVIAR EMAIL VÍA SENDGRID
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");

    if (!sendgridApiKey) {
      console.warn("⚠️ SENDGRID_API_KEY no configurado. Email no enviado.");
      return new Response(
        JSON.stringify({
          success: false,
          message: "SendGrid no configurado",
          report_id: reportData.id,
        }),
        { status: 200 }
      );
    }

    const emailResponse = await enviarEmailSendGrid(
      sendgridApiKey,
      destinatarioEmail,
      mascotaData.nombre,
      emailHtml
    );

    if (!emailResponse.success) {
      console.error("Error al enviar email:", emailResponse.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email send failed",
          details: emailResponse.error,
        }),
        { status: 500 }
      );
    }

    console.log("✅ Email enviado exitosamente a:", destinatarioEmail);

    // 10. ACTUALIZAR ESTADO DEL REPORTE (opcional)
    await supabase
      .from("reportes_extravio")
      .update({ estado: "notificado" })
      .eq("id", reportData.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificación enviada exitosamente",
        report_id: reportData.id,
        email_sent_to: destinatarioEmail,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error en Edge Function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error interno del servidor",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/**
 * GENERAR HTML DEL EMAIL
 */
function generarEmailHTML(
  mascota: MascotaData,
  reporte: ReportData,
  usuario: UsuarioData,
  googleMapsLink: string
): string {
  const fecha = new Date(reporte.fecha_reporte).toLocaleString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Reporte de Hallazgo! - BQR Mascotas</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            margin: 0;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            background: white;
            margin: 0 auto;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .header {
            background: linear-gradient(135deg, #101E3A 0%, #00C4CC 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }

        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }

        .alert-banner {
            background: #FFF3CD;
            border-left: 4px solid #FFC107;
            padding: 15px 20px;
            margin: 20px;
            border-radius: 4px;
            font-weight: bold;
            color: #856404;
        }

        .content {
            padding: 30px 20px;
        }

        .section {
            margin-bottom: 25px;
        }

        .section h2 {
            color: #101E3A;
            font-size: 18px;
            margin: 0 0 10px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #00C4CC;
        }

        .mascota-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 14px;
        }

        .info-label {
            font-weight: bold;
            color: #555;
        }

        .info-value {
            color: #333;
            text-align: right;
        }

        .rescatador-info {
            background: #E3F2FD;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #2196F3;
        }

        .contact-info {
            background: #F3E5F5;
            padding: 12px 15px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 13px;
        }

        .contact-label {
            font-weight: bold;
            color: #6A1B9A;
            display: block;
            margin-bottom: 3px;
        }

        .contact-value {
            color: #424242;
            word-break: break-all;
        }

        .ubicacion-mensaje {
            background: #FFF9C4;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #FDD835;
            font-style: italic;
            color: #565656;
            line-height: 1.6;
        }

        .gps-section {
            background: #E8F5E9;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #4CAF50;
        }

        .gps-link {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 10px 0;
            transition: background 0.3s;
        }

        .gps-link:hover {
            background: #45a049;
        }

        .action-buttons {
            text-align: center;
            margin: 30px 0;
        }

        .btn {
            display: inline-block;
            padding: 12px 25px;
            margin: 0 10px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s;
        }

        .btn-primary {
            background: #00C4CC;
            color: #101E3A;
        }

        .btn-primary:hover {
            background: #00a3a9;
            text-decoration: none;
        }

        .medical-alert {
            background: #FFEBEE;
            border-left: 4px solid #F44336;
            padding: 12px 15px;
            border-radius: 4px;
            color: #B71C1C;
            font-size: 13px;
            margin: 15px 0;
        }

        .medical-alert strong {
            display: block;
            margin-bottom: 5px;
        }

        .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }

        .footer a {
            color: #00C4CC;
            text-decoration: none;
        }

        .reference-id {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            font-size: 12px;
            color: #888;
            margin-top: 20px;
        }

        @media (max-width: 600px) {
            .header h1 {
                font-size: 22px;
            }

            .content {
                padding: 20px 15px;
            }

            .info-row {
                flex-direction: column;
            }

            .info-value {
                text-align: left;
                margin-top: 3px;
            }

            .action-buttons {
                margin: 20px 0;
            }

            .btn {
                display: block;
                margin: 8px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <div class="header">
            <h1>🐾 ¡REPORTE DE HALLAZGO!</h1>
            <p>Tu mascota ha sido encontrada</p>
        </div>

        <!-- ALERTA PRINCIPAL -->
        <div class="alert-banner">
            ⚠️ Alguien reportó haber encontrado a ${mascota.nombre}
        </div>

        <!-- CONTENIDO PRINCIPAL -->
        <div class="content">
            <!-- INFORMACIÓN DE LA MASCOTA -->
            <div class="section">
                <h2>🐱 Información de tu Mascota</h2>
                <div class="mascota-info">
                    <div class="info-row">
                        <span class="info-label">Nombre:</span>
                        <span class="info-value"><strong>${mascota.nombre}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Especie:</span>
                        <span class="info-value">${mascota.especie}</span>
                    </div>
                    ${
                      mascota.raza
                        ? `<div class="info-row">
                        <span class="info-label">Raza:</span>
                        <span class="info-value">${mascota.raza}</span>
                    </div>`
                        : ""
                    }
                    ${
                      mascota.color
                        ? `<div class="info-row">
                        <span class="info-label">Color:</span>
                        <span class="info-value">${mascota.color}</span>
                    </div>`
                        : ""
                    }
                </div>

                ${
                  mascota.notas_medicas
                    ? `<div class="medical-alert">
                    <strong>⚠️ Notas Médicas:</strong>
                    ${mascota.notas_medicas}
                </div>`
                    : ""
                }
            </div>

            <!-- INFORMACIÓN DEL REPORTE -->
            <div class="section">
                <h2>📋 Detalles del Reporte</h2>
                <div class="rescatador-info">
                    <p><strong>Encontrado:</strong> ${fecha}</p>
                </div>
            </div>

            <!-- INFORMACIÓN DEL RESCATADOR -->
            <div class="section">
                <h2>👤 Información del Rescatador</h2>
                <div class="rescatador-info">
                    <p><strong>${reporte.nombre_rescatador}</strong></p>
                    
                    <div class="contact-info">
                        <span class="contact-label">
                            ${
                              reporte.tipo_contacto === "email"
                                ? "📧 Email:"
                                : reporte.tipo_contacto === "whatsapp"
                                  ? "💬 WhatsApp:"
                                  : "📞 Teléfono:"
                            }
                        </span>
                        <span class="contact-value">${reporte.contacto_rescatador}</span>
                    </div>
                </div>
            </div>

            <!-- UBICACIÓN REPORTADA -->
            <div class="section">
                <h2>📍 Ubicación Reportada</h2>
                <div class="ubicacion-mensaje">
                    "${reporte.mensaje_ubicacion}"
                </div>
            </div>

            <!-- GPS y MAPA -->
            ${
              googleMapsLink
                ? `<div class="section">
                <h2>🗺️ Ubicación en Mapa</h2>
                <div class="gps-section">
                    <p><strong>Coordenadas GPS:</strong> ${reporte.latitud?.toFixed(5)}, ${reporte.longitud?.toFixed(5)}</p>
                    <a href="${googleMapsLink}" class="gps-link" target="_blank">
                        📍 Ver en Google Maps
                    </a>
                </div>
            </div>`
                : ""
            }

            <!-- BOTONES DE ACCIÓN -->
            <div class="action-buttons">
                <a href="https://bqr-pets.vercel.app/dashboard/reportes" class="btn btn-primary">
                    Ver Reporte Completo
                </a>
            </div>

            <!-- REFERENCIA DE REPORTE -->
            <div class="reference-id">
                <strong>ID de Reporte:</strong> ${reporte.id}
            </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            <p>
                Este es un email automático de <strong>BQR - Recuperación de Mascotas con QR</strong>
            </p>
            <p>
                © 2024 BQR. Todos los derechos reservados.
            </p>
            <p>
                <a href="https://instagram.com">Instagram</a> • 
                <a href="https://tiktok.com">TikTok</a>
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * ENVIAR EMAIL VÍA SENDGRID
 */
async function enviarEmailSendGrid(
  apiKey: string,
  destinatario: string,
  nombreMascota: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmail = Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@bqr-pets.com";

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: destinatario }],
            subject: `🐾 ¡ALERTA! Hallazgo de ${nombreMascota} - BQR`,
          },
        ],
        from: {
          email: adminEmail,
          name: "BQR - Mascotas Encontradas",
        },
        content: [
          {
            type: "text/html",
            value: htmlContent,
          },
        ],
        reply_to: {
          email: adminEmail,
          name: "BQR Team",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `SendGrid error: ${response.status} - ${error}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Error enviando email",
    };
  }
}
