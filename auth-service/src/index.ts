// filepath: src/index.ts
// 🚀 Application Entry Point

import dotenv from 'dotenv';
import app from './app';
import pool from './infrastructure/config/database';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

// Test database connection before starting server
const startServer = async () => {
  try {
    // Test PostgreSQL connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════╗
║   🚀 Auth Service - Clean Architecture  ║
║                                          ║
║   Port: ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}                ║
║   Database: PostgreSQL                   ║
║                                          ║
║   API: http://localhost:${PORT}/api/v1     ║
║   Health: http://localhost:${PORT}/health  ║
╚══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();
