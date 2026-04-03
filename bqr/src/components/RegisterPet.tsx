'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PetFormData {
  nombre: string;
  tipo: 'Perro' | 'Gato' | '';
  raza?: string;
  color?: string;
  notas?: string;
  foto?: File | null;
  fotoPreview?: string;
}

/**
 * COMPONENTE: RegisterPet
 * 
 * Formulario profesional para registrar una nueva mascota
 * con diseño responsivo y validación de campos
 * 
 * Características:
 * - Campos: Nombre, Tipo, Raza, Color, Notas
 * - Upload de foto con preview
 * - Botones en color celeste (#00C4CC)
 * - Tarjetas redondeadas
 * - Botones sociales (Instagram, TikTok)
 */
export default function RegisterPet() {
  const [formData, setFormData] = useState<PetFormData>({
    nombre: '',
    tipo: '',
    raza: '',
    color: '',
    notas: '',
    foto: null,
    fotoPreview: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Manejar cambios en campos de texto
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Manejar selección de foto
   */
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Validar que sea imagen
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona una imagen válida');
        return;
      }

      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La foto no debe superar 5MB');
        return;
      }

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          foto: file,
          fotoPreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validar campos requeridos
    if (!formData.nombre.trim()) {
      setError('El nombre de la mascota es requerido');
      setLoading(false);
      return;
    }

    if (!formData.tipo) {
      setError('Selecciona el tipo de mascota');
      setLoading(false);
      return;
    }

    try {
      // TODO: Enviar a API/Supabase
      console.log('Datos del formulario:', formData);

      // Simular envío
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
      setFormData({
        nombre: '',
        tipo: '',
        raza: '',
        color: '',
        notas: '',
        foto: null,
        fotoPreview: undefined,
      });

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al registrar la mascota. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-900 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* HEADER */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            🐾 Registra tu Mascota
          </h1>
          <p className="text-gray-300 text-lg">
            Crea un código QR único para proteger a tu mascota
          </p>
        </div>

        {/* FORMULARIO PRINCIPAL */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mensaje de Éxito */}
          {success && (
            <div className="p-4 bg-green-500 bg-opacity-20 border-l-4 border-green-400 rounded-r-lg">
              <p className="text-green-300 font-bold">
                ✓ Mascota registrada exitosamente
              </p>
              <p className="text-green-200 text-sm mt-1">
                Ya puedes descargar el código QR para tu mascota
              </p>
            </div>
          )}

          {/* Mensaje de Error */}
          {error && (
            <div className="p-4 bg-red-500 bg-opacity-20 border-l-4 border-red-400 rounded-r-lg">
              <p className="text-red-300 font-bold">✗ Error</p>
              <p className="text-red-200 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* CARD 1: Información Básica */}
          <div className="bg-primary-800 border-2 border-accent border-opacity-30 rounded-lg p-6 sm:p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-accent mb-6 flex items-center gap-2">
              <span>📋</span> Información Básica
            </h2>

            {/* Nombre de Mascota */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Nombre de tu Mascota *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Max, Luna, Pelusa"
                required
                className="w-full px-4 py-3 bg-primary-700 bg-opacity-50 border-2 border-accent border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:bg-opacity-70 transition-all"
              />
            </div>

            {/* Grid: Tipo y Raza */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Tipo de Mascota */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Tipo de Mascota *
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-primary-700 bg-opacity-50 border-2 border-accent border-opacity-30 rounded-lg text-white focus:outline-none focus:border-accent focus:bg-opacity-70 transition-all cursor-pointer"
                >
                  <option value="">Selecciona...</option>
                  <option value="Perro">🐕 Perro</option>
                  <option value="Gato">🐈 Gato</option>
                </select>
              </div>

              {/* Raza */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Raza (Opcional)
                </label>
                <input
                  type="text"
                  name="raza"
                  value={formData.raza}
                  onChange={handleInputChange}
                  placeholder="Ej: Pastor Alemán"
                  className="w-full px-4 py-3 bg-primary-700 bg-opacity-50 border-2 border-accent border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:bg-opacity-70 transition-all"
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Color (Opcional)
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="Ej: Negro y marrón"
                className="w-full px-4 py-3 bg-primary-700 bg-opacity-50 border-2 border-accent border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:bg-opacity-70 transition-all"
              />
            </div>
          </div>

          {/* CARD 2: Foto */}
          <div className="bg-primary-800 border-2 border-accent border-opacity-30 rounded-lg p-6 sm:p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-accent mb-6 flex items-center gap-2">
              <span>📸</span> Foto de tu Mascota
            </h2>

            {/* Foto Preview */}
            {formData.fotoPreview ? (
              <div className="mb-6">
                <div className="relative w-full h-64 sm:h-72 bg-primary-700 rounded-lg overflow-hidden">
                  <Image
                    src={formData.fotoPreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      foto: null,
                      fotoPreview: undefined,
                    })
                  }
                  className="mt-3 text-red-400 text-sm hover:text-red-300 font-semibold"
                >
                  ✕ Cambiar foto
                </button>
              </div>
            ) : (
              <div className="mb-6 p-8 border-2 border-dashed border-accent border-opacity-40 rounded-lg text-center bg-primary-700 bg-opacity-20">
                <p className="text-accent text-lg font-semibold mb-2">📷</p>
                <p className="text-white font-semibold mb-1">
                  Arrastra tu foto aquí
                </p>
                <p className="text-gray-400 text-sm">
                  o haz clic para seleccionar (máx 5MB)
                </p>
              </div>
            )}

            {/* Input de Foto */}
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.querySelector(
                    'input[type="file"]'
                  ) as HTMLInputElement;
                  input?.click();
                }}
                className="w-full px-6 py-3 bg-accent text-primary-900 font-bold rounded-lg hover:bg-opacity-90 transition-all duration-300 shadow-md"
              >
                📁 Subir Foto
              </button>
            </label>
          </div>

          {/* CARD 3: Información Médica */}
          <div className="bg-primary-800 border-2 border-accent border-opacity-30 rounded-lg p-6 sm:p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-accent mb-6 flex items-center gap-2">
              <span>💊</span> Información Adicional
            </h2>

            <div>
              <label className="block text-white font-semibold mb-2">
                Notas Médicas (Opcional)
              </label>
              <p className="text-gray-400 text-sm mb-3">
                Alergias, medicamentos, cirugías previas o cualquier información importante
              </p>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleInputChange}
                placeholder="Ej: Alérgico a la penicilina, toma Cardium diariamente..."
                rows={4}
                className="w-full px-4 py-3 bg-primary-700 bg-opacity-50 border-2 border-accent border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:bg-opacity-70 transition-all resize-none"
              />
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-accent text-primary-900 font-bold text-lg rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Registrando...
                </>
              ) : (
                '✓ Registrar Mascota'
              )}
            </button>

            <button
              type="reset"
              className="px-6 py-4 bg-white bg-opacity-10 text-white font-bold rounded-lg hover:bg-opacity-20 transition-all duration-300 border-2 border-white border-opacity-30"
            >
              ↻ Limpiar
            </button>
          </div>
        </form>

        {/* SOCIAL LINKS */}
        <div className="mt-12 p-6 bg-primary-800 border border-accent border-opacity-20 rounded-lg text-center">
          <p className="text-gray-300 font-semibold mb-4">
            ¿Necesitas ayuda? Síguenos en redes sociales
          </p>

          <div className="flex items-center justify-center gap-6">
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105"
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
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-black to-gray-800 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-black/50 transition-all duration-300 transform hover:scale-105"
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

        {/* FOOTER INFO */}
        <div className="mt-10 text-center text-gray-400 text-sm">
          <p>
            Los datos de tu mascota are protected by BQR security protocols
          </p>
          <p className="mt-2">
            © 2024 BQR - Recuperando mascotas con QR
          </p>
        </div>
      </div>
    </div>
  );
}
