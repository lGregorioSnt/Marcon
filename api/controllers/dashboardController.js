const db = require('../config/db');

exports.getDashboard = async (req, res) => {
  try {
    // =========================
    // ESTOQUE
    // =========================
    const [estoqueResult] = await db.query(`
      SELECT 
        COALESCE(SUM(estoque_disponivel), 0) AS disponivel,
        COALESCE(SUM(em_manutencao), 0) AS manutencao
      FROM ferramentas
    `);

    // =========================
    // STATUS MOVIMENTAÇÕES
    // =========================
    const [statusResult] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'EM_USO' THEN 1 ELSE 0 END), 0) AS em_uso,
        COALESCE(SUM(CASE WHEN status = 'DEVOLVIDO' THEN 1 ELSE 0 END), 0) AS devolvido,
        COUNT(*) AS total_movimentacoes
      FROM movimentacoes
    `);

    // =========================
    // TIMELINE (7 DIAS)
    // =========================
    const [timeline] = await db.query(`
      SELECT 
        DATE(data_retirada) AS dia,
        COUNT(*) AS total
      FROM movimentacoes
      WHERE data_retirada >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(data_retirada)
      ORDER BY dia ASC
    `);

    // =========================
    // ALERTAS CRÍTICOS
    // =========================
    const [alertasCriticosResult] = await db.query(`
      SELECT COALESCE(COUNT(*), 0) AS total
      FROM ferramentas
      WHERE estoque_disponivel <= 1
    `);

    // =========================
    // FERRAMENTAS EM USO > 48H
    // =========================
    const [travadas] = await db.query(`
      SELECT 
        m.id,
        m.ferramenta_codigo,
        f.descricao,
        m.colaborador_cracha,
        m.data_retirada,
        TIMESTAMPDIFF(HOUR, m.data_retirada, NOW()) AS horas_em_uso
      FROM movimentacoes m
      JOIN ferramentas f ON f.codigo = m.ferramenta_codigo
      WHERE m.status = 'EM_USO'
        AND TIMESTAMPDIFF(HOUR, m.data_retirada, NOW()) > 48
    `);

    // =========================
    // RECENTES
    // =========================
    const [recentes] = await db.query(`
      SELECT 
        f.descricao,
        m.colaborador_cracha,
        m.status,
        m.data_retirada
      FROM movimentacoes m
      JOIN ferramentas f ON f.codigo = m.ferramenta_codigo
      ORDER BY m.data_retirada DESC
      LIMIT 10
    `);

    // =========================
    // TOP FERRAMENTAS
    // =========================
    const [ferramentasTop] = await db.query(`
      SELECT 
        f.codigo,
        f.descricao,
        COUNT(m.id) AS total
      FROM movimentacoes m
      JOIN ferramentas f ON f.codigo = m.ferramenta_codigo
      GROUP BY f.codigo, f.descricao
      ORDER BY total DESC
      LIMIT 5
    `);

    // =========================
    // TOP FUNCIONÁRIOS
    // =========================
    const [funcionariosTop] = await db.query(`
      SELECT 
        c.nome,
        COUNT(m.id) AS total
      FROM movimentacoes m
      JOIN colaboradores c ON c.cracha = m.colaborador_cracha
      GROUP BY c.nome
      ORDER BY total DESC
      LIMIT 5
    `);

    // =========================
    // QUEBRAS
    // =========================
    const [quebrasResult] = await db.query(`
      SELECT COALESCE(COUNT(*), 0) AS total
      FROM movimentacoes
      WHERE status = 'QUEBRADA'
    `);

    // =========================
    // RESPONSE FINAL (SAFE)
    // =========================
    res.json({
      estoque: estoqueResult[0] || { disponivel: 0, manutencao: 0 },
      status: statusResult[0] || { em_uso: 0, devolvido: 0, total_movimentacoes: 0 },
      timeline: timeline || [],

      alertasCriticos: alertasCriticosResult[0] || { total: 0 },
      ferramentasTravadas: { itens: travadas || [] },
      recentes: recentes || [],

      metricas: {
        ferramentasTop: ferramentasTop || [],
        funcionariosTop: funcionariosTop || [],
        quebras: quebrasResult[0]?.total || 0
      }
    });

  } catch (err) {
    console.error("❌ Erro dashboard:", err);
    res.status(500).json({ error: "Erro interno no dashboard" });
  }
};