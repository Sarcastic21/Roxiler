import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.use((req, res, next) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin or Super Admin only.' });
  }
  next();
});


// Create user with any role
router.post('/create-user', [
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['user', 'admin', 'storeowner'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password, role } = req.body;

    // Check if username or email already exists
    const existing = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Email or username already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password, role, verified)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role`,
      [username, email, hashedPassword, role, true]
    );

    res.status(201).json({ message: `${role} created successfully`, user: newUser.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT id, username, email, role FROM users ORDER BY created_at DESC"
    );
    res.json(users.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting super admin
    const userToDelete = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (!userToDelete.rows[0]) return res.status(404).json({ message: 'User not found' });
    if (userToDelete.rows[0].role === 'super_admin') return res.status(400).json({ message: 'Cannot delete super admin' });

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
