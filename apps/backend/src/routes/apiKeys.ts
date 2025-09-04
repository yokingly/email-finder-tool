import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { apiKeys } from '../config/schema';

const CreateApiKeyRequest = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
});

const UpdateApiKeyRequest = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function apiKeyRoutes(fastify: FastifyInstance) {
  // Create API key
  fastify.post('/', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
    schema: {
      body: CreateApiKeyRequest,
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            apiKey: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                key: { type: 'string' },
                keyPrefix: { type: 'string' },
                expiresAt: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = CreateApiKeyRequest.parse(request.body);
      const user = request.user as any;
      
      // Generate API key
      const keyId = nanoid();
      const keySecret = nanoid(32);
      const fullKey = `ef_${keyId}_${keySecret}`;
      const keyPrefix = `ef_${keyId}`;
      const keyHash = await bcrypt.hash(fullKey, 12);
      
      // Parse expiration date
      let expiresAt: Date | null = null;
      if (body.expiresAt) {
        expiresAt = new Date(body.expiresAt);
      }

      // Save to database
      const [apiKey] = await db.insert(apiKeys).values({
        id: keyId,
        userId: user.userId,
        name: body.name,
        keyHash,
        keyPrefix,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      reply.status(201).send({
        message: 'API key created successfully',
        apiKey: {
          id: keyId,
          name: body.name,
          key: fullKey, // Only returned once
          keyPrefix,
          expiresAt: expiresAt?.toISOString(),
          createdAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      fastify.log.error(error);
      reply.status(400).send({
        error: 'Invalid request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // List API keys
  fastify.get('/', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            apiKeys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  keyPrefix: { type: 'string' },
                  isActive: { type: 'boolean' },
                  lastUsedAt: { type: 'string' },
                  expiresAt: { type: 'string' },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as any;
      
      const userApiKeys = await db.query.apiKeys.findMany({
        where: (keys, { eq }) => eq(keys.userId, user.userId),
        orderBy: (keys, { desc }) => [desc(keys.createdAt)],
      });

      const apiKeysList = userApiKeys.map(key => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt?.toISOString(),
        expiresAt: key.expiresAt?.toISOString(),
        createdAt: key.createdAt.toISOString(),
      }));

      reply.send({
        apiKeys: apiKeysList,
      });

    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch API keys',
      });
    }
  });

  // Update API key
  fastify.patch('/:id', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: UpdateApiKeyRequest,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            apiKey: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                keyPrefix: { type: 'string' },
                isActive: { type: 'boolean' },
                lastUsedAt: { type: 'string' },
                expiresAt: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = UpdateApiKeyRequest.parse(request.body);
      const user = request.user as any;

      // Check if API key exists and belongs to user
      const existingKey = await db.query.apiKeys.findFirst({
        where: (keys, { eq, and }) => and(
          eq(keys.id, id),
          eq(keys.userId, user.userId)
        ),
      });

      if (!existingKey) {
        reply.status(404).send({
          error: 'Not found',
          message: 'API key not found',
        });
        return;
      }

      // Update API key
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (body.name !== undefined) {
        updateData.name = body.name;
      }

      if (body.isActive !== undefined) {
        updateData.isActive = body.isActive;
      }

      await db.update(apiKeys)
        .set(updateData)
        .where((keys, { eq }) => eq(keys.id, id));

      // Fetch updated key
      const updatedKey = await db.query.apiKeys.findFirst({
        where: (keys, { eq }) => eq(keys.id, id),
      });

      reply.send({
        message: 'API key updated successfully',
        apiKey: {
          id: updatedKey!.id,
          name: updatedKey!.name,
          keyPrefix: updatedKey!.keyPrefix,
          isActive: updatedKey!.isActive,
          lastUsedAt: updatedKey!.lastUsedAt?.toISOString(),
          expiresAt: updatedKey!.expiresAt?.toISOString(),
          createdAt: updatedKey!.createdAt.toISOString(),
          updatedAt: updatedKey!.updatedAt.toISOString(),
        },
      });

    } catch (error) {
      fastify.log.error(error);
      reply.status(400).send({
        error: 'Invalid request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Delete API key
  fastify.delete('/:id', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user as any;

      // Check if API key exists and belongs to user
      const existingKey = await db.query.apiKeys.findFirst({
        where: (keys, { eq, and }) => and(
          eq(keys.id, id),
          eq(keys.userId, user.userId)
        ),
      });

      if (!existingKey) {
        reply.status(404).send({
          error: 'Not found',
          message: 'API key not found',
        });
        return;
      }

      // Delete API key
      await db.delete(apiKeys).where((keys, { eq }) => eq(keys.id, id));

      reply.send({
        message: 'API key deleted successfully',
      });

    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to delete API key',
      });
    }
  });
}
