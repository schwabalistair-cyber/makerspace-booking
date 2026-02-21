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

  // Add instructor flag to users
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_instructor BOOLEAN DEFAULT FALSE`);

  // Add instructor foreign key to classes
  await pool.query(`ALTER TABLE classes ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES users(id)`);

  // Create attendance table for per-session check-in
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      enrolled_student_id INTEGER REFERENCES enrolled_students(id) ON DELETE CASCADE,
      session_date TEXT NOT NULL,
      present BOOLEAN DEFAULT FALSE,
      checked_in_at TIMESTAMPTZ,
      UNIQUE(class_id, enrolled_student_id, session_date)
    )
  `);

  // Add profile fields to users
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT`);

  // Create certifications table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS certifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      shop_area TEXT NOT NULL,
      certified_at TIMESTAMPTZ DEFAULT NOW(),
      certified_by INTEGER REFERENCES users(id),
      UNIQUE(user_id, shop_area)
    )
  `);

  // Create purchases table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid',
      due_date TEXT,
      paid_at TIMESTAMPTZ,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

module.exports = { pool, initDb };
