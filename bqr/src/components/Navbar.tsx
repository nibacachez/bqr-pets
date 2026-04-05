import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="bg-primary-900 border-b border-accent border-opacity-20 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo - Izquierda */}
        <div className="flex items-center min-w-fit">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="BQR Logo"
                width={40}
                height={40}
                className="object-cover"
                priority
              />
            </div>
            <span className="font-bold text-xl text-white hidden sm:inline">BQR</span>
          </Link>
        </div>

        {/* Botones Centrales - Centro */}
        <div className="flex items-center gap-3 flex-1 justify-center mx-4">
          <a
            href="#"
            className="px-4 py-2 bg-accent text-primary-900 font-semibold rounded-md hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-accent"
          >
            Nuestro Instagram
          </a>
          <a
            href="#"
            className="px-4 py-2 bg-accent text-primary-900 font-semibold rounded-md hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-accent"
          >
            Nuestro TikTok
          </a>
        </div>

        {/* Botón Mi Cuenta - Derecha */}
        <div className="flex items-center min-w-fit">
          <Link
            href="/login"
            className="px-6 py-2 bg-accent text-primary-900 font-semibold rounded-md hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-accent flex items-center gap-2"
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="hidden sm:inline">Mi Cuenta</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
