import { pool } from './db.js';
import bcrypt from 'bcryptjs';

/**
 * Initializes the database tables and default users
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        address TEXT,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','super_admin','admin','storeowner','guest')),
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Stores table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        rating NUMERIC(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
        owner_id INT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        store_id INT REFERENCES stores(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        anonymous_name VARCHAR(100),
        anonymous_email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables created or already exist');

    // Create Super Admin if not exists
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [superAdminEmail]
    );

    if (superAdminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10);
      await pool.query(
        `INSERT INTO users (username,email,password,address,role,verified)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          process.env.SUPER_ADMIN_USERNAME,
          superAdminEmail,
          hashedPassword,
          process.env.SUPER_ADMIN_ADDRESS,
          'super_admin',
          true
        ]
      );
      console.log('✅ Super admin created successfully');
    }

    // Create guest user for anonymous ratings
    const guestCheck = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND role=$2',
      ['guest@anonymous.com', 'guest']
    );

    if (guestCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (username,email,password,role,verified)
         VALUES ($1,$2,$3,$4,$5)`,
        ['Guest', 'guest@anonymous.com', '', 'guest', true]
      );
      console.log('✅ Guest user created successfully');
    }

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}
