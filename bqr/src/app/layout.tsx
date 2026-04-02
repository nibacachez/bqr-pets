import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BQR - Recupera tu Mascota con QR",
  description: "Aplicación profesional para recuperación de mascotas mediante códigos QR. Protege a tu mascota con BQR.",
  keywords: ["mascotas", "perros", "gatos", "QR", "recuperación", "seguridad"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-primary-900">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
