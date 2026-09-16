const express = require('express');
const cors = require('cors');
const movRoutes = require('./routes/movRoutes');
const authRoutes = require('./routes/authRoutes');  
const ferramentasRoutes = require('./routes/ferramentasRoutes');
const suporteRoutes = require('./routes/suporteRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', authRoutes); // 1. Rotas públicas (como /login) são registradas primeiro.
app.use('/api', movRoutes);  // 2. Rotas protegidas são registradas depois.
app.use('/api/ferramentas', ferramentasRoutes);
app.use('/api/suporte', suporteRoutes);

app.listen(4000, () => console.log('API Marcon rodando com Nodemon na 4000'));