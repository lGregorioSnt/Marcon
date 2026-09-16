"use client";

import React from "react";
import { Bell, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

const notifications = [
  {
    type: "critical",
    title: "Ferramenta em atraso",
    message: "Parafusadeira está há 2 dias sem devolução",
    time: "Agora",
  },
  {
    type: "warning",
    title: "Prazo próximo do vencimento",
    message: "Chave de impacto deve ser devolvida hoje",
    time: "2h atrás",
  },
  {
    type: "info",
    title: "Nova movimentação",
    message: "Serra elétrica foi repassada para outro usuário",
    time: "Ontem",
  },
];

function getNotificationIconAndColor(type: string) {
  switch (type) {
    case "critical":
      return { icon: <AlertTriangle size={24} />, iconBg: "bg-[#DC2626]/10", iconText: "text-[#DC2626]" };
    case "warning":
      return { icon: <AlertTriangle size={24} />, iconBg: "bg-[#F59E0B]/10", iconText: "text-[#F59E0B]" };
    case "info":
      return { icon: <Info size={24} />, iconBg: "bg-[#3B82F6]/10", iconText: "text-[#3B82F6]" };
    default:
      return { icon: <Bell size={24} />, iconBg: "bg-gray-200", iconText: "text-gray-600" };
  }
}

function getNotificationStatusClasses(type: string) {
  switch (type) {
    case "critical":
      return "bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]";
    case "warning":
      return "bg-[#FFFBEB] text-[#F59E0B] border-[#FEF3C7]";
    case "info":
      return "bg-[#EFF6FF] text-[#3B82F6] border-[#DBEAFE]";
    default:
      return "bg-gray-100 text-gray-500 border-gray-300";
  }
}

export default function NotificationsPage() {
  return (
    <div className="min-h-screen p-6 bg-[#FAFAFA] pb-24">
      
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#1A1C1E] tracking-tight flex items-center gap-2">
            Suas <span className="text-[#00509d]">Notificações</span>
          </h1>
          <p className="text-sm text-[#64748B] font-medium mt-1">
            Alertas e avisos do sistema
          </p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#E2E8F0]">
          <Bell className="text-[#00509d]" size={24} />
        </div>
      </div>

      {/* EMPTY STATE */}
      {notifications.length === 0 && (
        <div className="bg-white border border-dashed border-[#CBD5E1] rounded-3xl p-8 text-center mt-10">
          <CheckCircle2 size={40} className="mx-auto text-[#CBD5E1] mb-3" />
          <p className="text-[#64748B] font-semibold">Nenhuma notificação nova por aqui!</p>
        </div>
      )}

      {/* LISTA */}
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
        {notifications.map((item, index) => (
          <div key={index} className="bg-white rounded-3xl p-5 border border-[#E2E8F0] shadow-sm">
            <div className="flex items-start gap-4 mb-3">
              <div className={`${getNotificationIconAndColor(item.type).iconBg} ${getNotificationIconAndColor(item.type).iconText} w-12 h-12 rounded-2xl flex items-center justify-center shrink-0`}>
                {getNotificationIconAndColor(item.type).icon}
              </div>
              <div>
                <p className="font-extrabold text-[#1A1C1E] text-[1.1rem] leading-tight">
                  {item.title}
                </p>
                <p className="text-xs text-[#64748B] font-medium mt-0.5">
                  {item.message}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 border-t border-dashed border-[#E2E8F0] pt-3">
              <span className={`text-[10px] font-extrabold px-2 py-1 rounded-md border uppercase tracking-wide ${getNotificationStatusClasses(item.type)}`}>
                {item.type}
              </span>
              <span className="text-xs text-[#94A3B8] font-bold">
                {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}