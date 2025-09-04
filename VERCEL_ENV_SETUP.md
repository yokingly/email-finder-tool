# Vercel Environment Variables Setup

## 🔧 Required Environment Variables for Vercel

Add these environment variables to your Vercel dashboard at:
**https://vercel.com/leadfields-projects/email-finder-tool/settings/environment-variables**

### **Backend Environment Variables:**

```env
# Database (Neon)
DATABASE_URL=postgresql://neondb_owner:npg_kq0DCmNrhP2G@ep-billowing-cell-add0zfx8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Redis
REDIS_URL=redis://default:Xjclga4BUIaToVpbagMRR2zuzxa1qLff@redis-12298.c81.us-east-1-2.ec2.redns.redis-cloud.com:12298

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production

# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# Frontend URL (your Vercel domain)
FRONTEND_URL=https://email-finder-tool.vercel.app

# Clerk Authentication (get from https://clerk.com)
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Optional: RapidAPI (for LinkedIn verification)
RAPIDAPI_KEY=your-rapidapi-key-here
```

### **Frontend Environment Variables:**

```env
# Clerk Authentication (get from https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Backend API URL (your Vercel backend URL)
NEXT_PUBLIC_API_URL=https://email-finder-tool-backend.vercel.app
```

## 📋 Steps to Add Environment Variables:

1. **Go to Vercel Dashboard**: https://vercel.com/leadfields-projects/email-finder-tool
2. **Click "Settings"** tab
3. **Click "Environment Variables"** in the left sidebar
4. **Add each variable** with the **"Production"** environment selected
5. **Click "Save"** after adding each variable

## 🔑 Getting Clerk API Keys:

1. **Go to Clerk Dashboard**: https://clerk.com
2. **Create a new application** or use existing one
3. **Go to "API Keys"** section
4. **Copy the keys**:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_`)
   - `CLERK_SECRET_KEY` (starts with `sk_`)
5. **For webhook secret**: Go to "Webhooks" and create a webhook endpoint

## 🚀 After Adding Environment Variables:

1. **Redeploy** your application (Vercel will auto-redeploy)
2. **Test authentication** by visiting your frontend
3. **Create your first user** by signing up
4. **Test API endpoints** with authentication

## 🔒 Security Notes:

- **Never commit** `.env` files to Git
- **Use different keys** for development and production
- **Rotate secrets** regularly
- **Monitor usage** in Clerk dashboard
