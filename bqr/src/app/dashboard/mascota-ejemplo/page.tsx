'use client';

import QRCodeGenerator from '@/components/QRCodeGenerator';

/**
 * PÁGINA PROTEGIDA: /dashboard/mascota/[mascotaId]
 * 
 * ⚠️ IMPORTANTE: Esta es una página PROTEGIDA solo para el dueño de la mascota
 * 
 * El componente QRCodeGenerator SOLO debe importarse aquí y en páginas similares
 * que requieren autenticación. NUNCA en páginas públicas.
 * 
 * El dueño puede:
 * - Ver el código QR de su mascota
 * - Descargarlo como PNG
 * - Imprimirlo para pegatinas, collar, etc.
 * 
 * Este es UN EJEMPLO de cómo usar el componente
 */

export default function DashboardMascotaPage() {
  // 🔒 EN PRODUCCIÓN: Validar que auth.uid() == mascota.dueno_id
  // const { data: session } = await supabase.auth.getSession();
  // if (!session) redirect('/login');

  // En este ejemplo usamos un ID dummy
  const mascotaId = '550e8400-e29b-41d4-a716-446655440000';
  const mascotaNombre = 'Max - Pastor Alemán';

  return (
    <div className="min-h-screen bg-primary-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard - Mi Mascota</h1>
          <p className="text-gray-300">Aquí está el código QR de recuperación de tu mascota</p>
        </div>

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información de la Mascota */}
          <div className="lg:col-span-1">
            <div className="bg-primary-900 border border-accent border-opacity-20 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">Max - Pastor Alemán</h2>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400">Especie</p>
                  <p className="text-white font-semibold">Perro</p>
                </div>
                <div>
                  <p className="text-gray-400">Raza</p>
                  <p className="text-white font-semibold">Pastor Alemán</p>
                </div>
                <div>
                  <p className="text-gray-400">Color</p>
                  <p className="text-white font-semibold">Negro y Marrón</p>
                </div>
                <div>
                  <p className="text-gray-400">Microchip</p>
                  <p className="text-white font-semibold text-xs">981192740812374</p>
                </div>
              </div>

              <div className="pt-4 border-t border-accent border-opacity-20">
                <h3 className="text-white font-semibold mb-2">Notas Médicas</h3>
                <p className="text-gray-300 text-sm">
                  Alérgico a la penicilina. Toma Cardium diario por soplo cardíaco.
                </p>
              </div>
            </div>
          </div>

          {/* Generador de QR - COMPONENTE PROTEGIDO */}
          <div className="lg:col-span-2">
            <QRCodeGenerator
              mascotaId={mascotaId}
              mascotaNombre={mascotaNombre}
              tamaño={300}
            />
          </div>
        </div>

        {/* Sección de Información Adicional */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-primary-900 border border-accent border-opacity-20 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">📋 ¿Cómo funciona?</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>Descarga o imprime el código QR</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>Colócalo en el collar, placa o etiqueta de tu mascota</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>Si la mascota se pierde, quien la encuentre escanea el QR</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>Automáticamente recibirás un reporte con ubicación y contacto</span>
              </li>
            </ul>
          </div>

          <div className="bg-primary-900 border border-accent border-opacity-20 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">🔐 Seguridad de Datos</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>Tu información personal está oculta públicamente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>Solo los reportes pueden ver datos de contacto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>Puedes desactivar el QR en cualquier momento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>Encriptación end-to-end en toda la comunicación</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
