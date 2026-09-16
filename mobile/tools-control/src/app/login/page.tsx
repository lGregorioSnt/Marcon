"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

export default function MobileLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [cracha, setCracha] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const marconBlue = "#00509d";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cracha, senha })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        
        console.log("✅ Login realizado com sucesso! Entrando...");
        router.push('/');
      } else {
        setErro(data.error || 'Crachá ou senha incorretos.');
      }
    } catch (err) {
      console.error("Erro de conexão ou API:", err);
      setErro('Erro de Conexão: Verifique se o servidor está ligado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🔥 FIXED INSET-0: É isso aqui que "prega" a tela nos 4 cantos e impede o scroll!
    <div className="fixed inset-0 flex flex-col bg-[#1A1C1E] overflow-hidden">
      
      {/* 🖼️ BACKGROUND IMAGEM (Com opacidade para não atrapalhar a leitura) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login.png"
          alt="Fábrica Marcon"
          layout="fill"
          objectFit="cover"
          quality={75}
          className="opacity-20"
          priority
        />
      </div>

      {/* 🚀 PARTE SUPERIOR (Flex-1 empurra o formulário pra baixo) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <Image
          src="/logo.png"
          alt="Logo Marcon"
          width={160}
          height={60}
          className="mb-4 drop-shadow-lg"
          priority
        />
        
        {/* 🌟 FRASE MOTIVACIONAL */}
        <p 
          style={{ color: marconBlue }} 
          className="text-xl font-black italic tracking-tight text-center drop-shadow-md"
        >
          Sua dedicação move<br/>nossa fábrica.
        </p>
      </div>

      {/* 📋 PARTE INFERIOR (Cartão branco fixo na base) */}
      <div className="relative z-20 w-full bg-white rounded-t-[2.5rem] px-6 pt-8 pb-12 shadow-[0_-15px_40px_rgba(0,0,0,0.3)]">
        
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-black text-[#1A1C1E] tracking-tight">Bem-vindo</h2>
          {/* 🔥 NOVA FRASE MAIS LEGAL AQUI */}
          <p className="text-sm font-extrabold text-[#00509d] uppercase tracking-widest mt-1">
            Seu Portal Operacional
          </p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-5 text-sm font-bold text-center animate-in fade-in zoom-in duration-200">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          
          {/* CRACHÁ */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
              <User size={20} className="text-[#94A3B8]" />
            </div>
            <input
              type="text"
              value={cracha}
              onChange={(e) => setCracha(e.target.value)}
              placeholder="Número do Crachá"
              className="w-full pl-12 pr-4 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl font-bold text-[#1A1C1E] placeholder:text-[#94A3B8] outline-none focus:border-[#00509d] focus:ring-2 focus:ring-[#00509d]/20 transition-all"
              required
            />
          </div>

          {/* SENHA */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
              <Lock size={20} className="text-[#94A3B8]" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              className="w-full pl-12 pr-12 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl font-bold text-[#1A1C1E] placeholder:text-[#94A3B8] outline-none focus:border-[#00509d] focus:ring-2 focus:ring-[#00509d]/20 transition-all"
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute inset-y-0 right-0 flex items-center pr-5 text-[#94A3B8] hover:text-[#1A1C1E] transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* BOTÃO ENTRAR */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00509d] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#00509d]/30 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center mt-2 uppercase tracking-wider text-sm"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Acessar Sistema'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}