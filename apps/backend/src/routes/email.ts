import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { EmailPatternService } from '../services/emailPatterns';
import { EmailValidationService } from '../services/emailValidation';
import { LinkedInVerificationService } from '../services/linkedinVerification';
import { db } from '../config/database';
import { emailValidations } from '../config/schema';
import { nanoid } from 'nanoid';
import { apiKeyAuth, rateLimitMiddleware, AuthenticatedRequest } from '../middleware/apiKeyAuth';
import { cacheService } from '../services/cache';

const EmailFindRequest = z.object({
  domain: z.string().email().transform(email => email.split('@')[1]),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  companyName: z.string().optional(),
  customPatterns: z.array(z.string()).optional(),
  validateEmails: z.boolean().default(true),
  checkLinkedIn: z.boolean().default(false),
  timeout: z.number().min(1000).max(30000).default(5000),
});

const EmailValidateRequest = z.object({
  email: z.string().email(),
  validateSmtp: z.boolean().default(true),
  checkCatchAll: z.boolean().default(true),
  checkLinkedIn: z.boolean().default(false),
  timeout: z.number().min(1000).max(30000).default(5000),
});

export async function emailRoutes(fastify: FastifyInstance) {
  const patternService = new EmailPatternService();
  const validationService = new EmailValidationService();
  const linkedinService = new LinkedInVerificationService();

  // Find email patterns for a domain
  fastify.post('/find', {
    preHandler: [apiKeyAuth, rateLimitMiddleware],
    schema: {
      body: EmailFindRequest,
      response: {
        200: {
          type: 'object',
          properties: {
            domain: { type: 'string' },
            patterns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pattern: { type: 'string' },
                  type: { type: 'string' },
                  confidence: { type: 'number' },
                  example: { type: 'string' },
                  validation: {
                    type: 'object',
                    properties: {
                      isValid: { type: 'boolean' },
                      isCatchAll: { type: 'boolean' },
                      mxRecords: { type: 'array' },
                      mxProvider: { type: 'string' },
                      confidence: { type: 'number' },
                      linkedinVerified: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const body = EmailFindRequest.parse(request.body);
      const { domain, firstName, lastName, companyName, customPatterns, validateEmails, checkLinkedIn, timeout } = body;

      // Generate email patterns
      const patterns = patternService.generatePatterns({
        domain,
        firstName,
        lastName,
        companyName,
        customPatterns,
      });

      // Validate emails if requested
      const results = await Promise.allSettled(
        patterns.map(async (pattern) => {
          const result = { ...pattern, validation: null };

          if (validateEmails) {
            const validation = await validationService.validateEmail({
              email: pattern.example,
              validateSmtp: true,
              checkCatchAll: true,
              timeout,
            });

            // Check LinkedIn if requested
            if (checkLinkedIn && validation.isValid) {
              const linkedinResult = await linkedinService.verifyProfile({
                email: pattern.example,
                firstName,
                lastName,
                company: companyName,
              });

              validation.linkedinVerified = linkedinResult.verified;
              if (linkedinResult.verified) {
                validation.confidence += 15;
              }
            }

            // Cache the validation result
            await db.insert(emailValidations).values({
              id: nanoid(),
              email: pattern.example,
              domain,
              isValid: validation.isValid,
              isCatchAll: validation.isCatchAll,
              mxRecords: validation.mxRecords.map(r => r.exchange),
              mxProvider: validation.mxProvider,
              smtpResponse: validation.smtpResponse,
              validationMethod: validation.validationMethod,
              confidence: validation.confidence,
              linkedinVerified: validation.linkedinVerified,
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            });

            result.validation = validation;
          }

          return result;
        })
      );

      const processedResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            ...patterns[index],
            validation: {
              isValid: false,
              isCatchAll: false,
              mxRecords: [],
              confidence: 0,
              errors: [result.reason?.message || 'Validation failed'],
            },
          };
        }
      });

      return {
        domain,
        patterns: processedResults,
      };

    } catch (error) {
      fastify.log.error(error);
      reply.status(400).send({
        error: 'Invalid request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Validate a single email
  fastify.post('/validate', {
    preHandler: [apiKeyAuth, rateLimitMiddleware],
    schema: {
      body: EmailValidateRequest,
      response: {
        200: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            isValid: { type: 'boolean' },
            isCatchAll: { type: 'boolean' },
            mxRecords: { type: 'array' },
            mxProvider: { type: 'string' },
            smtpResponse: { type: 'string' },
            validationMethod: { type: 'string' },
            confidence: { type: 'number' },
            linkedinVerified: { type: 'boolean' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const body = EmailValidateRequest.parse(request.body);
      const { email, validateSmtp, checkCatchAll, checkLinkedIn, timeout } = body;

      // Check cache first
      const cached = await db.query.emailValidations.findFirst({
        where: (validations, { eq, and, gt }) => and(
          eq(validations.email, email),
          gt(validations.expiresAt, new Date())
        ),
      });

      if (cached) {
        return {
          email: cached.email,
          isValid: cached.isValid,
          isCatchAll: cached.isCatchAll,
          mxRecords: cached.mxRecords || [],
          mxProvider: cached.mxProvider,
          smtpResponse: cached.smtpResponse,
          validationMethod: cached.validationMethod,
          confidence: cached.confidence,
          linkedinVerified: cached.linkedinVerified,
        };
      }

      // Perform validation
      const validation = await validationService.validateEmail({
        email,
        validateSmtp,
        checkCatchAll,
        timeout,
      });

      // Check LinkedIn if requested
      if (checkLinkedIn && validation.isValid) {
        const linkedinResult = await linkedinService.verifyProfile({
          email,
        });

        validation.linkedinVerified = linkedinResult.verified;
        if (linkedinResult.verified) {
          validation.confidence += 15;
        }
      }

      // Cache the result
      await db.insert(emailValidations).values({
        id: nanoid(),
        email,
        domain: email.split('@')[1],
        isValid: validation.isValid,
        isCatchAll: validation.isCatchAll,
        mxRecords: validation.mxRecords.map(r => r.exchange),
        mxProvider: validation.mxProvider,
        smtpResponse: validation.smtpResponse,
        validationMethod: validation.validationMethod,
        confidence: validation.confidence,
        linkedinVerified: validation.linkedinVerified,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      return validation;

    } catch (error) {
      fastify.log.error(error);
      reply.status(400).send({
        error: 'Invalid request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get validation history for a domain
  fastify.get('/history/:domain', {
    schema: {
      params: {
        type: 'object',
        properties: {
          domain: { type: 'string' },
        },
        required: ['domain'],
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { domain } = request.params as { domain: string };
      const { limit, offset } = request.query as { limit: number; offset: number };

      const validations = await db.query.emailValidations.findMany({
        where: (validations, { eq }) => eq(validations.domain, domain),
        limit,
        offset,
        orderBy: (validations, { desc }) => [desc(validations.createdAt)],
      });

      return {
        domain,
        validations,
        total: validations.length,
      };

    } catch (error) {
      fastify.log.error(error);
      reply.status(400).send({
        error: 'Invalid request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
