"use client";

import React, { useState, useEffect, useMemo } from "react";
import { apiGet, apiPost } from "@/services/api";
import { 
  Search, Plus, X, Monitor, AlertCircle, Clock, CheckCircle2, HeadphonesIcon 
} from "lucide-react";

interface Ticket {
  id: number;
  assunto: string;
  descricao: string;
  categoria: string;
  ferramentas: string;
  prioridade: string;
  status: string;
  data_criacao: string;
  ativo_id?: string;
}

export default function SupportPage() {
  // 📦 STATES
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  // 🎛️ MODAL STATES
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormData = { ativo_id: '', assunto: '', descricao: '', ferramentas: '', prioridade: 'media', categoria: 'Mecânica' };
  const [formData, setFormData] = useState(initialFormData);

  // 🚀 INIT
  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/suporte');
      if (Array.isArray(data)) setTickets(data);
    } catch (e) {
      console.error("Erro ao carregar suporte:", e);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 FILTERS
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];
    if (!showResolved) {
      filtered = filtered.filter(t => !['resolvido', 'cancelado'].includes((t.status || '').toLowerCase()));
    }
    if (search.trim() !== "") {
      filtered = filtered.filter(t => 
        t.assunto.toLowerCase().includes(search.toLowerCase()) || 
        t.id.toString().includes(search)
      );
    }
    filtered.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime());
    return filtered;
  }, [tickets, search, showResolved]);

  // 📝 HANDLERS
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiPost('/suporte', formData);
      alert("Relato enviado com sucesso!");
      setIsCreateModalOpen(false);
      setFormData(initialFormData);
      loadTickets();
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar relato.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket) return;
    try {
      await apiPost(`/suporte/${selectedTicket.id}/status`, { status: 'Resolvido' });
      alert("Chamado marcado como resolvido!");
      setIsViewModalOpen(false);
      loadTickets();
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar chamado.");
    }
  };

  // 🎨 STYLES HELPERS
  const getStatusStyle = (status: string) => {
    switch((status || '').toLowerCase()) {
      case 'resolvido': return 'bg-[#DCFCE7] text-[#16A34A] border-[#bbf7d0]';
      case 'em andamento': return 'bg-[#DBEAFE] text-[#2563EB] border-[#bfdbfe]';
      case 'cancelado': return 'bg-[#FEE2E2] text-[#DC2626] border-[#fecaca]';
      default: return 'bg-[#FFFBEB] text-[#D97706] border-[#fef3c7]';
    }
  };

  const getPriorityIcon = (prio: string) => {
    switch((prio || '').toLowerCase()) {
      case 'alta': return <AlertCircle size={14} className="text-[#DC2626]" />;
      case 'média':
      case 'media': return <Clock size={14} className="text-[#D97706]" />;
      default: return <CheckCircle2 size={14} className="text-[#16A34A]" />;
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[#FAFAFA] pb-32">
      
      {/* HEADER */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#1A1C1E] tracking-tight flex items-center gap-2">
            Central de <span className="text-[#00509d]">Suporte</span>
          </h1>
          <p className="text-sm text-[#64748B] font-medium mt-1">
            Relatos e manutenção
          </p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#E2E8F0]">
          <HeadphonesIcon className="text-[#00509d]" size={24} />
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3 shadow-sm">
          <Search size={18} className="text-[#94A3B8] mr-2" />
          <input 
            type="text" 
            placeholder="Buscar chamado..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#94A3B8]"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#00509d] text-white text-sm font-extrabold px-4 py-2.5 rounded-xl shadow-md shadow-[#00509d]/30 flex items-center gap-2 active:scale-95 transition-transform"
        >
          <Plus size={18} strokeWidth={3} /> Abrir Chamado
        </button>

        <button 
          onClick={() => setShowResolved(!showResolved)}
          className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-colors ${showResolved ? 'bg-[#00509d]/10 text-[#00509d]' : 'bg-white border border-[#E2E8F0] text-[#64748B]'}`}
        >
          {showResolved ? 'Ocultar Resolvidos' : 'Ver Resolvidos'}
        </button>
      </div>

      {/* TICKETS LIST */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pb-4">
        {filteredTickets.map(ticket => (
          <div 
            key={ticket.id} 
            onClick={() => { setSelectedTicket(ticket); setIsViewModalOpen(true); }}
            className="bg-white rounded-3xl p-5 border border-[#E2E8F0] shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[10px] border font-extrabold px-2 py-1 rounded-md uppercase tracking-wide ${getStatusStyle(ticket.status)}`}>
                {ticket.status || 'Pendente'}
              </span>
              <span className="text-xs text-[#94A3B8] font-bold">
                {new Date(ticket.data_criacao).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <h3 className="font-black text-[#1A1C1E] text-lg leading-tight mb-1">{ticket.assunto}</h3>
            <p className="text-xs font-medium text-[#64748B] line-clamp-2 mb-4 leading-relaxed">{ticket.descricao}</p>
            
            <div className="flex items-center justify-between pt-3 border-t border-dashed border-[#E2E8F0]">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
                  <Monitor size={14} className="text-[#94A3B8]" /> {ticket.ativo_id || 'Geral'}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] capitalize">
                  {getPriorityIcon(ticket.prioridade)} {ticket.prioridade}
                </div>
              </div>
              <span className="text-[#00509d] text-xs font-bold">Ver &rarr;</span>
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 MUDANÇA AQUI: z-[100] para sobrepor o menu inferior e pb-24 para scroll livre */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-[#1A1C1E]/60 backdrop-blur-sm flex flex-col justify-end z-[100]">
          <div className="bg-white w-full rounded-t-[2rem] p-6 max-h-[90vh] overflow-y-auto pb-24 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-[#1A1C1E]">Novo Relato</h2>
               <button onClick={() => setIsCreateModalOpen(false)} className="p-2 bg-[#F1F5F9] rounded-full text-[#64748B]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#94A3B8] uppercase ml-1">Equipamento (Opcional)</label>
                <input type="text" name="ativo_id" value={formData.ativo_id} onChange={handleFormChange} placeholder="Ex: MAQ-10" className="w-full mt-1 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl font-semibold text-[#1A1C1E] outline-none focus:border-[#00509d]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#94A3B8] uppercase ml-1">Resumo do Problema *</label>
                <input type="text" name="assunto" value={formData.assunto} onChange={handleFormChange} required placeholder="Qual é o defeito?" className="w-full mt-1 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl font-semibold text-[#1A1C1E] outline-none focus:border-[#00509d]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#94A3B8] uppercase ml-1">Descrição *</label>
                <textarea name="descricao" value={formData.descricao} onChange={handleFormChange} required rows={3} placeholder="Detalhes do que aconteceu..." className="w-full mt-1 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl font-semibold text-[#1A1C1E] outline-none focus:border-[#00509d] resize-none" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-[#94A3B8] uppercase ml-1">Prioridade</label>
                  <select name="prioridade" value={formData.prioridade} onChange={handleFormChange} className="w-full mt-1 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl font-semibold text-[#1A1C1E] outline-none appearance-none">
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-[#94A3B8] uppercase ml-1">Categoria</label>
                  <select name="categoria" value={formData.categoria} onChange={handleFormChange} className="w-full mt-1 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl font-semibold text-[#1A1C1E] outline-none appearance-none">
                    <option value="Mecânica">Mecânica</option>
                    <option value="Elétrica">Elétrica</option>
                    <option value="Software">Software</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="mt-6 w-full bg-[#00509d] text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-[#00509d]/30 active:scale-95 transition-transform">
                {isSubmitting ? 'Enviando...' : 'Enviar Relato'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🔥 MUDANÇA AQUI: z-[100] e pb-24 também no modal de Visualizar */}
      {isViewModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-[#1A1C1E]/60 backdrop-blur-sm flex flex-col justify-end z-[100]">
          <div className="bg-white w-full rounded-t-[2rem] p-6 max-h-[90vh] overflow-y-auto pb-24 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-start mb-6">
               <div>
                 <h2 className="text-xl font-black text-[#1A1C1E] leading-tight pr-4">Relato #{selectedTicket.id}</h2>
                 <span className={`inline-block mt-2 text-[10px] border font-extrabold px-2 py-1 rounded-md uppercase tracking-wide ${getStatusStyle(selectedTicket.status)}`}>{selectedTicket.status || 'Pendente'}</span>
               </div>
               <button onClick={() => setIsViewModalOpen(false)} className="p-2 bg-[#F1F5F9] rounded-full text-[#64748B] shrink-0"><X size={20} /></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-[#94A3B8] uppercase">Problema / Assunto</p>
                <p className="font-extrabold text-[#1A1C1E] text-lg mt-0.5">{selectedTicket.assunto}</p>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl">
                <p className="text-sm font-medium text-[#475569] leading-relaxed">{selectedTicket.descricao}</p>
              </div>
              <div className="flex flex-wrap gap-4 border-t border-dashed border-[#E2E8F0] pt-4">
                <div className="bg-[#F1F5F9] px-3 py-2 rounded-xl text-xs font-bold text-[#64748B] flex items-center gap-1.5"><Monitor size={14}/> {selectedTicket.ativo_id || 'Não informado'}</div>
                <div className="bg-[#F1F5F9] px-3 py-2 rounded-xl text-xs font-bold text-[#64748B] flex items-center gap-1.5 capitalize">{getPriorityIcon(selectedTicket.prioridade)} {selectedTicket.prioridade}</div>
                <div className="bg-[#F1F5F9] px-3 py-2 rounded-xl text-xs font-bold text-[#64748B] flex items-center gap-1.5">📂 {selectedTicket.categoria}</div>
              </div>
            </div>

            {!(selectedTicket.status || '').toLowerCase().includes('resolvido') && (
               <button onClick={handleResolve} className="mt-8 w-full bg-[#16A34A] text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                 <CheckCircle2 size={20} /> Marcar como Resolvido
               </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}