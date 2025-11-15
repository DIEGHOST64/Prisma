// filepath: src/app.ts
// 🌐 PRESENTATION LAYER - Express App Configuration

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createAuthRoutes } from './presentation/routes/authRoutes';
import { createUserRoutes } from './presentation/routes/userRoutes';
import { container } from './infrastructure/config/container';

const app: Application = express();

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later'
});

app.use('/api', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'auth-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.use(`${apiPrefix}/auth`, createAuthRoutes(container.authController));
app.use(`${apiPrefix}/users`, createUserRoutes(container.userController));

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

export default app;
