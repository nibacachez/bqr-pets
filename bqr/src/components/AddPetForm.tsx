'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

interface PetFormData {
  nombre: string;
  especie: 'Perro' | 'Gato' | '';
  raza?: string;
  color?: string;
  notas_medicas?: string;
  foto?: File | null;
  fotoPreview?: string;
}

/**
 * COMPONENTE: AddPetForm
 * 
 * Formulario para registrar una nueva mascota
 * 
 * Características:
 * - Upload de foto a Supabase Storage
 * - Validación de campos
 * - Genera código QR automático después de guardar
 * - Guarda en tabla 'mascotas' de Supabase
 * - Respuesta amigable con enlace al código QR
 */
export default function AddPetForm() {
  const [formData, setFormData] = useState<PetFormData>({
    nombre: '',
    especie: '',
    raza: '',
    color: '',
    notas_medicas: '',
    foto: null,
    fotoPreview: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPetId, setCreatedPetId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Manejar cambios en campos de texto
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

      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('La foto no debe superar 10MB');
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
   * Subir foto a Supabase Storage
   */
  const uploadFotoToStorage = async (
    file: File,
    mascostaId: string
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${mascostaId}-${Date.now()}.${fileExt}`;
      const filePath = `mascotas/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('pet-photos')
        .upload(filePath, file, {
          upsert: false,
          onUploadProgress: (progress) => {
            const percentComplete =
              (progress.loaded / progress.total) * 100;
            setUploadProgress(percentComplete);
          },
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('pet-photos').getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error al subir foto:', err);
      throw err;
    }
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validar campos requeridos
      if (!formData.nombre.trim()) {
        throw new Error('El nombre de la mascota es requerido');
      }

      if (!formData.especie) {
        throw new Error('Selecciona el tipo de mascota');
      }

      // 1. Crear registro en tabla 'mascotas' primero
      const { data: mascostaData, error: insertError } = await supabase
        .from('mascotas')
        .insert({
          nombre: formData.nombre,
          especie: formData.especie,
          raza: formData.raza || null,
          color: formData.color || null,
          notas_medicas: formData.notas_medicas || null,
          fecha_registro: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Error al registrar mascota: ${insertError.message}`);
      }

      // 2. Si hay foto, subirla a Storage
      let fotoUrl = null;
      if (formData.foto) {
        fotoUrl = await uploadFotoToStorage(
          formData.foto,
          mascostaData.id
        );

        // Actualizar registro con URL de foto
        const { error: updateError } = await supabase
          .from('mascotas')
          .update({ foto_url: fotoUrl })
          .eq('id', mascostaData.id);

        if (updateError) {
          console.warn('Error al actualizar foto URL:', updateError);
        }
      }

      // Éxito
      setSuccess(true);
      setCreatedPetId(mascostaData.id);
      setFormData({
        nombre: '',
        especie: '',
        raza: '',
        color: '',
        notas_medicas: '',
        foto: null,
        fotoPreview: undefined,
      });
      setUploadProgress(0);

      // Auto-hide mensaje de éxito
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al registrar la mascota';
      setError(message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Si fue exitoso, mostrar pantalla de confirmación
  if (success && createdPetId) {
    return (
      <div className="min-h-screen bg-primary-900 py-12 px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-primary-800 border-2 border-accent rounded-lg p-8 sm:p-12 text-center shadow-lg">
            <div className="text-6xl mb-6 animate-bounce">🎉</div>

            <h1 className="text-3xl sm:text-4xl font-bold text-accent mb-4">
              ¡Mascota Registrada!
            </h1>

            <p className="text-gray-300 text-lg mb-6">
              Tu mascota <strong className="text-white">{formData.nombre || 'nueva mascota'}</strong> ha sido registrada exitosamente
            </p>

            <div className="bg-primary-700 bg-opacity-50 border border-accent border-opacity-30 rounded-lg p-6 mb-8">
              <p className="text-gray-300 mb-4">
                ID de tu mascota:
              </p>
              <code className="text-accent font-mono text-sm bg-primary-600 p-3 rounded block break-all">
                {createdPetId}
              </code>
            </div>

            <p className="text-gray-400 mb-8">
              Ahora puedes descargar el código QR y pegarlo en la identificación de tu mascota
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/dashboard/pet/${createdPetId}`}
                className="flex-1 px-6 py-3 bg-accent text-primary-900 font-bold rounded-lg hover:bg-opacity-90 transition-all duration-300"
              >
                📱 Ver Código QR
              </Link>

              <button
                onClick={() => {
                  setSuccess(false);
                  setCreatedPetId(null);
                }}
                className="flex-1 px-6 py-3 bg-white bg-opacity-10 text-white font-bold rounded-lg hover:bg-opacity-20 transition-all"
              >
                ➕ Registrar Otra Mascota
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Nombre */}
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
              {/* Tipo */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Tipo de Mascota *
                </label>
                <select
                  name="especie"
                  value={formData.especie}
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
                  o haz clic para seleccionar (máx 10MB)
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
                className="w-full px-6 py-3 bg-accent text-primary-900 font-bold rounded-lg hover:bg-opacity-90 transition-all duration-300"
              >
                📁 Subir Foto
              </button>
            </label>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="w-full bg-primary-700 bg-opacity-50 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-gray-400 text-sm mt-2 text-center">
                  Subiendo foto: {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>

          {/* CARD 3: Notas Médicas */}
          <div className="bg-primary-800 border-2 border-accent border-opacity-30 rounded-lg p-6 sm:p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-accent mb-6 flex items-center gap-2">
              <span>💊</span> Información Médica
            </h2>

            <label className="block">
              <span className="text-white font-semibold mb-2 block">
                Notas Médicas (Opcional)
              </span>
              <p className="text-gray-400 text-sm mb-3">
                Alergias, medicamentos, cirugías previas o cualquier información importante
              </p>
              <textarea
                name="notas_medicas"
                value={formData.notas_medicas}
                onChange={handleInputChange}
                placeholder="Ej: Alérgico a la penicilina, toma Cardium diariamente, falta ojo izquierdo..."
                rows={4}
                className="w-full px-4 py-3 bg-primary-700 bg-opacity-50 border-2 border-accent border-opacity-30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:bg-opacity-70 transition-all resize-none"
              />
            </label>
          </div>

          {/* BOTÓN DE ENVÍO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-accent text-primary-900 font-bold text-lg rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Registrando mascota...
              </>
            ) : (
              '✓ Registrar Mascota'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
