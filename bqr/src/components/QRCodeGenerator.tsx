'use client';

import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { useRef } from 'react';

interface QRCodeGeneratorProps {
  mascotaId: string;
  mascotaNombre?: string;
  tamaño?: number;
}

/**
 * Componente para generar códigos QR funcionales para mascotas
 * 
 * IMPORTANTE: Este componente solo debe importarse en páginas PROTEGIDAS (dashboard del dueño)
 * No debe exponerse públicamente en la página de inicio o páginas no autenticadas.
 * 
 * El QR apunta a: https://bqr-pets.vercel.app/pet/[mascotaId]
 * Cualquiera que escanee el QR puede reportar el hallazgo de la mascota
 * 
 * @param mascotaId - ID único de la mascota (UUID)
 * @param mascotaNombre - Nombre de la mascota (opcional, para contexto)
 * @param tamaño - Tamaño del código QR en píxeles (default: 256)
 */
export default function QRCodeGenerator({
  mascotaId,
  mascotaNombre = 'Mascota BQR',
  tamaño = 256,
}: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // URL pública donde se reporta el hallazgo
  const qrUrl = `https://bqr-pets.vercel.app/pet/${mascotaId}`;

  /**
   * Descargar el código QR como PNG
   */
  const descargarQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${mascotaId}.png`;
      link.click();
    }
  };

  /**
   * Imprimir el código QR
   */
  const imprimirQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const printWindow = window.open();
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Código QR - ${mascotaNombre}</title>
              <style>
                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  background-color: #f5f5f5;
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                  text-align: center;
                }
                h2 {
                  color: #101E3A;
                  margin-bottom: 20px;
                }
                img {
                  max-width: 400px;
                  height: auto;
                }
                p {
                  color: #666;
                  margin-top: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Código QR - ${mascotaNombre}</h2>
                <img src="${canvas.toDataURL()}" />
                <p>Escanea este código para reportar a ${mascotaNombre}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-primary-900 border border-accent border-opacity-20 rounded-lg">
      {/* Título */}
      {mascotaNombre && (
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">{mascotaNombre}</h3>
          <p className="text-sm text-gray-400">Código QR de Recuperación</p>
        </div>
      )}

      {/* Contenedor del QR */}
      <div
        ref={qrRef}
        className="bg-white p-4 rounded-lg shadow-lg"
      >
        <QRCode
          value={qrUrl}
          size={tamaño}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: '/logo.png',
            x: undefined,
            y: undefined,
            height: tamaño * 0.2,
            width: tamaño * 0.2,
            excavate: true,
          }}
        />
      </div>

      {/* Información del QR */}
      <div className="text-center text-sm text-gray-300 max-w-xs">
        <p className="text-xs text-gray-400 break-all">
          URL: {qrUrl}
        </p>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 flex-wrap justify-center w-full">
        <button
          onClick={descargarQR}
          className="px-4 py-2 bg-accent text-primary-900 font-semibold rounded-md hover:bg-opacity-90 transition-all duration-300 flex items-center gap-2 shadow-md"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Descargar QR
        </button>

        <button
          onClick={imprimirQR}
          className="px-4 py-2 bg-accent text-primary-900 font-semibold rounded-md hover:bg-opacity-90 transition-all duration-300 flex items-center gap-2 shadow-md"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h6a2 2 0 002-2v-2a2 2 0 00-2-2h-2m-4-4V9m0 4v4m0-11v.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          Imprimir QR
        </button>
      </div>

      {/* Advertencia de seguridad */}
      <div className="mt-4 p-3 bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded text-yellow-400 text-xs">
        <p>
          ⚠️ Este componente es CONFIDENCIAL. Solo debe estar disponible en páginas protegidas del dashboard.
        </p>
      </div>
    </div>
  );
}
