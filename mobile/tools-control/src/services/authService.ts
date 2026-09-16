import { apiPost } from "./api";

export const authService = {
  login: (cracha: string, senha: string) =>
    apiPost("/login", { cracha, senha }),
};