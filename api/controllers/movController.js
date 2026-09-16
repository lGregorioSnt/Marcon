const db = require('../config/db');

// --- 🛠️ GESTÃO DE FERRAMENTAS (CRUD & BUSCA) ---

// Listar todas as unidades de ferramentas cadastradas
exports.getFerramentas = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ferramentas');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Buscar uma unidade específica pelo código de patrimônio
exports.getFerramentaByCodigo = async (req, res) => {
  const { codigo } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM ferramentas WHERE codigo = ?', [codigo]);
    if (rows.length === 0) return res.status(404).json({ error: "Ferramenta não encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cadastrar uma nova unidade física no sistema
exports.registrarNovaFerramenta = async (req, res) => {
  const { codigo, descricao } = req.body;
  if (!codigo || !descricao) {
    return res.status(400).json({ error: 'Código e descrição são obrigatórios.' });
  }

  try {
    const [existing] = await db.query('SELECT codigo FROM ferramentas WHERE codigo = ?', [codigo]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Já existe uma ferramenta com este código.' });
    }

    await db.query('INSERT INTO ferramentas (codigo, descricao) VALUES (?, ?)', [codigo, descricao]);
    res.status(201).json({ message: 'Ferramenta registrada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 👤 GESTÃO DE COLABORADORES E ACESSO ---
exports.login = async (req, res) => {
  const { cracha, senha } = req.body;
  
  // 🔥 SE ISSO NÃO APARECER NO TERMINAL, O NODE NÃO REINICIOU!
  console.log("=====================================");
  console.log("🔥 LOGIN ACIONADO PELO CRACHÁ:", cracha);
  console.log("=====================================");

  try {
    // 1. Tenta achar o COLABORADOR
    const [colaboradores] = await db.query(
      'SELECT * FROM colaboradores WHERE cracha = ? AND senha = ?',
      [cracha, senha]
    );

    if (colaboradores.length > 0) {
      const usuario = colaboradores[0];
      const resposta = {
        id: cracha,          // Preenche o ID pro front não reclamar de null
        nome: usuario.nome,
        cracha: cracha,      // 👈 PEGANDO DIRETO DO REQ.BODY (Garantido!)
        perfil: 'Colaborador',
        token: 'token-mobile-simulado'
      };
      
      console.log("✅ DEVOLVENDO PRO FRONT:", resposta);
      return res.json(resposta);
    }

    // 2. Tenta achar o ADMIN
    const [usuarios] = await db.query(
      'SELECT * FROM usuarios WHERE cracha = ? AND senha = ?',
      [cracha, senha]
    );

    if (usuarios.length > 0) {
      const usuario = usuarios[0];
      const resposta = {
        id: usuario.id,
        nome: usuario.nome,
        cracha: cracha,      // 👈 PEGANDO DIRETO DO REQ.BODY
        perfil: usuario.perfil,
        token: 'token-admin-simulado'
      };
      
      console.log("✅ DEVOLVENDO PRO FRONT:", resposta);
      return res.json(resposta);
    }

    return res.status(401).json({ error: 'Credenciais inválidas' });

  } catch (err) {
    console.error("❌ ERRO NO LOGIN:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getColaboradores = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT cracha, nome, oficina FROM colaboradores');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 📦 FLUXO DE MOVIMENTAÇÃO (O CORAÇÃO DO APP) ---

// Registrar Saída (Entrega para o Colaborador) - Suporta múltiplas ferramentas
exports.registrarEntrega = async (req, res) => {
  const { ferramenta_codigo, ferramentas, colaborador_cracha } = req.body;
  const almoxarife_id = req.usuarioId;

  const codigos = ferramentas || (ferramenta_codigo ? [ferramenta_codigo] : []);

  if (codigos.length === 0) {
    return res.status(400).json({ message: "Nenhuma ferramenta selecionada para entrega." });
  }

  try {
    const [colab] = await db.query('SELECT * FROM colaboradores WHERE cracha = ?', [colaborador_cracha]);
    if (colab.length === 0) return res.status(400).json({ message: "Este crachá não está cadastrado!" });

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      for (const codigo of codigos) {
        const [disp] = await conn.query('SELECT estoque_disponivel FROM ferramentas WHERE codigo = ?', [codigo]);
        if (disp.length === 0) throw new Error(`A ferramenta ${codigo} não existe.`);
        if (disp[0].estoque_disponivel === 0) throw new Error(`A ferramenta ${codigo} já está em uso.`);

        await conn.query(
          'INSERT INTO movimentacoes (ferramenta_codigo, colaborador_cracha, almoxarife_retirada_id, status) VALUES (?, ?, ?, "EM_USO")',
          [codigo, colaborador_cracha, almoxarife_id]
        );

        await conn.query(
          'UPDATE ferramentas SET estoque_disponivel = 0, status = "Em Uso" WHERE codigo = ?',
          [codigo]
        );
      }

      await conn.commit();
      res.json({ success: true, message: 'Entrega realizada com sucesso!' });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally { conn.release(); }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Registrar Devolução
exports.registrarDevolucao = async (req, res) => {
  const { movimentacao_id, condicao, observacao } = req.body;
  const almoxarife_id = req.usuarioId;

  try {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const [mov] = await conn.query('SELECT ferramenta_codigo FROM movimentacoes WHERE id = ?', [movimentacao_id]);
      if (mov.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "Movimentação não encontrada" });
      }

      const codigo = mov[0].ferramenta_codigo;
      const isQuebrada = condicao === 'QUEBRADA';
      const statusFinalMov = isQuebrada ? 'ENVIADO_MANUTENCAO' : 'DEVOLVIDO';
      const novoStatusFerramenta = isQuebrada ? 'Manutenção' : 'Disponível';

      await conn.query(
        `UPDATE movimentacoes SET data_devolucao = CURRENT_TIMESTAMP, almoxarife_devolucao_id = ?, status = ?, condicao_devolucao = ?, observacao = ? WHERE id = ?`,
        [almoxarife_id, statusFinalMov, condicao, observacao, movimentacao_id]
      );

      await conn.query(
        'UPDATE ferramentas SET estoque_disponivel = ?, em_manutencao = ?, status = ? WHERE codigo = ?',
        [isQuebrada ? 0 : 1, isQuebrada ? 1 : 0, novoStatusFerramenta, codigo]
      );

      await conn.commit();
      res.json({ message: 'Devolução registrada com sucesso!' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally { conn.release(); }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Registrar Repasse entre colaboradores
exports.registrarRepasse = async (req, res) => {
  const { movimentacao_id, movimentacoes, novo_colaborador_cracha, condicao } = req.body;

  const movs_ids = movimentacoes || (movimentacao_id ? [movimentacao_id] : []);

  if (movs_ids.length === 0) {
    return res.status(400).json({ error: "Nenhuma ferramenta selecionada para repasse." });
  }

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      for (const id of movs_ids) {
        const [mov] = await connection.query(
          `SELECT colaborador_cracha, ferramenta_codigo FROM movimentacoes WHERE id = ? AND status = 'EM_USO'`,
          [id]
        );

        if (mov.length === 0) {
          throw new Error(`Movimentação ativa não encontrada para o ID ${id}`);
        }

        const atual_cracha = mov[0].colaborador_cracha;

        const [existing] = await connection.query(
          `SELECT id FROM transferencias_pendentes WHERE movimentacao_id = ? AND status = 'PENDENTE'`,
          [id]
        );

        if (existing.length > 0) {
           throw new Error("Já existe um repasse pendente para uma das ferramentas selecionadas.");
        }

        await connection.query(
          `INSERT INTO transferencias_pendentes (movimentacao_id, de_cracha, para_cracha, condicao) VALUES (?, ?, ?, ?)`,
          [id, atual_cracha, novo_colaborador_cracha, condicao]
        );
      }

      await connection.commit();
      res.json({ message: "Repasse(s) solicitado(s) com sucesso. Aguardando aceite do colega!" });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally { connection.release(); }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRepassesPendentes = async (req, res) => {
  const cracha = req.usuarioId;
  try {
    const [rows] = await db.query(`
      SELECT tp.id as transferencia_id, tp.movimentacao_id, tp.de_cracha, tp.condicao, tp.data_solicitacao,
             f.descricao as ferramenta, f.codigo as ferramenta_codigo,
             c.nome as de_nome
      FROM transferencias_pendentes tp
      JOIN movimentacoes m ON tp.movimentacao_id = m.id
      JOIN ferramentas f ON m.ferramenta_codigo = f.codigo
      JOIN colaboradores c ON tp.de_cracha = c.cracha
      WHERE tp.para_cracha = ? AND tp.status = 'PENDENTE'
    `, [cracha]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.responderRepasse = async (req, res) => {
  const { transferencia_id, aceitar } = req.body;
  const para_cracha = req.usuarioId || (req.user && req.user.id);

  if (!para_cracha) {
    return res.status(401).json({ error: "Crachá não identificado no Token." });
  }

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [tp] = await connection.query(
        `SELECT * FROM transferencias_pendentes WHERE id = ? AND status = 'PENDENTE'`,
        [transferencia_id]
      );

      if (tp.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: "Repasse não encontrado." });
      }

      const transferencia = tp[0];

      // 🔥 BLINDAGEM: Converte os dois lados para String, evitando erro de tipos
      if (String(transferencia.para_cracha) !== String(para_cracha)) {
        await connection.rollback();
        return res.status(403).json({ error: "Você não tem permissão para responder este repasse." });
      }

      if (aceitar) {
        const [mov] = await connection.query(
          `SELECT ferramenta_codigo FROM movimentacoes WHERE id = ? AND status = 'EM_USO'`,
          [transferencia.movimentacao_id]
        );

        if (mov.length === 0) {
          await connection.rollback();
          return res.status(400).json({ error: "A ferramenta não está mais em uso." });
        }

        const codigo = mov[0].ferramenta_codigo;

        // 🔥 A MÁGICA: Busca o ID de um Admin válido no banco para evitar erro de Chave Estrangeira!
        const [admin] = await connection.query(`SELECT id FROM usuarios LIMIT 1`);
        const adminId = admin.length > 0 ? admin[0].id : 1; 

        // 1. Finaliza a mov antiga (do cara que doou)
        await connection.query(
          `UPDATE movimentacoes SET status = 'DEVOLVIDO', data_devolucao = CURRENT_TIMESTAMP WHERE id = ?`,
          [transferencia.movimentacao_id]
        );

        // 2. Cria a nova mov (para você que aceitou) usando o adminId verdadeiro
        await connection.query(
          `INSERT INTO movimentacoes (ferramenta_codigo, colaborador_cracha, almoxarife_retirada_id, status, condicao_retirada) VALUES (?, ?, ?, 'EM_USO', ?)`,
          [codigo, transferencia.para_cracha, adminId, transferencia.condicao]
        );

        // 3. Marca pendencia como ACEITO
        await connection.query(
          `UPDATE transferencias_pendentes SET status = 'ACEITO' WHERE id = ?`,
          [transferencia_id]
        );
      } else {
        // Se você apertou em Recusar
        await connection.query(
          `UPDATE transferencias_pendentes SET status = 'RECUSADO' WHERE id = ?`,
          [transferencia_id]
        );
      }

      await connection.commit();
      res.json({ message: aceitar ? "Repasse aceito!" : "Repasse recusado." });
    } catch (err) {
      await connection.rollback();
      throw err; // Joga pro catch de baixo pra imprimir o erro no console
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("🔥 ERRO FATAL NO REPASSE:", err.message);
    res.status(500).json({ error: err.message });
  }
};
// --- 📊 CONSULTAS E DASHBOARD ---

exports.getResumoFerramentas = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        descricao, 
        COUNT(*) as total_unidades,
        SUM(CASE WHEN estoque_disponivel = 1 THEN 1 ELSE 0 END) as disponiveis,
        SUM(CASE WHEN em_manutencao = 1 THEN 1 ELSE 0 END) as manutencao
      FROM ferramentas 
      GROUP BY descricao
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUnidadesPorDescricao = async (req, res) => {
  const { descricao } = req.query;
  try {
    const [rows] = await db.query('SELECT * FROM ferramentas WHERE descricao = ?', [descricao]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMovimentacoesRecentes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        f.descricao as ferramenta, 
        c.nome as usuario,
        CASE
          WHEN m.status = 'DEVOLVIDO' THEN 'Devolveu'
          WHEN m.status = 'ENVIADO_MANUTENCAO' THEN 'Quebrou'
          ELSE 'Retirou'
        END as tipo,
        DATE_FORMAT(COALESCE(m.data_devolucao, m.data_retirada), '%d/%m %H:%i') as data
      FROM movimentacoes m
      JOIN ferramentas f ON m.ferramenta_codigo = f.codigo
      JOIN colaboradores c ON m.colaborador_cracha = c.cracha
      ORDER BY COALESCE(m.data_devolucao, m.data_retirada) DESC
      LIMIT 7
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendencias = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.id, m.ferramenta_codigo, f.descricao, m.colaborador_cracha, c.nome as funcionario, m.data_retirada 
      FROM movimentacoes m
      JOIN ferramentas f ON m.ferramenta_codigo = f.codigo
      JOIN colaboradores c ON m.colaborador_cracha = c.cracha
      WHERE m.status = 'EM_USO'
      ORDER BY m.data_retirada DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAlertasEstoque = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT descricao, SUM(estoque_disponivel) as disponiveis
      FROM ferramentas 
      GROUP BY descricao
      HAVING disponiveis <= 1
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getManutencaoExterna = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT codigo, descricao, status FROM ferramentas 
      WHERE em_manutencao = 1 OR status = 'Manutenção'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 📜 AUDITORIA E HISTÓRICO ---

exports.getAuditoriaCompleta = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.id, f.descricao as ferramenta, m.ferramenta_codigo, c.nome as colaborador, 
        m.data_retirada, m.data_devolucao, m.status, m.condicao_devolucao, m.observacao,
        u1.nome as almoxarife_saida, u2.nome as almoxarife_entrada
      FROM movimentacoes m
      JOIN ferramentas f ON m.ferramenta_codigo = f.codigo
      JOIN colaboradores c ON m.colaborador_cracha = c.cracha
      LEFT JOIN usuarios u1 ON m.almoxarife_retirada_id = u1.id
      LEFT JOIN usuarios u2 ON m.almoxarife_devolucao_id = u2.id
      ORDER BY COALESCE(m.data_devolucao, m.data_retirada) DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHistoricoPorFerramenta = async (req, res) => {
  const { codigo } = req.params;
  try {
    const [details] = await db.query('SELECT * FROM ferramentas WHERE codigo = ?', [codigo]);
    if (details.length === 0) return res.status(404).json({ error: 'Ferramenta não encontrada.' });

    const [movs] = await db.query(`
      SELECT m.id, c.nome as colaborador, m.data_retirada, m.data_devolucao, m.status, u1.nome as almoxarife_saida
      FROM movimentacoes m
      JOIN colaboradores c ON m.colaborador_cracha = c.cracha
      LEFT JOIN usuarios u1 ON m.almoxarife_retirada_id = u1.id
      WHERE m.ferramenta_codigo = ? ORDER BY m.data_retirada DESC`, [codigo]);

    res.json({ ferramenta: details[0], historico: movs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHistoricoPorUsuario = async (req, res) => {
  const { cracha } = req.params;
  try {
    const [rows] = await db.query(`SELECT m.id, f.descricao, m.ferramenta_codigo, m.data_retirada, m.data_devolucao, m.status, m.condicao_devolucao
      FROM movimentacoes m
      JOIN ferramentas f ON m.ferramenta_codigo = f.codigo
      WHERE m.colaborador_cracha = ? ORDER BY m.data_retirada DESC
    `, [cracha]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFerramentasEmUsoPorUsuario = async (req, res) => {
  const { cracha } = req.params;
  try {
    // Opcional: Deixar a data bonita direto no banco
    const [rows] = await db.query(`
      SELECT m.id, m.ferramenta_codigo, DATE_FORMAT(m.data_retirada, '%d/%m/%Y %H:%i') as data_retirada, f.descricao,
             (SELECT COUNT(*) FROM transferencias_pendentes tp WHERE tp.movimentacao_id = m.id AND tp.status = 'PENDENTE') > 0 as repasse_pendente
      FROM movimentacoes m
      JOIN ferramentas f ON m.ferramenta_codigo = f.codigo
      WHERE m.colaborador_cracha = ? AND m.status = 'EM_USO'
    `, [cracha]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};