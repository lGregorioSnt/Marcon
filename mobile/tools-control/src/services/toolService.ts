import { apiGet, apiPost } from "./api";

export const toolService = {
  getAll: () => apiGet("/api/ferramentas"),

  getByCode: (codigo: string) =>
    apiGet(`/api/ferramenta/${codigo}`),

  create: (data: any) =>
    apiPost("/api/ferramenta", data),
};