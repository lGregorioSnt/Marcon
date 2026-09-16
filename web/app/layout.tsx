import React from 'react';
import Topbar from './components/Topbar'; 
import GlobalAlert from './components/GlobalAlert';
import { Metadata } from 'next'; // Importamos a tipagem do Metadata

// Esse objeto controla o que aparece na aba do navegador
export const metadata: Metadata = {
  title: 'Marcon',
  description: 'Sistema de Rastreabilidade de Ativos - Marcon',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0, boxSizing: 'border-box' }}>
        <GlobalAlert />
        <Topbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}