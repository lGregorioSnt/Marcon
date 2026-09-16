"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wrench, ScrollText, Bell, Headset, LogOut } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Não renderiza a BottomNav na página de login
  if (pathname === "/login") {
    return null;
  }

  const tabs = [
    { name: "Home", path: "/", Icon: Wrench },
    { name: "Histórico", path: "/history", Icon: ScrollText },
    { name: "Alertas", path: "/notifications", Icon: Bell },
    { name: "Suporte", path: "/support", Icon: Headset },
  ];

  // 🚪 Função para deslogar
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      // Limpa os dados do usuário e o token da memória
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      
      // Redireciona para a tela de login
      router.push("/login");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-50 rounded-t-[2rem]">
      <div className="max-w-md mx-auto flex justify-between items-center px-4 py-4 pb-6">

        {/* 🔗 MAP DAS ABAS DE NAVEGAÇÃO */}
        {tabs.map((tab) => {
          const active = pathname === tab.path;

          return (
            <Link
              key={tab.path}
              href={tab.path}
              className="relative flex flex-col items-center justify-center w-14 h-14 group"
            >
              {/* Fundo ativo (Pill) */}
              {active && (
                <div className="absolute inset-0 bg-[#00509d]/10 rounded-2xl -z-10 scale-110 transition-transform" />
              )}

              <span className={`mb-1 flex items-center justify-center transition-all duration-300 ${active ? 'scale-110 text-[#00509d]' : 'text-[#94A3B8] group-hover:scale-110 group-hover:text-[#64748B]'}`}>
                <tab.Icon size={24} strokeWidth={active ? 2.5 : 2} />
              </span>

              <span
                className={`text-[10px] tracking-wide transition-colors ${
                  active
                    ? "text-[#00509d] font-extrabold"
                    : "text-[#94A3B8] font-bold group-hover:text-[#64748B]"
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}

        {/* 🚪 BOTÃO DE SAIR (LOGOUT) */}
        <button
          onClick={handleLogout}
          className="relative flex flex-col items-center justify-center w-14 h-14 group transition-transform active:scale-95"
        >
          <span className="mb-1 flex items-center justify-center transition-all duration-300 text-[#DC2626] group-hover:scale-110">
            <LogOut size={24} strokeWidth={2} />
          </span>
          <span className="text-[10px] tracking-wide transition-colors text-[#DC2626] font-bold">
            Sair
          </span>
        </button>

      </div>
    </div>
  );
}