import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agro360 Cloud',
  description: 'Plataforma SaaS de gestión agropecuaria',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
