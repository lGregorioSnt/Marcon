const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const SECRET_KEY = "marcon_secret_key_2026";

// --- 🔐 LOGIN ---
router.post('/login', async (req, res) => {
    const { cracha, senha } = req.body;

    console.log(`🔍 Tentando login: Crachá ${cracha}`);

    try {
        // 🔥 A MÁGICA ACONTECE AQUI: Adicionamos o 'cracha' no SELECT e tratamos os nulos!
        const [rows] = await db.query(
            `SELECT id, nome, cracha, perfil, senha FROM usuarios WHERE cracha = ?
             UNION
             SELECT cracha as id, nome, cracha, 'Colaborador' as perfil, senha FROM colaboradores WHERE cracha = ?`,
            [cracha, cracha]
        );

        // Usuário não existe
        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Usuário não encontrado."
            });
        }

        const usuario = rows[0];

        // Validação de senha
        if (usuario.senha !== senha) {
            return res.status(401).json({
                success: false,
                message: "Senha incorreta."
            });
        }

        // Geração do JWT
        const token = jwt.sign(
            { id: usuario.id, perfil: usuario.perfil },
            SECRET_KEY,
            { expiresIn: '8h' }
        );

        console.log(`✅ Login realizado: ${usuario.nome}`);

        // 🔥 MANDANDO O CRACHÁ PRO FRONT-END
        return res.json({
            success: true,
            token,
            user: {
                id: usuario.id,
                nome: usuario.nome,
                cracha: usuario.cracha, // 👈 O SALVADOR DA PÁTRIA ESTÁ AQUI
                perfil: usuario.perfil
            }
        });

    } catch (err) {
        console.error("🔥 Erro no banco de dados:", err);
        return res.status(500).json({
            success: false,
            message: "Erro interno no servidor."
        });
    }
});

module.exports = router;