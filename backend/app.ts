import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { apiRouter } from './routes/index.ts';
import { errorHandler } from './middlewares/errorHandler.ts';

export const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // allow iframe preview in AI Studio
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Request limits to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de requêtes effectuées depuis cette adresse. Veuillez réessayer plus tard."
  }
});

app.use('/api', limiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Mount Modular REST API
app.use('/api', apiRouter);

// Catch-all for undefined /api routes so they return JSON 404 instead of HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Point de terminaison API introuvable : ${req.method} ${req.originalUrl}`
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Boucherie Mira-Mk API REST',
    timestamp: new Date().toISOString()
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
