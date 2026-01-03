const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for React
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Stricter limit for API routes
  message: 'Too many API requests, please try again later.',
});

app.use('/api/', apiLimiter);
app.use(limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// CORS middleware
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ].filter(Boolean)
);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (curl/postman) with no Origin header
    if (!origin) return callback(null, true);

    // In development, allow localhost on any port (Vite may auto-pick if ports are busy)
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.has(origin)) return callback(null, true);

    // Deny other origins in production; in dev we still keep a tight allowlist to avoid surprises
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
const resumeRoutes = require('./routes/resume');
const skillsRoutes = require('./routes/skills');
const roadmapRoutes = require('./routes/roadmap');
const interviewRoutes = require('./routes/interview');
const userRoutes = require('./routes/user');
const practiceRoutes = require('./routes/practice');
const leaderboardRoutes = require('./routes/leaderboard');
const technicalChallengesRoutes = require('./routes/technicalChallenges');

app.use('/api/resume', resumeRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/user', userRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/technical-challenges', technicalChallengesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check with detailed status
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CareerPilot API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Normalize common infrastructure errors into demo-safe responses
  const dbErrorCodes = new Set([
    'ECONNREFUSED',
    'PROTOCOL_CONNECTION_LOST',
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR',
    'ER_DBACCESS_DENIED_ERROR',
    'ER_NO_SUCH_TABLE',
    'ER_BAD_FIELD_ERROR',
    'ER_PARSE_ERROR'
  ]);

  // CORS errors should be 403
  if (err && typeof err.message === 'string' && err.message.startsWith('CORS blocked for origin:')) {
    return res.status(403).json({
      success: false,
      error: err.message
    });
  }

  // MySQL errors: surface as 503 so the UI can show a clear message
  if (err && dbErrorCodes.has(err.code)) {
    return res.status(503).json({
      success: false,
      error: 'Database is unavailable. Please verify DB settings and run migrations/seed.',
      ...(process.env.NODE_ENV === 'development' && { details: { code: err.code, message: err.message } })
    });
  }

  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      path: req.path 
    })
  });
});

// Initialize achievements on startup
const achievements = require('./services/achievements');
achievements.initializeAchievements().catch(err => {
  console.error('Error initializing achievements:', err);
});

app.listen(PORT, () => {
  console.log(`🚀 CareerPilot API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

