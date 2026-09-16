const express = require('express');
const router = express.Router();
const suporteController = require('../controllers/suporteController');

// Proteção da rota com o middleware existente (se houver, e pelo visto as rotas em server.js usam)
const authMiddleware = require('../middlewares/auth');

router.get('/', authMiddleware, suporteController.getChamados);
router.post('/', authMiddleware, suporteController.createChamado);
router.put('/:id', authMiddleware, suporteController.updateChamado);
router.put('/:id/status', authMiddleware, suporteController.updateStatus);

module.exports = router;