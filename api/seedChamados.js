const db = require('./config/db');

async function seed() {
  try {
    await db.query(`
      INSERT INTO chamados (assunto, descricao, ferramentas, categoria, prioridade, status, ativo_id, usuario_id) VALUES 
      ('Falha no motor da Esteira 2', 'O motor está fazendo um barulho estranho e perdendo força. Preciso abrir para verificar as correias e polias.', 'Jogo de Chaves Combinadas, Alicate Universal', 'Mecânica', 'alta', 'Pendente', 'EST-002', 1),
      ('CLP com falha de comunicação', 'O painel principal parou de responder aos comandos da rede. Desconfio de problema no cabo ou no próprio módulo.', 'Multímetro, Chave de Fenda Fina', 'Elétrica', 'alta', 'Em Andamento', 'PNL-005', 1),
      ('Atualização do software de supervisão', 'O sistema SCADA precisa da nova atualização para reconhecer o sensor novo da caldeira.', '', 'Software', 'media', 'Pendente', 'PC-SUP-01', 1),
      ('Troca de rolamento - Moinho 1', 'Rolamento principal apresentando desgaste prematuro. Necessária a substituição preventiva na próxima parada.', 'Saca-rolamentos, Graxa Industrial', 'Mecânica', 'media', 'Pendente', 'MNH-001', 1),
      ('Lâmpada queimada no setor B', 'A iluminação principal sobre a bancada de inspeção queimou.', 'Escada, Lâmpada LED 50W', 'Outros', 'baixa', 'Resolvido', 'ILUM-002', 1)
    `);
    console.log('5 chamados inseridos com sucesso!');
  } catch (error) {
    console.error('Erro ao inserir chamados:', error);
  } finally {
    process.exit();
  }
}

seed();