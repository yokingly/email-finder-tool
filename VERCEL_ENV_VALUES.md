# 🚀 Vercel Environment Variables - Copy These Values

## **Backend Environment Variables**

Copy these exact values to your Vercel dashboard at:
**https://vercel.com/leadfields-projects/email-finder-tool/settings/environment-variables**

### **Required Variables:**

```env
DATABASE_URL=postgresql://neondb_owner:npg_kq0DCmNrhP2G@ep-billowing-cell-add0zfx8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

REDIS_URL=redis://default:Xjclga4BUIaToVpbagMRR2zuzxa1qLff@redis-12298.c81.us-east-1-2.ec2.redns.redis-cloud.com:12298

JWT_SECRET=c451fd78b3e3106afb7047de3400bdd28e6012eefaf447a6abacd3d7a6ed39c1c0113052587f2aa0d8075712a1c17c4738daf6d3b4923d191b67739c27e3ddbd

NODE_ENV=production

PORT=3001

HOST=0.0.0.0

LOG_LEVEL=info

FRONTEND_URL=https://email-finder-tool.vercel.app
```

### **Clerk Variables (you have these):**
```env
CLERK_PUBLISHABLE_KEY=pk_test_... (your value)
CLERK_SECRET_KEY=sk_test_... (your value)
```

### **Optional (add later if needed):**
```env
CLERK_WEBHOOK_SECRET=whsec_... (optional)
RAPIDAPI_KEY=your-rapidapi-key-here (optional)
```

---

## **Frontend Environment Variables**

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... (your value)
CLERK_SECRET_KEY=sk_test_... (your value)
NEXT_PUBLIC_API_URL=https://email-finder-tool.vercel.app
```

---

## 📋 **Quick Setup Steps:**

1. **Go to**: https://vercel.com/leadfields-projects/email-finder-tool/settings/environment-variables
2. **Click "Add New"** for each variable above
3. **Set Environment**: Production
4. **Copy & Paste** the values exactly as shown
5. **Click "Save"** after each variable
6. **Redeploy** (Vercel will auto-redeploy)

---

## 🧪 **After Deployment - Test These URLs:**

- **Frontend**: https://email-finder-tool.vercel.app
- **API Health**: https://email-finder-tool.vercel.app/api/health
- **Email Find**: https://email-finder-tool.vercel.app/api/email/find
- **Email Validate**: https://email-finder-tool.vercel.app/api/email/validate

---

## 🔍 **What JWT_SECRET is for:**
The JWT_SECRET is used for:
- **API Key Authentication**: Securing your API endpoints
- **Session Management**: Managing user sessions
- **Token Signing**: Creating secure tokens for API access
- **Rate Limiting**: Tracking user requests securely

**It's essential for API security - don't skip this one!**
