// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './config/logger';
import { apiResponse } from '../common/response/ApiResponse';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

// Request logging


// Rate limiting


// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP request logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// API routes


// Health check endpoint
app.get('/health', (req, res) => {
    res.json(apiResponse.success({ status: 'healthy', timestamp: new Date().toISOString() }));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json(apiResponse.error('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
});

// Error handling middleware


export default app;