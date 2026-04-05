"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { MapPin, Phone, MessageCircle, Mail, Heart, AlertTriangle, CheckCircle } from "lucide-react";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface Mascota {
  id: string;
  nombre: string;
  especie: string;
  raza?: string;
  color?: string;
  foto_url?: string;
  notas_medicas?: string;
  dueno_id: string;
}

interface FormData {
  nombre_rescatador: string;
  contacto_rescatador: string;
  tipo_contacto: "telefono" | "whatsapp" | "email";
  mensaje_ubicacion: string;
  latitud?: number;
  longitud?: number;
}

export default function PetPage() {
  const params = useParams();
  const petId = params?.id as string;

  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    nombre_rescatador: "",
    contacto_rescatador: "",
    tipo_contacto: "whatsapp",
    mensaje_ubicacion: "",
  });

  useEffect(() => {
    if (!petId) return;
    async function fetchData() {
      try {
        const supabase = getSupabase();
        const { data, error: sbError } = await supabase
          .from("mascotas")
          .select("*")
          .eq("id", petId)
          .single();
        if (sbError) throw sbError;
        setMascota(data);
      } catch (err: unknown) {
        console.error("Error fetching mascota:", err);
        setError(err instanceof Error ? err.message : "No se pudo cargar la información de la mascota.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [petId]);

  function requestGPS() {
    if (!navigator.geolocation) { alert("Tu navegador no soporta geolocalización."); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          mensaje_ubicacion: prev.mensaje_ubicacion || `Ubicación GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        }));
        setGpsLoading(false);
      },
      (err) => { console.error("GPS error:", err); alert("No se pudo obtener la ubicación."); setGpsLoading(false); }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mascota) return;
    setSubmitting(true);
    try {
      const supabase = getSupabase();
      const { error: sbError } = await supabase.from("reportes_extravio").insert({
        mascota_id: mascota.id,
        nombre_rescatador: form.nombre_rescatador,
        contacto_rescatador: form.contacto_rescatador,
        tipo_contacto: form.tipo_contacto,
        mensaje_ubicacion: form.mensaje_ubicacion,
        latitud: form.latitud ?? null,
        longitud: form.longitud ?? null,
        estado: "nuevo",
      });
      if (sbError) throw sbError;
      await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mascota_id: mascota.id, dueno_id: mascota.dueno_id, rescatador: form }),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      console.error("Error enviando reporte:", err);
      alert(err instanceof Error ? `Error: ${err.message}` : "Ocurrió un error al enviar el reporte.");
    } finally {
      setSubmitting(false);
    }
  }

  const iconoContacto = { telefono: Phone, whatsapp: MessageCircle, email: Mail };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#101E3A" }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 animate-spin" style={{ border: "3px solid rgba(0,196,204,0.2)", borderTopColor: "#00C4CC" }} />
          <p style={{ color: "#00C4CC" }} className="text-sm tracking-widest uppercase">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !mascota) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#101E3A" }}>
        <div className="text-center p-8 rounded-2xl max-w-sm w-full" style={{ background: "rgba(21,35,64,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,196,204,0.15)" }}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: "#00C4CC" }} />
          <h2 className="text-white text-xl font-bold mb-2">Mascota no encontrada</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{error ?? "El código QR puede ser inválido o la mascota fue eliminada."}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#101E3A" }}>
        <div className="text-center p-8 rounded-2xl max-w-sm w-full" style={{ background: "rgba(21,35,64,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,196,204,0.3)" }}>
          <CheckCircle className="w-14 h-14 mx-auto mb-4" style={{ color: "#00C4CC" }} />
          <h2 className="text-white text-2xl font-bold mb-3">¡Gracias!</h2>
          <p className="text-white mb-1">El dueño de <span style={{ color: "#00C4CC" }}>{mascota.nombre}</span> fue notificado.</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Te contactarán pronto. Eres un héroe 🐾</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "#101E3A" }}>
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-4" style={{ background: "rgba(0,196,204,0.1)", color: "#00C4CC", border: "1px solid rgba(0,196,204,0.2)" }}>
            <Heart className="w-3 h-3" />
            BQR · Tu Amigo Más Seguro
          </div>
          <h1 className="text-white text-2xl font-bold">¡Encontré a {mascota.nombre}!</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Completa el formulario para avisar al dueño</p>
        </div>

        <div className="rounded-2xl p-5 flex gap-4 items-center" style={{ background: "rgba(21,35,64,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,196,204,0.15)" }}>
          {mascota.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mascota.foto_url} alt={mascota.nombre} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" style={{ border: "2px solid rgba(0,196,204,0.3)" }} />
          ) : (
            <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl" style={{ background: "rgba(0,196,204,0.1)", border: "2px solid rgba(0,196,204,0.2)" }}>
              {mascota.especie === "Perro" ? "🐶" : mascota.especie === "Gato" ? "🐱" : "🐾"}
            </div>
          )}
          <div>
            <h2 className="text-white text-xl font-bold">{mascota.nombre}</h2>
            <p className="text-sm" style={{ color: "#00C4CC" }}>{mascota.especie}{mascota.raza ? ` · ${mascota.raza}` : ""}</p>
            {mascota.color && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Color: {mascota.color}</p>}
            {mascota.notas_medicas && (
              <p className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block" style={{ background: "rgba(0,196,204,0.1)", color: "#00C4CC", border: "1px solid rgba(0,196,204,0.2)" }}>
                ⚕️ {mascota.notas_medicas}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(21,35,64,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,196,204,0.15)" }}>
          <h3 className="text-white font-semibold text-lg">Tus datos de contacto</h3>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>Tu nombre *</label>
            <input required type="text" placeholder="¿Cómo te llamas?" value={form.nombre_rescatador}
              onChange={(e) => setForm((p) => ({ ...p, nombre_rescatador: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,196,204,0.2)" }}
              onFocus={(e) => (e.target.style.borderColor = "#00C4CC")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(0,196,204,0.2)")} />
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>Contactar por *</label>
            <div className="grid grid-cols-3 gap-2">
              {(["telefono", "whatsapp", "email"] as const).map((tipo) => {
                const Icon = iconoContacto[tipo];
                const labels = { telefono: "Teléfono", whatsapp: "WhatsApp", email: "Email" };
                const active = form.tipo_contacto === tipo;
                return (
                  <button key={tipo} type="button" onClick={() => setForm((p) => ({ ...p, tipo_contacto: tipo }))}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all"
                    style={{ background: active ? "rgba(0,196,204,0.15)" : "rgba(255,255,255,0.04)", border: active ? "1px solid #00C4CC" : "1px solid rgba(255,255,255,0.08)", color: active ? "#00C4CC" : "rgba(255,255,255,0.4)" }}>
                    <Icon className="w-4 h-4" />
                    {labels[tipo]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
              {form.tipo_contacto === "email" ? "Tu email *" : "Tu número *"}
            </label>
            <input required type={form.tipo_contacto === "email" ? "email" : "tel"}
              placeholder={form.tipo_contacto === "email" ? "tucorreo@ejemplo.com" : "+56 9 1234 5678"}
              value={form.contacto_rescatador}
              onChange={(e) => setForm((p) => ({ ...p, contacto_rescatador: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,196,204,0.2)" }}
              onFocus={(e) => (e.target.style.borderColor = "#00C4CC")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(0,196,204,0.2)")} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>¿Dónde está? *</label>
              <button type="button" onClick={requestGPS} disabled={gpsLoading}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-all"
                style={{ background: "rgba(0,196,204,0.1)", color: "#00C4CC", border: "1px solid rgba(0,196,204,0.2)" }}>
                <MapPin className="w-3 h-3" />
                {gpsLoading ? "Obteniendo..." : "Usar GPS"}
              </button>
            </div>
            <textarea required rows={3} placeholder="Ej: Parque O'Higgins, cerca de la entrada principal..."
              value={form.mensaje_ubicacion}
              onChange={(e) => setForm((p) => ({ ...p, mensaje_ubicacion: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm resize-none transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,196,204,0.2)" }}
              onFocus={(e) => (e.target.style.borderColor = "#00C4CC")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(0,196,204,0.2)")} />
            {form.latitud && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#00C4CC" }}>
                <MapPin className="w-3 h-3" />
                GPS obtenido: {form.latitud.toFixed(4)}, {form.longitud?.toFixed(4)}
              </p>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all"
            style={{ background: submitting ? "rgba(0,196,204,0.3)" : "#00C4CC", color: submitting ? "rgba(255,255,255,0.5)" : "#101E3A" }}>
            {submitting ? "Enviando aviso..." : "🐾 Avisar al dueño"}
          </button>
        </form>

        <p className="text-center text-xs pb-4" style={{ color: "rgba(255,255,255,0.2)" }}>BQR · bqrs.vercel.app</p>
      </div>
    </div>
  );
}