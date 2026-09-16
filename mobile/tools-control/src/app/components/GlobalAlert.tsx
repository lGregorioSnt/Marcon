"use client";

import { useEffect } from 'react';
import Swal from 'sweetalert2';

export default function GlobalAlert() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Intercepta e substitui o alert() padrão do navegador
      window.alert = (message) => {
        let icon: 'success' | 'error' | 'warning' | 'info' = 'info';
        let title = 'Aviso';

        const lowerMsg = String(message).toLowerCase();
        
        if (lowerMsg.includes('sucesso')) {
          icon = 'success';
          title = 'Tudo certo!';
        } else if (lowerMsg.includes('erro') || lowerMsg.includes('falha') || lowerMsg.includes('corrompida')) {
          icon = 'error';
          title = 'Ops, algo deu errado';
        } else if (lowerMsg.includes('por favor') || lowerMsg.includes('selecione') || lowerMsg.includes('atenção')) {
          icon = 'warning';
          title = 'Atenção';
        }

        Swal.fire({
          title: title,
          text: String(message),
          icon: icon,
          confirmButtonColor: '#00509d',
          confirmButtonText: 'Entendi',
          background: '#ffffff',
          color: '#1A1C1E',
        });
      };
    }
  }, []);

  return null;
}