import { apiGet } from "./api";

export const userToolService = {
  getMyTools: async (cracha: string) => {
    return apiGet(`/movimentacoes/em-uso/${cracha}`);
  },

  getColaboradores: async () => {
    return apiGet('/colaboradores');
  }
};