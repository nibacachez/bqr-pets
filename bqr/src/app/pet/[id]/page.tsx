'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

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
 * Esta es la página que ven los RESCATADORES cuando escanean el QR de una mascota perdida.
 * 
 * Características:
 * - Muestra foto y datos básicos de la mascota (SIN datos sensibles del dueño)
 * - Formulario profesional para que rescatador reporte el hallazgo
 * - Botón GPS para capturar ubicación automáticamente con Geolocation API
 * - Guarda reporte en tabla reportes_extravio
 * - Crea Google Maps link con coordenadas para facilitar navigación
 * - Footer con botones de redes sociales (Instagram/TikTok)
 * 
 * NO requiere autenticación - es completamente pública
 */
export default function PetReportPage() {
  const params = useParams();
  const petId = params.id as string;

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
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * 1. OBTENER DATOS DE LA MASCOTA DESDE SUPABASE
   */
  useEffect(() => {
    const fetchMascota = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('mascotas')
          .select('id, nombre, especie, foto_url, notas_medicas, raza, color')
          .eq('id', petId)
          .single();

        if (error) {
          setError('🐾 No encontramos esa mascota. Verifica el código QR.');
          console.error('Error al obtener mascota:', error);
          return;
        }

        setMascota(data);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar la información de la mascota');
      } finally {
        setLoading(false);
      }
    };

    if (petId) {
      fetchMascota();
    }
  }, [petId]);

  /**
   * 2. MANEJAR CAMBIOS EN LOS CAMPOS DEL FORMULARIO
   */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSubmitError(null);
  };

  /**
   * 3. OBTENER UBICACIÓN GPS DEL NAVEGADOR
   */
  const getGPSLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Tu navegador no soporta GPS. Ingresa la ubicación manualmente.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
        }));
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(
          'No pudimos obtener tu ubicación. ' +
            (err.code === 1
              ? 'Por favor activa los permisos de ubicación.'
              : 'Intenta de nuevo.')
        );
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  };

  /**
   * 4. ENVIAR REPORTE AL DUEÑO
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      // Validación
      if (!formData.nombre_rescatador.trim()) {
        throw new Error('Por favor ingresa tu nombre');
      }

      if (!formData.contacto_rescatador.trim()) {
        throw new Error('Por favor ingresa tu contacto');
      }

      if (!formData.mensaje_ubicacion.trim()) {
        throw new Error('Por favor describe dónde encontraste la mascota');
      }

      // Crear Google Maps link si tenemos coordenadas
      let mapsLink = null;
      if (formData.latitud && formData.longitud) {
        mapsLink = `https://maps.google.com/?q=${formData.latitud},${formData.longitud}`;
      }

      // Guardar reporte en Supabase
      const { error: insertError } = await supabase
        .from('reportes_extravio')
        .insert({
          mascota_id: petId,
          nombre_rescatador: formData.nombre_rescatador,
          contacto_rescatador: formData.contacto_rescatador,
          tipo_contacto: formData.tipo_contacto,
          mensaje_ubicacion: formData.mensaje_ubicacion,
          latitud: formData.latitud,
          longitud: formData.longitud,
          maps_link: mapsLink,
          fecha_reporte: new Date().toISOString(),
          estado: 'pendiente',
        });

      if (insertError) {
        throw new Error(`Error al guardar reporte: ${insertError.message}`);
      }

      // Éxito - mostrar pantalla de confirmación
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
      const message =
        err instanceof Error
          ? err.message
          : 'Error al enviar el reporte. Intenta de nuevo.';
      setSubmitError(message);
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 5. RENDERIZAR LA PÁGINA
   */

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐾</div>
          <p className="text-white text-lg">Cargando información de la mascota...</p>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (!mascota || error) {
    return (
      <div className="min-h-screen bg-primary-900 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            No Encontramos la Mascota
          </h1>
          <p className="text-gray-300 mb-6">
            {error || 'El código QR podría ser inválido o haber expirado'}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-accent text-primary-900 font-bold rounded-lg hover:bg-opacity-90 transition-all"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Pantalla de éxito
  if (submitted) {
    return (
      <div className="min-h-screen bg-primary-900 py-12 px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-primary-800 border-2 border-accent rounded-lg p-8 sm:p-12 text-center shadow-lg">
            <div className="text-6xl mb-6 animate-bounce">✓</div>

            <h1 className="text-3xl sm:text-4xl font-bold text-accent mb-4">
              ¡Gracias por Ayudar!
            </h1>

            <p className="text-gray-300 text-lg mb-6">
              Tu reporte ha sido enviado al dueño de <strong className="text-white">{mascota?.nombre}</strong>
            </p>

            <div className="bg-primary-700 bg-opacity-50 border border-accent border-opacity-30 rounded-lg p-6 mb-8">
              <p className="text-gray-400 mb-3">
                El dueño recibirá:
              </p>
              <ul className="text-left space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Tu nombre y contacto</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Descripción de la ubicación</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Link directo a Google Maps (si ingresaste tu ubicación)</span>
                </li>
              </ul>
            </div>

            <p className="text-gray-400 mb-8 text-sm">
              Si recibiste más información sobre dónde la mascota fue encontrada, puedes compartirla directamente con el dueño cuando se comunique contigo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="flex-1 px-6 py-3 bg-accent text-primary-900 font-bold rounded-lg hover:bg-opacity-90 transition-all"
              >
                🏠 Ir al Inicio
              </Link>

              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    nombre_rescatador: '',
                    contacto_rescatador: '',
                    tipo_contacto: 'whatsapp',
                    mensaje_ubicacion: '',
                    latitud: null,
                    longitud: null,
                  });
                }}
                className="flex-1 px-6 py-3 bg-white bg-opacity-10 text-white font-bold rounded-lg hover:bg-opacity-20 transition-all"
              >
                ↻ Reportar Otra Mascota
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-900 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* MENSAJE DE BIENVENIDA */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            🐾 ¡Hola! Me llamo <span className="text-accent">{mascota.nombre}</span>
          </h1>
          <p className="text-gray-300 text-lg">
            Parece que me encontraste... ¡Mi dueño estará muy feliz!
          </p>
        </div>

        {/* CARD: FOTO E INFO DE LA MASCOTA */}
        <div className="bg-primary-800 border-2 border-accent border-opacity-30 rounded-lg p-6 sm:p-8 shadow-lg mb-8">
          {/* FOTO */}
          {mascota.foto_url && (
            <div className="relative w-full h-72 sm:h-96 mb-8 rounded-lg overflow-hidden border-2 border-accent border-opacity-30">
              <Image
                src={mascota.foto_url}
                alt={mascota.nombre}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* INFORMACIÓN BÁSICA (SIN DATOS DEL DUEÑO) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {/* Nombre */}
            <div className="bg-primary-700 bg-opacity-50 rounded-lg p-4 border border-accent border-opacity-20">
              <p className="text-gray-400 text-sm">Nombre</p>
              <p className="text-accent font-bold text-lg">{mascota.nombre}</p>
            </div>

            {/* Tipo */}
            <div className="bg-primary-700 bg-opacity-50 rounded-lg p-4 border border-accent border-opacity-20">
              <p className="text-gray-400 text-sm">Tipo</p>
              <p className="text-white font-bold">
                {mascota.especie === 'Perro' ? '🐕' : '🐈'} {mascota.especie}
              </p>
            </div>

            {/* Raza */}
            {mascota.raza && (
              <div className="bg-primary-700 bg-opacity-50 rounded-lg p-4 border border-accent border-opacity-20">
                <p className="text-gray-400 text-sm">Raza</p>
                <p className="text-white font-bold">{mascota.raza}</p>
              </div>
            )}

            {/* Color */}
            {mascota.color && (
              <div className="bg-primary-700 bg-opacity-50 rounded-lg p-4 border border-accent border-opacity-20">
                <p className="text-gray-400 text-sm">Color</p>
                <p className="text-white font-bold">{mascota.color}</p>
              </div>
            )}
          </div>

          {/* NOTAS MÉDICAS (Si existen) */}
          {mascota.notas_medicas && (
            <div className="bg-red-500 bg-opacity-10 border-l-4 border-red-400 rounded-r-lg p-4">
              <p className="text-red-300 font-bold mb-1">⚠️ Información Importante</p>
              <p className="text-red-200 text-sm">{mascota.notas_medicas}</p>
            </div>
          )}
        </div>

        {/* FORMULARIO PARA RESCATADOR */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error de envío */}
          {submitError && (
            <div className="p-4 bg-red-500 bg-opacity-20 border-l-4 border-red-400 rounded-r-lg">
              <p className="text-red-300 font-bold">✗ Error</p>
              <p className="text-red-200 text-sm mt-1">{submitError}</p>
            </div>
          )}

          {/* CARD: TUS DATOS */}
          <div className="bg-primary-800 border-2 border-accent border-opacity-30 rounded-lg p-6 sm:p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-accent mb-6 flex items-center gap-2">
              <span>📞</span> Tu Información
            </h2>

            {/* Nombre del Rescatador */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Tu Nombre *
              </label>
              <input
                type="text"
                name="nombre_rescatador"
                value={formData.nombre_rescatador}
                onChange={handleInputChange}
                placeholder="Ej: Juan Pérez"
                required
                className="w-full px-4 py-3 bg-primary-700 bg-opacity-50 border-2 border-accent border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:bg-opacity-70 transition-all"
              />
            </div>

            {/* Grid: Tipo Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Tipo de Contacto */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Tipo de Contacto *
                </label>
                <select
                  name="tipo_contacto"
                  value={formData.tipo_contacto}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-primary-700 bg-opacity-50 border-2 border-accent border-opacity-30 rounded-lg text-white focus:outline-none focus:border-accent focus:bg-opacity-70 transition-all cursor-pointer"
                >
                  <option value="whatsapp">📱 WhatsApp</option>
                  <option value="telefono">☎️ Teléfono</option>
                  <option value="email">📧 Email</option>
                </select>
              </div>

              {/* Contacto */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Tu {formData.tipo_contacto === 'whatsapp' ? 'WhatsApp' : formData.tipo_contacto === 'telefono' ? 'Teléfono' : 'Email'} *
                </label>
                <input
                  type={
                    formData.tipo_contacto === 'email'
                      ? 'email'
                      : 'text'
                  }
                  name="contacto_rescatador"
                  value={formData.contacto_rescatador}
                  onChange={handleInputChange}
                  placeholder={
                    formData.tipo_contacto === 'whatsapp'
                      ? '📱 +57 312 456 7890'
                      : formData.tipo_contacto === 'telefono'
                      ? '☎️ +57 (1) 401 2000'
                      : '📧 tu@email.com'
                  }
                  required
                  className="w-full px-4 py-3 bg-primary-700 bg-opacity-50 border-2 border-accent border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:bg-opacity-70 transition-all"
                />
              </div>
            </div>
          </div>

          {/* CARD: UBICACIÓN */}
          <div className="bg-primary-800 border-2 border-accent border-opacity-30 rounded-lg p-6 sm:p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-accent mb-6 flex items-center gap-2">
              <span>📍</span> Ubicación del Encuentro
            </h2>

            {/* Error de GPS */}
            {gpsError && (
              <div className="mb-5 p-3 bg-yellow-500 bg-opacity-10 border border-yellow-400 rounded-lg">
                <p className="text-yellow-300 text-sm">{gpsError}</p>
              </div>
            )}

            {/* Botón de GPS */}
            <button
              type="button"
              onClick={getGPSLocation}
              disabled={gpsLoading}
              className="w-full mb-6 px-6 py-3 bg-accent text-primary-900 font-bold rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {gpsLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Obteniendo ubicación...
                </>
              ) : formData.latitud && formData.longitud ? (
                <>
                  ✓ Ubicación Capturada: {formData.latitud.toFixed(4)}, {formData.longitud.toFixed(4)}
                </>
              ) : (
                '📍 Enviar Mi Ubicación GPS'
              )}
            </button>

            {/* Descripción de Ubicación */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Describe Dónde Encontraste a {mascota.nombre} *
              </label>
              <p className="text-gray-400 text-sm mb-3">
                Ejemplos: "Lo encontré cerca de la plaza municipal", "En la esquina de Calle 5 con Carrera 7", "Cerca del parque, detrás del supermercado"
              </p>
              <textarea
                name="mensaje_ubicacion"
                value={formData.mensaje_ubicacion}
                onChange={handleInputChange}
                placeholder="Lo encontré... cerca de... a las... se ve... hace poco que lo vi..."
                rows={4}
                required
                className="w-full px-4 py-3 bg-primary-700 bg-opacity-50 border-2 border-accent border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:bg-opacity-70 transition-all resize-none"
              />
            </div>
          </div>

          {/* BOTÓN DE ENVÍO */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-4 bg-accent text-primary-900 font-bold text-lg rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {submitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Enviando Reporte...
              </>
            ) : (
              '✓ Enviar Reporte al Dueño'
            )}
          </button>
        </form>

        {/* FOOTER CON REDES SOCIALES */}
        <div className="mt-12 p-6 bg-primary-800 border border-accent border-opacity-20 rounded-lg">
          <p className="text-gray-300 font-semibold mb-4 text-center">
            ¿Encontraste otra mascota perdida? Síguenos en redes
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {/* Instagram */}
            <a
              href="https://instagram.com/bqr.mascotas"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.645.07 4.849 0 3.205-.012 3.584-.07 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.015-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm4.846-10.405c0 .795.645 1.44 1.44 1.44s1.44-.645 1.44-1.44-.645-1.44-1.44-1.44-1.44.645-1.44 1.44z" />
              </svg>
              <span>Instagram</span>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com/@bqr.mascotas"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-black to-gray-800 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-black/50 transition-all duration-300 transform hover:scale-105"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19.58 6.936c1.595-.436 2.833-1.897 2.833-3.669 0-2.066-1.674-3.74-3.74-3.74-1.773 0-3.23 1.238-3.667 2.833-.436-1.595-1.897-2.833-3.669-2.833-2.066 0-3.74 1.674-3.74 3.74 0 1.772 1.238 3.23 2.833 3.667-.436 1.595-1.897 2.833-3.669 2.833-2.066 0-3.74 1.674-3.74 3.74 0 1.772 1.238 3.23 2.833 3.667V20c0 1.1.9 2 2 2s2-.9 2-2v-2.227c.437.065.873.097 1.31.097 1.31 0 2.55-.33 3.63-.9V20c0 1.1.9 2 2 2s2-.9 2-2v-3.554c.438.065.873.097 1.31.097 1.31 0 2.55-.33 3.63-.9" />
              </svg>
              <span>TikTok</span>
            </a>
          </div>
        </div>

        {/* INFO FOOTER */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>© 2024 BQR - Plataforma de Recuperación de Mascotas</p>
          <p>Tu información será compartida SOLO con el dueño de la mascota</p>
        </div>
      </div>
    </div>
  );
}
