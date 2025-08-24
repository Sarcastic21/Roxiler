// routes/stores.js
import express from "express";
import { pool } from "../config/db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// ✅ Super Admin: Add a store for a store owner
router.post("/create", auth, async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can add stores" });
    }

    const { name, email, address, owner_id } = req.body;

    // Validate owner
    const owner = await pool.query("SELECT * FROM users WHERE id = $1 AND role = 'storeowner'", [owner_id]);
    if (owner.rows.length === 0) {
      return res.status(400).json({ message: "Invalid store owner" });
    }

    const store = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, address, owner_id]
    );

    res.json({ message: "Store created successfully", store: store.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all stores (public endpoint)
router.get("/", async (req, res) => {
  try {
    const stores = await pool.query(`
      SELECT s.*, u.username AS owner_name
      FROM stores s
      JOIN users u ON s.owner_id = u.id
      ORDER BY s.created_at DESC
    `);
    res.json(stores.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get stores with detailed ratings (protected endpoint) - SINGLE VERSION
router.get("/with-ratings", auth, async (req, res) => {
  try {
    const stores = await pool.query(`
      SELECT 
        s.*, 
        u.username AS owner_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'value', r.rating,
              'comment', r.comment,
              'user_name', 
                CASE 
                  WHEN r.anonymous_name IS NOT NULL THEN r.anonymous_name
                  ELSE ru.username 
                END,
              'user_email',
                CASE 
                  WHEN r.anonymous_email IS NOT NULL THEN r.anonymous_email
                  ELSE ru.email 
                END,
              'created_at', r.created_at,
              'is_anonymous', r.anonymous_name IS NOT NULL
            ) 
            ORDER BY r.created_at DESC
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS ratings
      FROM stores s
      JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON s.id = r.store_id
      LEFT JOIN users ru ON r.user_id = ru.id
      GROUP BY s.id, u.username
      ORDER BY s.created_at DESC
    `);
    
    res.json(stores.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Users can rate a store
router.post("/:id/rate", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const storeId = req.params.id;
    const userId = req.user.id;

    // Check if user already rated this store
    const existingRating = await pool.query(
      "SELECT * FROM ratings WHERE store_id = $1 AND user_id = $2",
      [storeId, userId]
    );

    if (existingRating.rows.length > 0) {
      // Update existing rating
      await pool.query(
        "UPDATE ratings SET rating = $1, comment = $2, created_at = NOW() WHERE store_id = $3 AND user_id = $4",
        [rating, comment, storeId, userId]
      );
    } else {
      // Insert new rating
      await pool.query(
        "INSERT INTO ratings (store_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)",
        [storeId, userId, rating, comment]
      );
    }

    // Calculate new average rating
    const avgResult = await pool.query(
      "SELECT AVG(rating) as avg_rating FROM ratings WHERE store_id = $1",
      [storeId]
    );
    
    const avgRating = parseFloat(avgResult.rows[0].avg_rating) || 0;

    // Update store rating
    await pool.query(
      "UPDATE stores SET rating = $1 WHERE id = $2",
      [avgRating.toFixed(1), storeId]
    );

    res.json({ message: "Rating submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Anonymous users can rate a store
router.post("/:id/rate-anonymous", async (req, res) => {
  try {
    const { rating, comment, user_name, user_email } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const storeId = req.params.id;
    const userName = user_name || "Anonymous";
    const userEmail = user_email || "anonymous@example.com";

    // Check if store exists
    const storeCheck = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
    if (storeCheck.rows.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    // For anonymous ratings, we'll use a special guest user account
    // First, check if we have a guest user
    let guestUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND role = 'guest'",
      ["guest@anonymous.com"]
    );

    let guestUserId;
    
    if (guestUser.rows.length === 0) {
      // Create a guest user if doesn't exist
      const newGuestUser = await pool.query(
        `INSERT INTO users (username, email, password, role, verified)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ["Guest", "guest@anonymous.com", "", "guest", true]
      );
      guestUserId = newGuestUser.rows[0].id;
    } else {
      guestUserId = guestUser.rows[0].id;
    }

    // Insert new rating with anonymous user details
    await pool.query(
      `INSERT INTO ratings (store_id, user_id, rating, comment, anonymous_name, anonymous_email) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [storeId, guestUserId, rating, comment, userName, userEmail]
    );

    // Calculate new average rating
    const avgResult = await pool.query(
      "SELECT AVG(rating) as avg_rating FROM ratings WHERE store_id = $1",
      [storeId]
    );
    
    const avgRating = parseFloat(avgResult.rows[0].avg_rating) || 0;

    // Update store rating
    await pool.query(
      "UPDATE stores SET rating = $1 WHERE id = $2",
      [avgRating.toFixed(1), storeId]
    );

    res.json({ message: "Rating submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete store (Super Admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can delete stores" });
    }

    const result = await pool.query("DELETE FROM stores WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Store not found" });

    res.json({ message: "Store deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;