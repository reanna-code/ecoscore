import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initializeFirebase } from './config/firebase.js';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import leaderboardRoutes from './routes/leaderboard.js';
import ngoRoutes from './routes/ngos.js';
import sponsorRoutes from './routes/sponsors.js';
import productRoutes from './routes/products.js';
import pledgeRoutes from './routes/pledges.js';
import donationRoutes from './routes/donations.js';
import pointsRoutes from './routes/points.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, allow all localhost and local network IPs
    const allowedPatterns = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      /^http:\/\/169\.254\.\d+\.\d+:\d+$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
    ];
    
    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('⚠️  CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`🔍 OPTIONS preflight: ${req.path} | Origin: ${req.headers.origin || 'none'}`);
  } else {
    console.log(`📥 ${req.method} ${req.path} | Origin: ${req.headers.origin || 'none'}`);
  }
  next();
});

app.use(express.json());

// Initialize Firebase Admin
initializeFirebase();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pledges', pledgeRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS: Origin not allowed'
    });
  }
  
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
