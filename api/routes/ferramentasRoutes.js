const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Certifique-se que o caminho para o seu arquivo de conexão (mysql) está certo
const authMiddleware = require('../middlewares/auth'); // Para proteger a rota
const movController = require('../controllers/movController');

// Rotas de repasse com aceite
router.get('/repasses/pendentes', authMiddleware, movController.getRepassesPendentes);
router.post('/repasses/responder', authMiddleware, movController.responderRepasse);

// Rota para buscar o histórico de uma ferramenta
router.get('/historico/:codigo', authMiddleware, async (req, res) => {
    const { codigo } = req.params;

    try {
        // Primeiro, busca os detalhes da ferramenta
        const [ferramentaRows] = await db.query(
            'SELECT codigo, descricao FROM ferramentas WHERE codigo = ?',
            [codigo]
        );

        if (ferramentaRows.length === 0) {
            return res.status(404).json({ success: false, message: "Ferramenta não encontrada." });
        }

        const ferramenta = ferramentaRows[0];

        // Busca todas as movimentações para esta ferramenta, incluindo dados de colaborador e almoxarife
        const [historicoRows] = await db.query(
            `SELECT 
                m.id,
                m.data_retirada,
                m.data_devolucao,
                m.status,
                m.condicao_devolucao,
                m.observacao,
                c.nome AS colaborador,
                u_saida.nome AS almoxarife_saida,
                u_entrada.nome AS almoxarife_entrada
            FROM movimentacoes m
            LEFT JOIN colaboradores c ON m.colaborador_cracha = c.cracha
            LEFT JOIN usuarios u_saida ON m.almoxarife_retirada_id = u_saida.id
            LEFT JOIN usuarios u_entrada ON m.almoxarife_devolucao_id = u_entrada.id
            WHERE m.ferramenta_codigo = ?
            ORDER BY m.data_retirada DESC`,
            [codigo]
        );

        res.json({
            success: true,
            ferramenta: ferramenta,
            historico: historicoRows
        });

    } catch (err) {
        console.error("Erro ao buscar histórico da ferramenta:", err);
        res.status(500).json({ success: false, message: "Erro interno no servidor ao buscar histórico." });
    }
});

module.exports = router;