'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface Mascota {
  id: string;
  nombre: string;
  especie: string;
  foto_url: string | null;
  notas_medicas: string | null;
  raza?: string | null;
  color?: string | null;
}

interface FormData {
  nombre_rescatador: string;
  contacto_rescatador: string;
  tipo_contacto: 'whatsapp' | 'telefono' | 'email';
  mensaje_ubicacion: string;
  latitud: number | null;
  longitud: number | null;
}

/**
 * PÁGINA PÚBLICA: /pet/[id]
 * 
 * Esta página es accesible cuando alguien escanea el código QR de una mascota.
 * Muestra:
 * - Información básica de la mascota
 * - Foto (si existe)
 * - Formulario para reportar el hallazgo
 * - Botón para obtener ubicación GPS automáticamente
 * 
 * El formulario se encarga de:
 * - Validar los datos del rescatador
 * - Obtener coordenadas GPS (opcional)
 * - Guardar el reporte en tabla reportes_extravio
 * - Notificar al dueño
 */
export default function PetReportPage() {
  const params = useParams();
  const mascotaId = params.id as string;

  // Estado de la mascota
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario
  const [formData, setFormData] = useState<FormData>({
    nombre_rescatador: '',
    contacto_rescatador: '',
    tipo_contacto: 'whatsapp',
    mensaje_ubicacion: '',
    latitud: null,
    longitud: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  /**
   * 1. OBTENER DATOS DE LA MASCOTA
   */
  useEffect(() => {
    const fetchMascota = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('mascotas')
          .select('id, nombre, especie, foto_url, notas_medicas, raza, color')
          .eq('id', mascotaId)
          .single();

        if (error) {
          setError('Mascota no encontrada');
          console.error('Error al obtener mascota:', error);
          return;
        }

        setMascota(data);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar la mascota');
      } finally {
        setLoading(false);
      }
    };

    if (mascotaId) {
      fetchMascota();
    }
  }, [mascotaId]);

  /**
   * 2. MANEJAR CAMBIOS EN EL FORMULARIO
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * 3. OBTENER UBICACIÓN GPS DEL NAVEGADOR
   */
  const handleGetLocation = async () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Tu navegador no soporta Geolocalización');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitud: latitude,
          longitud: longitude,
        }));
        setGpsLoading(false);
      },
      (err) => {
        let errorMsg = 'No pudimos obtener tu ubicación';
        if (err.code === 1) {
          errorMsg = 'Permiso de ubicación denegado. Habilítalo en tu navegador.';
        } else if (err.code === 2) {
          errorMsg = 'Ubicación no disponible. Asegúrate de estar al aire libre.';
        } else if (err.code === 3) {
          errorMsg = 'La solicitud de ubicación tardó demasiado.';
        }
        setGpsError(errorMsg);
        setGpsLoading(false);
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
      }
    );
  };

  /**
   * 4. ENVIAR REPORTE A SUPABASE
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validar campos requeridos
      if (!formData.nombre_rescatador.trim()) {
        setError('Por favor ingresa tu nombre');
        setSubmitting(false);
        return;
      }

      if (!formData.contacto_rescatador.trim()) {
        setError('Por favor ingresa tu contacto');
        setSubmitting(false);
        return;
      }

      if (!formData.mensaje_ubicacion.trim()) {
        setError('Por favor describe dónde encontraste la mascota');
        setSubmitting(false);
        return;
      }

      // Insertar reporte en Supabase
      const { error } = await supabase.from('reportes_extravio').insert([
        {
          mascota_id: mascotaId,
          nombre_rescatador: formData.nombre_rescatador.trim(),
          contacto_rescatador: formData.contacto_rescatador.trim(),
          tipo_contacto: formData.tipo_contacto,
          mensaje_ubicacion: formData.mensaje_ubicacion.trim(),
          latitud: formData.latitud,
          longitud: formData.longitud,
          estado: 'nuevo',
        },
      ]);

      if (error) {
        console.error('Error al guardar reporte:', error);
        setError('Error al enviar el reporte. Intenta de nuevo.');
        setSubmitting(false);
        return;
      }

      // Éxito
      setSubmitted(true);
      setFormData({
        nombre_rescatador: '',
        contacto_rescatador: '',
        tipo_contacto: 'whatsapp',
        mensaje_ubicacion: '',
        latitud: null,
        longitud: null,
      });
    } catch (err) {
      console.error('Error:', err);
      setError('Error inesperado. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 5. RENDERIZAR PÁGINA
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
          <p className="text-white mt-4">Cargando información de la mascota...</p>
        </div>
      </div>
    );
  }

  if (!mascota || error) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">😿 Oops</h1>
          <p className="text-gray-300 mb-4">
            {error || 'No pudimos encontrar la información de esta mascota.'}
          </p>
          <p className="text-gray-400 text-sm">
            Si encontraste una mascota, por favor contacta a nuestro equipo en{' '}
            <a href="https://instagram.com" className="text-accent hover:underline">
              Instagram
            </a>
            {' '}o{' '}
            <a href="https://tiktok.com" className="text-accent hover:underline">
              TikTok
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-900 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* CARD PRINCIPAL */}
        <div className="bg-primary-900 border-2 border-accent border-opacity-30 rounded-lg overflow-hidden shadow-xl mb-6">
          {/* Sección Superior - Foto de la Mascota */}
          {mascota.foto_url && (
            <div className="relative h-64 sm:h-80 bg-gradient-to-b from-accent from-25% to-primary-900">
              <img
                src={mascota.foto_url}
                alt={mascota.nombre}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Información de la Mascota */}
          <div className="p-6 sm:p-8">
            {/* Mensaje Principal */}
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
                ¡Hola! 🐾
              </h1>
              <h2 className="text-2xl sm:text-3xl text-accent font-semibold mb-4">
                Me llamo <span className="underline">{mascota.nombre}</span> y estoy perdido
              </h2>
              <p className="text-gray-300 text-lg">
                Gracias por escanear mi código QR. Por favor, ayuda a reunirme con mi dueño llenando el
                formulario abajo.
              </p>
            </div>

            {/* Información de la Mascota - Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-primary-900 bg-opacity-50 border border-accent border-opacity-20 rounded-lg mb-8">
              <div>
                <p className="text-gray-400 text-sm">Especie</p>
                <p className="text-white font-semibold">{mascota.especie}</p>
              </div>
              {mascota.raza && (
                <div>
                  <p className="text-gray-400 text-sm">Raza</p>
                  <p className="text-white font-semibold truncate">{mascota.raza}</p>
                </div>
              )}
              {mascota.color && (
                <div>
                  <p className="text-gray-400 text-sm">Color</p>
                  <p className="text-white font-semibold truncate">{mascota.color}</p>
                </div>
              )}
            </div>

            {/* Notas Médicas (si existen) */}
            {mascota.notas_medicas && (
              <div className="mb-8 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-40 rounded-lg">
                <p className="text-yellow-400 font-semibold mb-1">⚠️ Información Importante</p>
                <p className="text-yellow-200 text-sm">{mascota.notas_medicas}</p>
              </div>
            )}
          </div>
        </div>

        {/* FORMULARIO DE REPORTE */}
        <div className="bg-primary-900 border border-accent border-opacity-20 rounded-lg p-6 sm:p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-2">Reportar Hallazgo</h3>
          <p className="text-gray-300 mb-6">
            Dile al dueño de {mascota.nombre} cómo y dónde lo encontraste
          </p>

          {/* Mensaje de Éxito */}
          {submitted && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-20 border border-green-500 border-opacity-50 rounded-lg">
              <p className="text-green-400 font-semibold">✓ ¡Reporte enviado exitosamente!</p>
              <p className="text-green-300 text-sm mt-2">
                El dueño de {mascota.nombre} será notificado pronto con tus datos de contacto.
              </p>
            </div>
          )}

          {/* Mensaje de Error */}
          {error && !submitted && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 rounded-lg">
              <p className="text-red-400 font-semibold">✗ Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Formulario */}
          {!submitted && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre del Rescatador */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Tu Nombre*
                </label>
                <input
                  type="text"
                  name="nombre_rescatador"
                  value={formData.nombre_rescatador}
                  onChange={handleChange}
                  placeholder="Ej: María García"
                  required
                  className="w-full px-4 py-3 bg-white bg-opacity-5 border border-accent border-opacity-30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:bg-opacity-10 transition-all"
                />
              </div>

              {/* Tipo de Contacto */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Tipo de Contacto*
                </label>
                <select
                  name="tipo_contacto"
                  value={formData.tipo_contacto}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white bg-opacity-5 border border-accent border-opacity-30 rounded-lg text-white focus:outline-none focus:border-accent focus:bg-opacity-10 transition-all"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telefono">Teléfono</option>
                  <option value="email">Email</option>
                </select>
              </div>

              {/* Contacto */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  {formData.tipo_contacto === 'email' ? 'Tu Email' : 'Tu Número'}*
                </label>
                <input
                  type={formData.tipo_contacto === 'email' ? 'email' : 'tel'}
                  name="contacto_rescatador"
                  value={formData.contacto_rescatador}
                  onChange={handleChange}
                  placeholder={
                    formData.tipo_contacto === 'email'
                      ? 'tu@email.com'
                      : '+1 (555) 123-4567'
                  }
                  required
                  className="w-full px-4 py-3 bg-white bg-opacity-5 border border-accent border-opacity-30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:bg-opacity-10 transition-all"
                />
              </div>

              {/* Descripción de Ubicación */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  ¿Dónde encontraste a {mascota.nombre}?*
                </label>
                <textarea
                  name="mensaje_ubicacion"
                  value={formData.mensaje_ubicacion}
                  onChange={handleChange}
                  placeholder="Describe el lugar en detalle: calle, referencias, barrio, condición de la mascota, etc."
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white bg-opacity-5 border border-accent border-opacity-30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:bg-opacity-10 transition-all resize-none"
                />
              </div>

              {/* Ubicación GPS */}
              <div className="p-4 bg-accent bg-opacity-10 border border-accent border-opacity-30 rounded-lg">
                <div className="mb-3">
                  <p className="text-white font-semibold mb-2">📍 Ubicación GPS (Opcional)</p>
                  <p className="text-gray-300 text-sm mb-3">
                    Presiona el botón para enviar automáticamente tu ubicación exacta
                  </p>
                </div>

                {/* Estado del GPS */}
                {formData.latitud && formData.longitud && (
                  <div className="mb-3 p-3 bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded text-green-400 text-sm">
                    ✓ Ubicación obtenida: ({formData.latitud.toFixed(4)}, {formData.longitud.toFixed(4)})
                  </div>
                )}

                {gpsError && (
                  <div className="mb-3 p-3 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded text-red-400 text-sm">
                    ⚠️ {gpsError}
                  </div>
                )}

                {/* Botón GPS */}
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gpsLoading}
                  className="w-full px-6 py-3 bg-accent text-primary-900 font-semibold rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {gpsLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary-900"></div>
                      Obteniendo ubicación...
                    </>
                  ) : (
                    <>
                      📍 Enviar Mi Ubicación GPS
                    </>
                  )}
                </button>
              </div>

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-accent text-primary-900 font-bold text-lg rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {submitting ? 'Enviando...' : '✓ Reportar Hallazgo'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>
            ¿Preguntas? Contacta a nuestro equipo en{' '}
            <a href="https://instagram.com" className="text-accent hover:underline">
              Instagram
            </a>
            {' '}o{' '}
            <a href="https://tiktok.com" className="text-accent hover:underline">
              TikTok
            </a>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            BQR © 2024 - Recuperando mascotas con QR
          </p>
        </div>
      </div>
    </div>
  );
}

