import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { clerkPlugin } from '@clerk/fastify';

import { emailRoutes } from './routes/email';
import { authRoutes } from './routes/auth';
import { apiKeyRoutes } from './routes/apiKeys';
import { db } from './config/database';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.headers['x-api-key'] as string || request.ip;
    },
  });

  // JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  });

  // Multipart support
  await fastify.register(multipart);

  // Clerk authentication
  await fastify.register(clerkPlugin, {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });
}

// Register routes
async function registerRoutes() {
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(apiKeyRoutes, { prefix: '/api/api-keys' });
  await fastify.register(emailRoutes, { prefix: '/api/email' });

  // Health check
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    });
    return;
  }

  if (error.statusCode) {
    reply.status(error.statusCode).send({
      error: error.name || 'Error',
      message: error.message,
    });
    return;
  }

  reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Something went wrong',
  });
});

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();
    
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    fastify.log.info(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

start();
