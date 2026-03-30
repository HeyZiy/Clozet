const pool = require('./db');

const migrateSQL = `
-- 添加 storage_location 字段到 items 表（如果不存在）
ALTER TABLE items ADD COLUMN IF NOT EXISTS storage_location TEXT;
`;

async function migrate() {
  try {
    await pool.query(migrateSQL);
    console.log('迁移成功：已添加 storage_location 字段');
    process.exit(0);
  } catch (err) {
    console.error('迁移失败：', err);
    process.exit(1);
  }
}

migrate();
