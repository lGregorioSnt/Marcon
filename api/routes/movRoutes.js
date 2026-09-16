const express = require("express");
const router = express.Router();

const movController = require("../controllers/movController");
const dashboardController = require("../controllers/dashboardController");
const aiController = require("../controllers/aiController");
const authMiddleware = require("../middlewares/auth");

// =========================
// 🔐 PROTEÇÃO GLOBAL
// =========================
// Tudo abaixo exige token válido
router.use(authMiddleware);

// =========================
// 📊 DASHBOARD & IA
// =========================
router.get("/dashboard", dashboardController.getDashboard);
router.get("/ai/dashboard-insights", aiController.getDashboardInsights);

// =========================
// 🧰 FERRAMENTAS (CRUD & BUSCA)
// =========================
router.get("/ferramentas", movController.getFerramentas);
router.post("/ferramentas", movController.registrarNovaFerramenta);
router.get("/ferramentas/resumo", movController.getResumoFerramentas);
router.get("/ferramentas/unidades", movController.getUnidadesPorDescricao);
router.get("/ferramentas/alertas", movController.getAlertasEstoque);
router.get("/ferramentas/:codigo", movController.getFerramentaByCodigo);
router.get("/ferramentas/:codigo/historico", movController.getHistoricoPorFerramenta);

// =========================
// 🔁 MOVIMENTAÇÕES (ENTREGA, DEVOLUÇÃO E REPASSE)
// =========================
router.post("/movimentacoes/entrega", movController.registrarEntrega);
router.post("/movimentacoes/devolucao", movController.registrarDevolucao);

// Rotas de Repasse (Integradas do Mobile)
router.post("/ferramentas/repasses", movController.registrarRepasse); 
router.post("/movimentacoes/repasse", movController.registrarRepasse);

// 🔥 Lembrete do Fabio: Adicionei as rotas de responder repasse que arrumamos antes, 
// caso elas tenham ficado de fora desse seu commit!
router.post('/ferramentas/repasses/responder', movController.responderRepasse);
router.get('/ferramentas/repasses/pendentes', movController.getRepassesPendentes);

// =========================
// 📜 AUDITORIA E HISTÓRICO
// =========================
router.get("/movimentacoes/recentes", movController.getMovimentacoesRecentes);
router.get("/movimentacoes/pendencias", movController.getPendencias);
router.get("/movimentacoes/auditoria", movController.getAuditoriaCompleta);

// Consultas específicas do App Mobile
router.get("/movimentacoes/historico/:cracha", movController.getHistoricoPorUsuario);
router.get("/movimentacoes/em-uso/:cracha", movController.getFerramentasEmUsoPorUsuario);

// =========================
// 🤝 AUXILIARES E MANUTENÇÃO
// =========================
router.get("/colaboradores", movController.getColaboradores);
router.get("/manutencao-externa", movController.getManutencaoExterna);

module.exports = router;