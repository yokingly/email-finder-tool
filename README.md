# Email Finder Tool

A comprehensive email finder and validation tool with pattern detection, SMTP validation, MX record analysis, and LinkedIn verification.

## Features

- **Email Pattern Generation**: Generate common, custom, and domain-specific email patterns
- **SMTP Validation**: Real-time email validation with catch-all detection
- **MX Record Analysis**: Identify email providers (Google Workspace, Microsoft 365, Zoho, etc.)
- **LinkedIn Verification**: Cross-reference emails with LinkedIn profiles via RapidAPI
- **API Key Authentication**: Secure API access with rate limiting
- **Caching**: Redis-based caching for improved performance
- **Real-time Processing**: Fast, concurrent email validation

## Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Fastify with TypeScript
- **Database**: Neon (PostgreSQL)
- **Caching**: Redis
- **Authentication**: Clerk + API Keys
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- Redis server
- Neon database account
- Clerk account
- RapidAPI account (for LinkedIn verification)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd projectA
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Backend
cd apps/backend
cp env.example .env
# Edit .env with your configuration

# Frontend
cd ../frontend
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Set up the database:
```bash
cd apps/backend
npm run db:push
```

5. Start the development servers:
```bash
# From project root
npm run dev
```

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# RapidAPI (for LinkedIn verification)
RAPIDAPI_KEY=your-rapidapi-key-here

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### API Keys

- `POST /api/api-keys` - Create API key
- `GET /api/api-keys` - List API keys
- `PATCH /api/api-keys/:id` - Update API key
- `DELETE /api/api-keys/:id` - Delete API key

### Email Operations

- `POST /api/email/find` - Find email patterns for a domain
- `POST /api/email/validate` - Validate a single email
- `GET /api/email/history/:domain` - Get validation history

## Usage Examples

### Find Email Patterns

```bash
curl -X POST http://localhost:3001/api/email/find \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ef_your_api_key_here" \
  -d '{
    "domain": "example.com",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Example Corp",
    "validateEmails": true,
    "checkLinkedIn": true
  }'
```

### Validate Single Email

```bash
curl -X POST http://localhost:3001/api/email/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ef_your_api_key_here" \
  -d '{
    "email": "john.doe@example.com",
    "validateSmtp": true,
    "checkCatchAll": true,
    "checkLinkedIn": true
  }'
```

## Database Schema

The application uses the following main tables:

- `users` - User accounts (managed by Clerk)
- `api_keys` - API key management
- `email_validations` - Cached validation results
- `email_patterns` - Pattern success rates
- `rate_limits` - Rate limiting data

## Development

### Database Migrations

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Push schema changes (development)
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Make sure to set all required environment variables in your deployment platform:

- `DATABASE_URL`
- `JWT_SECRET`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `RAPIDAPI_KEY`
- `REDIS_URL`
- `FRONTEND_URL`

## Rate Limits

- Email finding: 10 requests per minute
- Email validation: 50 requests per minute
- Other endpoints: 100 requests per minute

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
