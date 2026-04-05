import RegisterPet from '@/components/RegisterPet';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrar Mascota - BQR',
  description: 'Registra tu mascota y crea un código QR único para protegerla',
};

/**
 * PAGE: Registrar Mascota
 * Ruta: /dashboard/register-pet
 * 
 * Página protegida para registrar nuevas mascotas
 */
export default function RegisterPetPage() {
  return <RegisterPet />;
}
