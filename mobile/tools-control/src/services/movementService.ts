import { apiPost, apiGet } from "./api";

export const movementService = {
  transfer: async (data: {
    movimentacao_id: number;
    novo_colaborador_cracha: string;
    condicao: string;
  }) => {
    return apiPost("/ferramentas/repasses", data);
  },

  async getHistory(cracha: string) {
    return apiGet(`/movimentacoes/historico/${cracha}`);
  },
};