"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/services/authStorage";
import { movementService } from "@/services/movementService";
import { ScrollText, Clock, Check, RefreshCw, Wrench, HelpCircle } from "lucide-react";

// Define a type for the history item for better type safety
interface HistoryItem {
  id: number;
  descricao: string;
  ferramenta_codigo: string;
  data_retirada: string;
  data_devolucao?: string; // Optional, as it might not exist yet
  status: string;
  condicao_devolucao?: string; // Added this field
}

export default function HistoricoPage() {
  // 📦 STATES
  const [data, setData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 👤 USER (needed for cracha)
  const [userCracha, setUserCracha] = useState<string | null>(null);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      // Using toLocaleString for better internationalization and readability
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error("Erro ao formatar data:", dateString, e);
      return dateString; // Fallback to original string if formatting fails
    }
  };

  // Helper function to map status to readable string
  const mapStatus = (status: string) => {
    switch (status) {
      case 'EM_USO':
        return 'Em Uso';
      case 'DEVOLVIDO':
        return 'Devolvido';
      case 'ENVIADO_MANUTENCAO':
        return 'Em Manutenção';
      default:
        return status;
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DEVOLVIDO':
        return <Check className="w-6 h-6" strokeWidth={3} />;
      case 'EM_USO':
        return <RefreshCw className="w-6 h-6" />;
      case 'ENVIADO_MANUTENCAO':
        return <Wrench className="w-6 h-6" />;
      default:
        return <HelpCircle className="w-6 h-6" />;
    }
  };

  // Helper function to get status color class
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'DEVOLVIDO':
        return 'text-[#16A34A]'; // Green
      case 'EM_USO':
        return 'text-[#F59E0B]'; // Orange
      case 'ENVIADO_MANUTENCAO':
        return 'text-[#DC2626]'; // Red
      default:
        return 'text-[#64748B]'; // Gray
    }
  };

  // 🚀 INIT
  useEffect(() => {
    const userData = getUser();

    if (!userData) {
      console.warn("Usuário não autenticado. Redirecionando ou mostrando mensagem.");
      setLoading(false);
      // router.push("/login"); // Uncomment if router is used for redirection
      return;
    }

    const crachaDoUsuario = userData.cracha || userData.user?.cracha;
    if (!crachaDoUsuario) {
      console.error("Crachá não encontrado no objeto do usuário:", userData);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      // router.push("/login");
      setLoading(false);
      return;
    }

    setUserCracha(crachaDoUsuario);
    loadHistory(crachaDoUsuario); // Pass cracha directly

  }, []); // Empty dependency array for initial load

  // Move loadHistory outside useEffect or make it a useCallback
  const loadHistory = async (cracha: string) => {
    try {
      setLoading(true);
      const res = await movementService.getHistory(cracha);
      setData(res);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      // Optionally show an alert to the user
      // alert("Erro ao carregar histórico de ferramentas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[#FAFAFA] pb-24">

      {/* HEADER */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#1A1C1E] tracking-tight flex items-center gap-2">
            Histórico de <span className="text-[#00509d]">Ferramentas</span>
          </h1>
          <p className="text-sm text-[#64748B] font-medium mt-1">
            Suas movimentações passadas
          </p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#E2E8F0]">
          <ScrollText className="w-6 h-6 text-[#00509d]" />
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center py-10">
          <p className="text-sm font-bold text-[#94A3B8] animate-pulse">Carregando histórico...</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && data.length === 0 && (
        <div className="bg-white border border-dashed border-[#CBD5E1] rounded-3xl p-8 text-center mt-10">
          <Clock className="w-16 h-16 mx-auto mb-3 text-[#CBD5E1]" strokeWidth={1.5} />
          <p className="text-[#64748B] font-semibold">Nenhuma movimentação encontrada para o seu crachá.</p>
        </div>
      )}

      {/* LISTA DE HISTÓRICO */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {data.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-5 border border-[#E2E8F0] shadow-sm"
          >
            <div className="flex items-start gap-4 mb-3">
              <div className="bg-[#00509d]/10 text-[#00509d] w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0">
                {getStatusIcon(item.status)}
              </div>
              <div>
                <p className="font-extrabold text-[#1A1C1E] text-[1.1rem] leading-tight">
                  {item.descricao}
                </p>
                <p className="text-xs text-[#64748B] font-medium mt-0.5">
                  Código: <span className="font-bold text-[#1A1C1E]">{item.ferramenta_codigo}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs text-[#64748B] font-medium border-t border-dashed border-[#E2E8F0] pt-3 mt-3">
              <p>
                Retirada: <span className="font-bold text-[#1A1C1E]">{formatDate(item.data_retirada)}</span>
              </p>
              {item.data_devolucao && (
                <p>
                  Devolução: <span className="font-bold text-[#1A1C1E]">{formatDate(item.data_devolucao)}</span>
                </p>
              )}
              <p>
                Status: <span className={`font-bold ${getStatusColorClass(item.status)}`}>{mapStatus(item.status)}</span>
              </p>
              {item.condicao_devolucao && (
                <p>
                  Condição: <span className="font-bold text-[#1A1C1E]">{item.condicao_devolucao}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}