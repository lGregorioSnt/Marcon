import { apiGet } from "./api";

export const alertService = {
  getStockAlerts: () =>
    apiGet("/api/alertas/estoque"),

  getMaintenance: () =>
    apiGet("/api/manutencao"),
};