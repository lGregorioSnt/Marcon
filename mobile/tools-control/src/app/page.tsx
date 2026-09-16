"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/services/authStorage";
import { userToolService } from "@/services/userToolService";
import { apiGet, apiPost } from "@/services/api";
import { Wrench, Inbox, AlertTriangle, Check, Send, RefreshCw } from "lucide-react";

export default function Home() {
  const router = useRouter();

  // 👤 USER
  const [user, setUser] = useState<any>(null);

  // 📦 STATES
  const [tools, setTools] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [isRepasseModalOpen, setIsRepasseModalOpen] = useState(false);
  const [oficinaSelecionada, setOficinaSelecionada] = useState("Todas");
  const [novoCracha, setNovoCracha] = useState("");
  const [condicao, setCondicao] = useState("PERFEITO ESTADO");

  // 🚀 INIT
  useEffect(() => {
    const userData = getUser();

    if (!userData) {
      router.push("/login");
      return;
    }

    const crachaDoUsuario = userData.cracha || userData.user?.cracha;

    if (!crachaDoUsuario) {
      console.error("Crachá não encontrado no objeto:", userData);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    setUser(userData.user || userData); 
    loadTools(crachaDoUsuario); 
    loadColaboradores(); 
    loadPendingTransfers();
  }, []);

  // 🔄 LOAD TOOLS
  async function loadTools(cracha: string) {
    try {
      setLoading(true);
      const data = await userToolService.getMyTools(cracha);
      setTools(data);
    } catch (err) {
      console.error("Erro ao buscar ferramentas:", err);
      setTools([]);
    } finally {
      setLoading(false);
    }
  }

  // 🔄 LOAD COLABORADORES
  async function loadColaboradores() {
    try {
      const data = await userToolService.getColaboradores();
      setColaboradores(data);
    } catch (err) {
      console.error("Erro ao buscar colaboradores:", err);
    }
  }

  // 🔄 LOAD PENDING TRANSFERS
  async function loadPendingTransfers() {
    try {
      const data = await apiGet("/ferramentas/repasses/pendentes");
      setPendingTransfers(data);
    } catch (err) {
      console.warn("Nenhum repasse pendente ou erro na rota.", err);
    }
  }

  // 🔍 FILTROS PARA MODAL
  const toggleSelection = (id: number, pendente: boolean) => {
    if (pendente) return;
    setSelecionadas(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const oficinasDisponiveis = useMemo(() => {
    const setOficinas = new Set(colaboradores.map(c => c.oficina || "Geral"));
    return ["Todas", ...Array.from(setOficinas)];
  }, [colaboradores]);

  const colaboradoresFiltrados = useMemo(() => {
    return colaboradores.filter(c => 
      c.cracha !== user?.cracha &&
      (oficinaSelecionada === "Todas" || (c.oficina || "Geral") === oficinaSelecionada)
    );
  }, [colaboradores, oficinaSelecionada, user]);

  // 🔄 REPASSE
  async function handleTransfer() {
    if (selecionadas.length === 0 || !novoCracha) return;

    try {
      setActionLoading(true);

      await apiPost("/movimentacoes/repasse", {
        movimentacoes: selecionadas,
        novo_colaborador_cracha: novoCracha,
        condicao: condicao,
      });
      
      alert("Ferramentas repassadas com sucesso!");

      await loadTools(user.cracha);

      // limpar
      setSelecionadas([]);
      setIsRepasseModalOpen(false);
      setNovoCracha("");
      setCondicao("PERFEITO ESTADO");

    } catch (err) {
      console.error("Erro no repasse:", err);
      alert("Erro ao transferir as ferramentas.");
    } finally {
      setActionLoading(false);
    }
  }

  // 🔄 RESPONDER REPASSE
  async function handleRespondTransfer(id: number, aceitar: boolean) {
    try {
      await apiPost("/ferramentas/repasses/responder", { transferencia_id: id, aceitar });
      await loadTools(user.cracha);
      await loadPendingTransfers();
    } catch (err) {
      console.error("Erro ao responder repasse:", err);
      alert("Erro ao responder repasse.");
    }
  }

  return (
    <div className="min-h-screen p-6 bg-[#FAFAFA] pb-24">

      {/* HEADER */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#1A1C1E] tracking-tight flex items-center gap-2">
            Minhas <span className="text-[#00509d]">Ferramentas</span>
          </h1>
          <p className="text-sm text-[#64748B] font-medium mt-1">
            {user ? (
              <>Olá, <span className="font-bold text-[#1A1C1E]">{user.nome}</span></>
            ) : (
              "Carregando usuário..."
            )}
          </p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#E2E8F0]">
          <Wrench className="w-6 h-6 text-[#00509d]" />
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center py-10">
          <p className="text-sm font-bold text-[#94A3B8] animate-pulse">Carregando inventário...</p>
        </div>
      )}

      {/* EMPTY */}
      {!loading && tools.length === 0 && (
        <div className="bg-white border border-dashed border-[#CBD5E1] rounded-3xl p-8 text-center mt-10">
          <Inbox className="w-16 h-16 mx-auto mb-3 text-[#CBD5E1]" strokeWidth={1.5} />
          <p className="text-[#64748B] font-semibold">Nenhuma ferramenta em uso no momento.</p>
        </div>
      )}

      {/* REPASSES PENDENTES */}
      {pendingTransfers.length > 0 && (
        <div className="mb-8 flex flex-col gap-3 bg-[#FFF1F2] border border-[#FECACA] rounded-3xl p-5 shadow-sm shadow-red-500/5">
          <h2 className="text-lg font-black text-[#B91C1C] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Aguardando seu aceite
          </h2>
          {pendingTransfers.map((tp) => (
            <div key={tp.transferencia_id} className="bg-white border border-[#FEE2E2] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                 <div>
                   <p className="font-extrabold text-[1.05rem] text-[#1A1C1E]">{tp.ferramenta}</p>
                   <p className="text-xs text-[#64748B] font-medium mt-0.5">
                     <span className="text-[#00509d] font-bold">{tp.de_nome}</span> quer te repassar
                   </p>
                 </div>
                 <span className="bg-[#FEF2F2] text-[#DC2626] text-[10px] font-bold px-2 py-1 rounded-lg">
                   {tp.condicao}
                 </span>
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => handleRespondTransfer(tp.transferencia_id, true)}
                  className="bg-[#16A34A] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex-1 shadow-md shadow-green-600/20 active:scale-95 transition-transform"
                >
                  Aceitar
                </button>
                <button
                  onClick={() => handleRespondTransfer(tp.transferencia_id, false)}
                  className="bg-[#DC2626] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex-1 shadow-md shadow-red-600/20 active:scale-95 transition-transform"
                >
                  Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LISTA DE FERRAMENTAS */}
      <div className="space-y-4">
        {tools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => toggleSelection(tool.id, tool.repasse_pendente)}
            className={`bg-white rounded-3xl p-5 border shadow-sm cursor-pointer transition-all ${
              tool.repasse_pendente ? 'opacity-60 border-[#E2E8F0] bg-gray-50' : 
              selecionadas.includes(tool.id) ? 'border-[#00509d] shadow-[#00509d]/10 scale-[0.98]' : 'border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${selecionadas.includes(tool.id) ? 'bg-[#00509d] text-white' : 'bg-[#00509d]/10 text-[#00509d]'}`}>
                 {selecionadas.includes(tool.id) ? <Check className="w-6 h-6" strokeWidth={3} /> : <Wrench className="w-6 h-6" />}
               </div>
               <div className="flex-1">
                 <p className="font-extrabold text-[#1A1C1E] text-[1.1rem] leading-tight">
                   {tool.descricao}
                 </p>
                 <div className="flex items-center gap-2 mt-1">
                   <span className="text-[10px] font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                     {tool.ferramenta_codigo}
                   </span>
                   <span className="text-[10px] font-semibold text-[#94A3B8]">
                     {tool.data_retirada}
                   </span>
                 </div>
               </div>
            </div>

            <div className="flex justify-between items-center mt-4 border-t border-dashed border-[#E2E8F0] pt-4">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${tool.repasse_pendente ? 'bg-[#F59E0B]' : 'bg-[#16A34A] animate-pulse'}`}></div>
                 <span className="text-xs font-bold text-[#64748B]">
                   {tool.repasse_pendente ? "Aguardando aceite..." : "Em uso"}
                 </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTÃO FLUTUANTE DE REPASSE EM MASSA */}
      {selecionadas.length > 0 && (
        <button 
          onClick={() => setIsRepasseModalOpen(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#00509d] text-white px-6 h-14 rounded-full flex items-center justify-center gap-2 shadow-xl shadow-[#00509d]/40 active:scale-95 transition-all z-[90] w-[80%] max-w-sm animate-in slide-in-from-bottom-5"
        >
          <Send className="w-5 h-5" />
          <span className="font-extrabold text-sm tracking-wide">
            Repassar {selecionadas.length} Ferramenta{selecionadas.length > 1 ? 's' : ''}
          </span>
        </button>
      )}

      {/* MODAL DE REPASSE */}
      {isRepasseModalOpen && (
        <div className="fixed inset-0 bg-[#1A1C1E]/70 backdrop-blur-md flex justify-center items-end z-[100] p-4 pb-20"> 
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-10 duration-300"> 

            <div className="w-12 h-1.5 bg-[#E2E8F0] rounded-full mx-auto mb-6"></div>

            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#00509d]/10 w-14 h-14 rounded-2xl flex items-center justify-center text-[#00509d] shadow-inner">
                <RefreshCw className="w-7 h-7" />
              </div>
              <h2 className="font-black text-2xl text-[#1A1C1E] leading-tight">
                Repassar<br/>Ferramentas
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-xs font-extrabold text-[#94A3B8] mb-2 uppercase tracking-wider">Itens Selecionados</p>
              <p className="bg-[#F8FAFC] border-2 border-[#E2E8F0] p-4 rounded-2xl font-extrabold text-[#1A1C1E]">
                 {selecionadas.length} ferramenta(s)
              </p>
            </div>

            {/* FILTRO DE OFICINA */}
            <div className="mb-5">
              <p className="text-xs font-extrabold text-[#94A3B8] mb-2 uppercase tracking-wider">1. Filtrar por Oficina (Opcional)</p>
              <div className="relative">
                <select
                  value={oficinaSelecionada}
                  onChange={(e) => { setOficinaSelecionada(e.target.value); setNovoCracha(""); }}
                  className="w-full border-2 border-[#E2E8F0] bg-[#F8FAFC] p-4 rounded-2xl font-bold text-[#1A1C1E] outline-none focus:border-[#00509d] focus:bg-white focus:ring-4 focus:ring-[#00509d]/10 transition-all appearance-none cursor-pointer"
                >
                  {oficinasDisponiveis.map(o => (<option key={o} value={o}>{o}</option>))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]">
                  ▼
                </div>
              </div>
            </div>

            {/* DROPDOWN DE COLABORADORES */}
            <div className="mb-5">
              <p className="text-xs font-extrabold text-[#94A3B8] mb-2 uppercase tracking-wider">2. Para quem? *</p>
              <div className="relative">
                <select
                  value={novoCracha}
                  onChange={(e) => setNovoCracha(e.target.value)}
                  className="w-full border-2 border-[#E2E8F0] bg-[#F8FAFC] p-4 rounded-2xl font-bold text-[#1A1C1E] outline-none focus:border-[#00509d] focus:bg-white focus:ring-4 focus:ring-[#00509d]/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecione um colaborador</option>
                  {colaboradoresFiltrados.map((colab) => (
                    <option key={colab.cracha} value={colab.cracha}>
                      {colab.nome} ({colab.oficina || 'Geral'})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]">
                  ▼
                </div>
              </div>
            </div>

            {/* CONDIÇÃO */}
            <div className="mb-8">
              <p className="text-xs font-extrabold text-[#94A3B8] mb-2 uppercase tracking-wider">Condição do(s) item(ns)</p>
              <div className="relative">
                <select
                  value={condicao}
                  onChange={(e) => setCondicao(e.target.value)}
                  className="w-full border-2 border-[#E2E8F0] bg-[#F8FAFC] p-4 rounded-2xl font-bold text-[#1A1C1E] outline-none focus:border-[#00509d] focus:bg-white focus:ring-4 focus:ring-[#00509d]/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="PERFEITO ESTADO">Perfeito estado</option>
                  <option value="USADO">Usado</option>
                  <option value="DANIFICADO">Danificado</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]">
                  ▼
                </div>
              </div>
            </div>

            {/* BOTÕES */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsRepasseModalOpen(false)}
                className="flex-1 bg-[#F8FAFC] border-2 border-[#E2E8F0] text-[#64748B] font-extrabold py-4 rounded-2xl hover:bg-[#E2E8F0] transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={handleTransfer}
                disabled={!novoCracha || actionLoading}
                className="flex-1 bg-[#00509d] disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-[#00509d]/30 active:scale-95 transition-all"
              >
                {actionLoading ? "..." : "Confirmar"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}