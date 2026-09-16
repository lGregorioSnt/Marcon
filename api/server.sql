-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema marcon
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `marcon` ;

-- -----------------------------------------------------
-- Schema marcon
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `marcon` DEFAULT CHARACTER SET utf8mb4 ;
USE `marcon` ;

-- -----------------------------------------------------
-- Table `marcon`.`chamados`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `marcon`.`chamados` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `assunto` VARCHAR(255) NOT NULL,
  `descricao` TEXT NOT NULL,
  `ferramentas` VARCHAR(255) NULL DEFAULT NULL,
  `categoria` VARCHAR(100) NULL DEFAULT NULL,
  `prioridade` VARCHAR(50) NULL DEFAULT NULL,
  `status` VARCHAR(50) NULL DEFAULT 'Pendente',
  `data_criacao` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `ativo_id` VARCHAR(50) NULL DEFAULT NULL,
  `usuario_id` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `marcon`.`anexos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `marcon`.`anexos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `url` VARCHAR(255) NOT NULL,
  `chamado_id` INT(11) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_chamado_anexo` (`chamado_id` ASC),
  CONSTRAINT `fk_anexos_chamados`
    FOREIGN KEY (`chamado_id`)
    REFERENCES `marcon`.`chamados` (`id`)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `marcon`.`colaboradores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `marcon`.`colaboradores` (
  `cracha` VARCHAR(20) NOT NULL,
  `nome` VARCHAR(100) NOT NULL,
  `oficina` VARCHAR(50) NULL DEFAULT NULL,
  `turno` VARCHAR(20) NULL DEFAULT NULL,
  `senha` VARCHAR(255) NULL DEFAULT 'marcon123',
  PRIMARY KEY (`cracha`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `marcon`.`equipamentos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `marcon`.`equipamentos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `codigo` VARCHAR(50) NULL DEFAULT NULL,
  `setor` VARCHAR(100) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_equipamento_codigo` (`codigo` ASC)
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `marcon`.`ferramentas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `marcon`.`ferramentas` (
  `codigo` VARCHAR(50) NOT NULL,
  `descricao` VARCHAR(255) NOT NULL,
  `estoque_total` INT(11) NOT NULL DEFAULT 1,
  `estoque_disponivel` INT(11) NOT NULL DEFAULT 1,
  `em_manutencao` INT(11) NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NULL DEFAULT 'Disponível',
  PRIMARY KEY (`codigo`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `marcon`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `marcon`.`usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `cracha` VARCHAR(20) NULL DEFAULT NULL,
  `nome` VARCHAR(100) NOT NULL,
  `perfil` VARCHAR(20) NULL DEFAULT 'Almoxarife',
  `senha` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_usuario_cracha` (`cracha` ASC)
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `marcon`.`movimentacoes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `marcon`.`movimentacoes` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `ferramenta_codigo` VARCHAR(50) NOT NULL,
  `colaborador_cracha` VARCHAR(20) NULL DEFAULT NULL,
  `almoxarife_retirada_id` INT(11) NOT NULL,
  `almoxarife_devolucao_id` INT(11) NULL DEFAULT NULL,
  `data_retirada` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(),
  `data_devolucao` DATETIME NULL DEFAULT NULL,
  `quantidade` INT(11) NULL DEFAULT 1,
  `status` ENUM('EM_USO', 'DEVOLVIDO', 'ENVIADO_MANUTENCAO') NOT NULL DEFAULT 'EM_USO',
  `condicao_retirada` VARCHAR(50) NULL DEFAULT 'PERFEITO ESTADO',
  `condicao_devolucao` VARCHAR(50) NULL DEFAULT NULL,
  `observacao` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_mov_ferramenta` (`ferramenta_codigo` ASC),
  INDEX `idx_mov_almoxarife` (`almoxarife_retirada_id` ASC),
  INDEX `idx_mov_colaborador` (`colaborador_cracha` ASC),
  CONSTRAINT `fk_mov_almoxarife`
    FOREIGN KEY (`almoxarife_retirada_id`)
    REFERENCES `marcon`.`usuarios` (`id`),
  CONSTRAINT `fk_mov_colaborador`
    FOREIGN KEY (`colaborador_cracha`)
    REFERENCES `marcon`.`colaboradores` (`cracha`)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_mov_ferramenta`
    FOREIGN KEY (`ferramenta_codigo`)
    REFERENCES `marcon`.`ferramentas` (`codigo`)
) ENGINE = InnoDB AUTO_INCREMENT = 68 DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table `marcon`.`transferencias_pendentes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `marcon`.`transferencias_pendentes` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `movimentacao_id` INT(11) NOT NULL,
  `de_cracha` VARCHAR(20) NOT NULL,
  `para_cracha` VARCHAR(20) NOT NULL,
  `condicao` VARCHAR(50) NULL DEFAULT NULL,
  `status` VARCHAR(20) NULL DEFAULT 'PENDENTE',
  `data_solicitacao` DATETIME NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  INDEX `movimentacao_id` (`movimentacao_id` ASC),
  INDEX `de_cracha` (`de_cracha` ASC),
  INDEX `para_cracha` (`para_cracha` ASC),
  CONSTRAINT `transferencias_pendentes_ibfk_1`
    FOREIGN KEY (`movimentacao_id`)
    REFERENCES `marcon`.`movimentacoes` (`id`)
    ON UPDATE CASCADE,
  CONSTRAINT `transferencias_pendentes_ibfk_2`
    FOREIGN KEY (`de_cracha`)
    REFERENCES `marcon`.`colaboradores` (`cracha`)
    ON UPDATE CASCADE,
  CONSTRAINT `transferencias_pendentes_ibfk_3`
    FOREIGN KEY (`para_cracha`)
    REFERENCES `marcon`.`colaboradores` (`cracha`)
    ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 10 DEFAULT CHARACTER SET = utf8mb4;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;