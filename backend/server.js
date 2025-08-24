import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './config/initdb.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import superAdminRoutes from './routes/superAdmin.js';
import storeRoutes from './routes/storeRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS: Only allow frontend origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://your-frontend-domain.vercel.app',
  'https://storehub-frontend.onrender.com' // Add your actual frontend domain
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check for subdomains or pattern matching if needed
    if (origin.endsWith('.vercel.app') || origin.endsWith('.render.com')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database
(async () => {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ DB init failed:', err);
  }
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/stores', storeRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ 
  status: 'OK', 
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
}));

// Serve frontend in production


// General error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  console.error(err.stack);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
});

export default app;
