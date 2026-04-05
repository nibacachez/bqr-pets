import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { mascotaNombre, ownerEmail, ownerNombre, nombreRescatador, contactoRescatador, mensajeUbicacion, latitud, longitud } = await req.json();

    if (!ownerEmail) return NextResponse.json({ error: "No owner email" }, { status: 400 });

    const mapsLink = latitud && longitud ? `https://maps.google.com/?q=${latitud},${longitud}` : null;

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0d1b35;font-family:'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1b35;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#152340;border-radius:16px;overflow:hidden;border:1px solid rgba(0,196,204,0.2);">
<tr><td style="background:linear-gradient(135deg,#00C4CC,#0099a8);padding:28px 32px;text-align:center;">
<p style="margin:0;color:#fff;font-size:12px;letter-spacing:3px;text-transform:uppercase;opacity:0.8;">BQR · Tu Amigo Más Seguro</p>
<h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:800;">🐾 ¡Encontraron a ${mascotaNombre}!</h1>
</td></tr>
<tr><td style="padding:32px;">
<p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hola <strong style="color:#e2e8f0;">${ownerNombre || "dueño"}</strong>, alguien encontró a tu mascota:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,196,204,0.07);border:1px solid rgba(0,196,204,0.2);border-radius:12px;margin-bottom:16px;">
<tr><td style="padding:20px;">
<p style="margin:0 0 6px;color:#00C4CC;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">Rescatador</p>
<p style="margin:0 0 4px;color:#e2e8f0;font-size:16px;font-weight:700;">${nombreRescatador}</p>
<p style="margin:0;color:#94a3b8;font-size:14px;">📞 ${contactoRescatador}</p>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:20px;">
<tr><td style="padding:20px;">
<p style="margin:0 0 6px;color:#94a3b8;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">Mensaje</p>
<p style="margin:0;color:#e2e8f0;font-size:15px;line-height:1.6;">${mensajeUbicacion}</p>
</td></tr></table>
${mapsLink ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td align="center"><a href="${mapsLink}" style="display:inline-block;background:linear-gradient(135deg,#00C4CC,#0099a8);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;">📍 Ver ubicación en Google Maps</a></td></tr></table>` : `<p style="color:#64748b;font-size:13px;text-align:center;margin-bottom:24px;">El rescatador no compartió ubicación GPS.</p>`}
<p style="color:#475569;font-size:12px;text-align:center;margin:0;">Reporte generado automáticamente por BQR.<br/>Contáctate con el rescatador lo antes posible.</p>
</td></tr></table>
</td></tr></table>
</body></html>`;

    const { error } = await resend.emails.send({
      from: "BQR Alertas <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: `🚨 Encontraron a ${mascotaNombre} — Reporte BQR`,
      html,
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/send error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}