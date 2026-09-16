const db = require('../config/db');

exports.getChamados = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, 
                   (SELECT GROUP_CONCAT(a.url) FROM anexos a WHERE a.chamado_id = c.id) as anexo_urls
            FROM chamados c
            ORDER BY c.data_criacao DESC
        `);
        
        const chamados = rows.map(r => ({
            ...r,
            anexo_urls: r.anexo_urls ? r.anexo_urls.split(',') : []
        }));
        
        res.json(chamados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar chamados' });
    }
};

exports.createChamado = async (req, res) => {
    try {
        const { assunto, descricao, ferramentas, categoria, prioridade, ativo_id } = req.body;
        const usuario_id = req.user ? req.user.id : 1; // Fallback to 1 if no auth

        const [result] = await db.query(
            'INSERT INTO chamados (assunto, descricao, ferramentas, categoria, prioridade, status, ativo_id, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [assunto, descricao, ferramentas, categoria, prioridade, 'Pendente', ativo_id || null, usuario_id]
        );

        res.status(201).json({ id: result.insertId, message: 'Chamado criado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar chamado' });
    }
};

exports.updateChamado = async (req, res) => {
    try {
        const { id } = req.params;
        const { assunto, descricao, ferramentas, categoria, prioridade, ativo_id } = req.body;
        
        await db.query(
            'UPDATE chamados SET assunto = ?, descricao = ?, ferramentas = ?, categoria = ?, prioridade = ?, ativo_id = ? WHERE id = ?',
            [assunto, descricao, ferramentas, categoria, prioridade, ativo_id || null, id]
        );
        res.json({ message: 'Chamado atualizado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar chamado' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        await db.query('UPDATE chamados SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Status atualizado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
};