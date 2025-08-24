import express from 'express';
import auth from '../middleware/auth.js';
import { pool } from '../config/db.js';

const router = express.Router();

// Get all users (Super Admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin or Super Admin only.' });
    }

    const usersResult = await pool.query(
      'SELECT id, username, email, role, address, verified, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json(usersResult.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, address } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      'UPDATE users SET username = $1, address = $2 WHERE id = $3 RETURNING id, username, email, role, address, verified',
      [username, address, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (Super Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }

    const userId = req.params.id;

    // Prevent super admin from deleting themselves
    if (userId == req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;