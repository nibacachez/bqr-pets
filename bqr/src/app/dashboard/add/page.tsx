import AddPetForm from '@/components/AddPetForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrar Nueva Mascota - BQR',
  description:
    'Crea un perfil de tu mascota y genera un código QR único para su protección',
};

/**
 * PAGE: Registrar Nueva Mascota
 * Ruta: /dashboard/add
 * 
 * Página protegida (requiere autenticación) para registrar una nueva mascota.
 * El usuario puede:
 * - Subir foto a Supabase Storage
 * - Ingresa nombre, tipo y notas médicas
 * - Se genera automáticamente un código QR
 */
export default function AddPetPage() {
  return <AddPetForm />;
}
