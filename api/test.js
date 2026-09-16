const db = require('./config/db');

async function test() {
  try {
    const [rows] = await db.query(`
      SELECT c.id, c.assunto, c.descricao, c.ferramentas, c.ativo_id, c.data_criacao,
             cat.nome as categoria, 
             p.nome as prioridade, 
             s.nome as status,
             (SELECT GROUP_CONCAT(a.caminho_arquivo) FROM anexos a WHERE a.chamado_id = c.id) as anexo_urls
      FROM chamados c
      LEFT JOIN categorias cat ON c.categoria_id = cat.id
      LEFT JOIN prioridades p ON c.prioridade_id = p.id
      LEFT JOIN status s ON c.status_id = s.id
      ORDER BY c.data_criacao DESC
    `);
    console.log(rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

test();