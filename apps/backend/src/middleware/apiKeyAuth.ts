import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { apiKeys } from '../config/schema';
import { eq, and, gt } from 'drizzle-orm';
import { cacheService } from '../services/cache';

export interface AuthenticatedRequest extends FastifyRequest {
  apiKey?: {
    id: string;
    userId: string;
    name: string;
    keyPrefix: string;
    isActive: boolean;
    expiresAt?: Date;
  };
}

export async function apiKeyAuth(request: AuthenticatedRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'API key is required',
    });
    return;
  }

  // Validate API key format
  if (!apiKey.startsWith('ef_') || apiKey.split('_').length !== 3) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid API key format',
    });
    return;
  }

  const [, keyId] = apiKey.split('_');

  try {
    // Check cache first
    const cachedKey = await cacheService.get(`api_key:${keyId}`);
    if (cachedKey) {
      const isValid = await bcrypt.compare(apiKey, cachedKey.keyHash);
      if (isValid && cachedKey.isActive && (!cachedKey.expiresAt || cachedKey.expiresAt > new Date())) {
        request.apiKey = cachedKey;
        return;
      }
    }

    // Fetch from database
    const dbKey = await db.query.apiKeys.findFirst({
      where: (keys, { eq }) => eq(keys.id, keyId),
    });

    if (!dbKey) {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
      return;
    }

    // Verify the key
    const isValid = await bcrypt.compare(apiKey, dbKey.keyHash);

    if (!isValid) {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
      return;
    }

    // Check if key is active
    if (!dbKey.isActive) {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'API key is inactive',
      });
      return;
    }

    // Check if key is expired
    if (dbKey.expiresAt && dbKey.expiresAt <= new Date()) {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'API key has expired',
      });
      return;
    }

    // Cache the key for future requests
    await cacheService.set(`api_key:${keyId}`, dbKey, 300); // 5 minutes

    // Update last used timestamp
    await db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyId));

    request.apiKey = dbKey;

  } catch (error) {
    console.error('API key authentication error:', error);
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
    return;
  }
}

export async function rateLimitMiddleware(request: AuthenticatedRequest, reply: FastifyReply) {
  if (!request.apiKey) {
    return; // Skip rate limiting if no API key
  }

  const endpoint = request.routerPath || request.url;
  const apiKeyId = request.apiKey.id;

  try {
    const currentCount = await cacheService.incrementRateLimit(apiKeyId, endpoint, 60); // 1 minute window

    // Set rate limits based on endpoint
    let maxRequests = 100; // Default limit

    if (endpoint.includes('/email/find')) {
      maxRequests = 10; // Lower limit for email finding
    } else if (endpoint.includes('/email/validate')) {
      maxRequests = 50; // Medium limit for validation
    }

    if (currentCount > maxRequests) {
      reply.status(429).send({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute.`,
        retryAfter: 60,
      });
      return;
    }

    // Add rate limit headers
    reply.header('X-RateLimit-Limit', maxRequests);
    reply.header('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount));
    reply.header('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 60);

  } catch (error) {
    console.error('Rate limiting error:', error);
    // Don't block the request if rate limiting fails
  }
}
