import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const RegisterRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register user
  fastify.post('/register', {
    schema: {
      body: RegisterRequest,
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = RegisterRequest.parse(request.body);
      
      // In a real implementation, you would:
      // 1. Hash the password
      // 2. Check if user already exists
      // 3. Create user in database
      // 4. Generate JWT token
      
      // For now, return a mock response
      reply.status(201).send({
        message: 'User registered successfully',
        user: {
          id: 'user_123',
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
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

  // Login user
  fastify.post('/login', {
    schema: {
      body: LoginRequest,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = LoginRequest.parse(request.body);
      
      // In a real implementation, you would:
      // 1. Find user by email
      // 2. Verify password
      // 3. Generate JWT token
      
      // For now, return a mock response
      const token = fastify.jwt.sign({ 
        userId: 'user_123',
        email: body.email,
      });

      reply.send({
        message: 'Login successful',
        token,
        user: {
          id: 'user_123',
          email: body.email,
          firstName: 'John',
          lastName: 'Doe',
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

  // Get current user
  fastify.get('/me', {
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
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user;
      
      // In a real implementation, you would fetch user from database
      reply.send({
        user: {
          id: user.userId,
          email: user.email,
          firstName: 'John',
          lastName: 'Doe',
        },
      });

    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to get user information',
      });
    }
  });

  // Logout user
  fastify.post('/logout', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // In a real implementation, you would:
      // 1. Add token to blacklist
      // 2. Clear any server-side sessions
      
      reply.send({
        message: 'Logout successful',
      });

    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to logout',
      });
    }
  });
}
