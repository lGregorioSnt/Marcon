const jwt = require('jsonwebtoken');

// A chave DEVE ser a mesma que você usou no login para a assinatura bater
const SECRET_KEY = "marcon_secret_key_2026"; 

const authMiddleware = (req, res, next) => {
    // 1. Pega o cabeçalho de autorização
    const authHeader = req.headers['authorization'];
    
    // Se não houver cabeçalho, já barra aqui para não dar erro no .split()
    if (!authHeader) {
        return res.status(401).json({ 
            success: false, 
            message: "Acesso negado. Nenhum token foi enviado." 
        });
    }

    // O padrão esperado é "Bearer <token>", então pegamos a parte após o espaço
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Acesso negado. Formato de token inválido ou não fornecido." 
        });
    }

    // 2. Verifica se o token é legítimo e não expirou
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ 
                success: false, 
                message: "Sua sessão expirou ou o token é inválido. Faça login novamente." 
            });
        }

        // 3. Injetamos os dados do usuário dentro da requisição (req)
        // Assim, qualquer controller que venha depois saberá QUEM está fazendo a ação
        req.usuarioId = decoded.id;
        req.usuarioPerfil = decoded.perfil;

        next(); // Tudo certo! Libera para a próxima função (o controller)
    });
};

module.exports = authMiddleware;