const pool = require('./db');

const initSQL = `
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  image TEXT,
  name TEXT,
  category TEXT,
  brand TEXT,
  season TEXT,
  price REAL,
  url TEXT,
  buy_date TEXT,
  source TEXT,
  add_date TEXT,
  color TEXT,
  location TEXT,
  storage_location TEXT
);

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  image TEXT,
  name TEXT,
  brand TEXT,
  category TEXT,
  buy_date TEXT,
  source TEXT,
  price REAL,
  url TEXT,
  remarks TEXT
);
`;

async function init() {
  try {
    await pool.query(initSQL);
    console.log('Database initialized successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

init();
