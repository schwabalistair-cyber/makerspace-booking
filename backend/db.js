const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      user_type TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      user_id INTEGER,
      user_type TEXT,
      date TEXT,
      time_slot TEXT,
      shop_area TEXT,
      rate_charged NUMERIC,
      rate_label TEXT,
      booked_by_admin BOOLEAN DEFAULT FALSE,
      admin_id INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      title TEXT,
      series TEXT,
      instructor TEXT,
      sessions JSONB,
      duration TEXT,
      max_capacity INTEGER,
      price NUMERIC,
      description TEXT,
      prerequisites TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrolled_students (
      id SERIAL PRIMARY KEY,
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      user_id INTEGER,
      user_name TEXT,
      user_email TEXT,
      enrolled_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

module.exports = { pool, initDb };
