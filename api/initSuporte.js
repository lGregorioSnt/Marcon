const db = require('./config/db');

async function init() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS equipamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        codigo VARCHAR(50) UNIQUE,
        setor VARCHAR(100)
      );
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS chamados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assunto VARCHAR(255) NOT NULL,
        descricao TEXT NOT NULL,
        ferramentas VARCHAR(255),
        categoria VARCHAR(100),
        prioridade VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Pendente',
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ativo_id VARCHAR(50),
        usuario_id INT
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS anexos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        url VARCHAR(255) NOT NULL,
        chamado_id INT NOT NULL,
        FOREIGN KEY (chamado_id) REFERENCES chamados(id) ON DELETE CASCADE
      );
    `);
    console.log("Suporte tables created successfully!");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    process.exit();
  }
}
init();