const sqlite3 = require('sqlite3').verbose();
const pool = require('./db');
const path = require('path');

const sqliteDb = new sqlite3.Database(path.join(__dirname, 'data', 'database.sqlite'));

async function migrate() {
  console.log('Starting migration from SQLite to PostgreSQL...');
  
  // Get all items
  const items = await new Promise((resolve, reject) => {
    sqliteDb.all('SELECT * FROM items', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Get all purchases
  const purchases = await new Promise((resolve, reject) => {
    sqliteDb.all('SELECT * FROM purchases', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  console.log(`Found ${items.length} items and ${purchases.length} purchases to migrate`);

  // Clear existing data in PostgreSQL
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM purchases');
  
  // Reset sequences
  await pool.query('ALTER SEQUENCE items_id_seq RESTART WITH 1');
  await pool.query('ALTER SEQUENCE purchases_id_seq RESTART WITH 1');

  // Insert items
  for (const item of items) {
    await pool.query(
      `INSERT INTO items (image, name, category, brand, season, status, price, url, buy_date, source, add_date, color, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        item.image,
        item.name,
        item.category,
        item.brand,
        item.season,
        item.status,
        item.price,
        item.url,
        item.buy_date,
        item.source,
        item.add_date,
        item.color,
        item.location
      ]
    );
  }
  console.log(`Migrated ${items.length} items`);

  // Insert purchases
  for (const purchase of purchases) {
    await pool.query(
      `INSERT INTO purchases (image, name, brand, category, buy_date, source, price, url, status, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        purchase.image,
        purchase.name,
        purchase.brand,
        purchase.category,
        purchase.buy_date,
        purchase.source,
        purchase.price,
        purchase.url,
        purchase.status,
        purchase.remarks
      ]
    );
  }
  console.log(`Migrated ${purchases.length} purchases`);

  console.log('Migration completed successfully!');
  
  sqliteDb.close();
  await pool.end();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  sqliteDb.close();
  pool.end();
  process.exit(1);
});
