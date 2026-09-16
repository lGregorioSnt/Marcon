const db = require('./config/db');

async function alter() {
  try {
    await db.query('ALTER TABLE chamados ADD COLUMN ferramentas VARCHAR(255) NULL DEFAULT NULL;');
    console.log('Column added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists');
    } else {
      console.error(e);
    }
  } finally {
    process.exit();
  }
}

alter();