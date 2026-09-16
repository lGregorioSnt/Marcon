import "./globals.css";
import BottomNav from "./components/BottomNav";
import GlobalAlert from "./components/GlobalAlert";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export const metadata: Metadata = {
  title: 'Marcon',
  description: 'Sistema de Rastreabilidade de Ativos - Marcon',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className="bg-[var(--bg)] text-[var(--text-primary)]">
        <GlobalAlert />

        {children}

        {/* NAV FIXA */}
        <BottomNav />

        {/* ESPAÇO PARA NÃO COBRIR CONTEÚDO */}
        <div className="h-16" />
      </body>
    </html>
  );
}