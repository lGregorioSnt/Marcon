const db = require('./config/db');

async function importDb() {
  const sql = `
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS \`next\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`next\`;

CREATE TABLE IF NOT EXISTS \`categorias\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`nome\` VARCHAR(100) NOT NULL,
  \`tipo\` ENUM('ativo', 'chamado', 'faq') NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE INDEX \`nome_tipo_UNIQUE\` (\`nome\` ASC, \`tipo\` ASC))
ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS \`status\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`nome\` VARCHAR(50) NOT NULL,
  \`tipo\` ENUM('ativo', 'chamado') NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE INDEX \`nome_tipo_UNIQUE\` (\`nome\` ASC, \`tipo\` ASC))
ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS \`ativos\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`nome\` VARCHAR(255) NOT NULL,
  \`categoria_id\` INT NOT NULL,
  \`fabricante\` VARCHAR(100) NULL DEFAULT NULL,
  \`modelo\` VARCHAR(100) NULL DEFAULT NULL,
  \`numero_serie\` VARCHAR(255) NULL DEFAULT NULL,
  \`data_aquisicao\` DATE NULL DEFAULT NULL,
  \`status_id\` INT NOT NULL,
  \`imagem_url\` VARCHAR(255) NULL DEFAULT NULL,
  \`setor\` VARCHAR(100) NULL DEFAULT NULL,
  \`etiqueta\` VARCHAR(50) NULL DEFAULT NULL,
  \`localizacao\` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE INDEX \`numero_serie_UNIQUE\` (\`numero_serie\` ASC),
  INDEX \`fk_ativos_categoria_idx\` (\`categoria_id\` ASC),
  INDEX \`fk_ativos_status_idx\` (\`status_id\` ASC))
ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS \`prioridades\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`nome\` VARCHAR(50) NOT NULL,
  PRIMARY KEY (\`id\`))
ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS \`perfis\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`nome\` VARCHAR(50) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE INDEX \`nome_UNIQUE\` (\`nome\` ASC))
ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS \`usuarios\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`nome\` VARCHAR(200) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL,
  \`senha\` VARCHAR(255) NOT NULL,
  \`perfil_id\` INT NOT NULL DEFAULT '1',
  \`foto_url\` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC),
  INDEX \`fk_usuarios_perfis_idx\` (\`perfil_id\` ASC))
ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS \`chamados\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`assunto\` VARCHAR(255) NOT NULL,
  \`descricao\` TEXT NOT NULL,
  \`categoria_id\` INT NOT NULL,
  \`prioridade_id\` INT NOT NULL,
  \`status_id\` INT NOT NULL,
  \`data_criacao\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  \`usuario_id\` INT NOT NULL,
  \`tecnico_id\` INT NULL DEFAULT NULL,
  \`ativo_id\` INT NULL DEFAULT NULL,
  \`comentario\` TEXT NULL DEFAULT NULL,
  \`data_encerramento\` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`usuario_id_idx\` (\`usuario_id\` ASC),
  INDEX \`tecnico_id_idx\` (\`tecnico_id\` ASC),
  INDEX \`categoria_id_idx\` (\`categoria_id\` ASC),
  INDEX \`prioridade_id_idx\` (\`prioridade_id\` ASC),
  INDEX \`status_id_idx\` (\`status_id\` ASC),
  INDEX \`ativo_id_idx\` (\`ativo_id\` ASC))
ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS \`anexos\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`caminho_arquivo\` VARCHAR(255) NOT NULL,
  \`nome_arquivo\` VARCHAR(255) NULL DEFAULT NULL,
  \`chamado_id\` INT NOT NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`fk_anexos_chamados_idx\` (\`chamado_id\` ASC))
ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS \`chamados_historico\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`chamado_id\` INT NOT NULL,
  \`usuario_id\` INT NULL DEFAULT NULL,
  \`status_de\` INT NULL DEFAULT NULL,
  \`status_para\` INT NULL DEFAULT NULL,
  \`comentario\` TEXT NULL DEFAULT NULL,
  \`data_mudanca\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`fk_historico_chamado_idx\` (\`chamado_id\` ASC),
  INDEX \`fk_historico_usuario_idx\` (\`usuario_id\` ASC))
ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS \`faq\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`question\` VARCHAR(255) NOT NULL,
  \`answer\` TEXT NOT NULL,
  \`categoria_id\` INT NULL DEFAULT NULL,
  \`tags\` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`category_idx\` (\`categoria_id\` ASC))
ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
  `;

  try {
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    for (let statement of statements) {
      await db.query(statement);
    }
    
    // Insert some defaults so the dropdown mappings work
    await db.query("INSERT IGNORE INTO categorias (id, nome, tipo) VALUES (1, 'Mecânica', 'chamado'), (2, 'Elétrica', 'chamado'), (3, 'Software', 'chamado'), (4, 'Outros', 'chamado')");
    await db.query("INSERT IGNORE INTO prioridades (id, nome) VALUES (1, 'baixa'), (2, 'media'), (3, 'alta')");
    await db.query("INSERT IGNORE INTO status (id, nome, tipo) VALUES (1, 'Pendente', 'chamado'), (2, 'Em Andamento', 'chamado'), (3, 'Resolvido', 'chamado'), (4, 'Cancelado', 'chamado')");
    await db.query("INSERT IGNORE INTO perfis (id, nome) VALUES (1, 'ADMIN'), (2, 'TECNICO'), (3, 'USUARIO')");
    await db.query("INSERT IGNORE INTO usuarios (id, nome, email, senha, perfil_id) VALUES (1, 'Lucas', 'lucas@marcon.com', '123', 1)");

    console.log("Database next initialized successfully");
  } catch(e) {
    console.error("Error init database:", e);
  } finally {
    process.exit();
  }
}

importDb();