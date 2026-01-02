# Production Setup Guide

This guide covers setting up the admin system for production deployment.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted)
- Upstash Redis account (for rate limiting)

## 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Upstash Redis (Required for production rate limiting)
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Email (Optional - for notifications)
RESEND_API_KEY="re_..."

# Next.js
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## 2. Upstash Redis Setup

Rate limiting is **critical** for production to prevent brute force attacks and API abuse.

### Step 1: Create Upstash Account
1. Go to [https://console.upstash.com](https://console.upstash.com)
2. Sign up or log in
3. Click "Create Database"

### Step 2: Configure Database
- **Name**: `getonblockchain-ratelimit` (or your preferred name)
- **Type**: Choose "Regional" for best performance
- **Region**: Select closest to your deployment region
- **Eviction**: Leave as default (allkeys-lru recommended)
- **TLS**: Enable (recommended)

### Step 3: Get Credentials
1. After creation, click on your database
2. Go to the "REST API" tab
3. Copy the following values:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Add these to your `.env` file

### Step 4: Test Connection
The app will automatically detect if Upstash is configured. Check logs:
- If configured: "Rate limiting enabled with Upstash Redis"
- If not configured: "Rate limiting disabled - using fallback"

## 3. Rate Limiting Configuration

The system includes three rate limiters:

### Login Rate Limiter
- **Limit**: 5 attempts per 15 minutes per IP
- **Purpose**: Prevent brute force login attacks
- **Route**: `/api/admin/auth/login`

### API Rate Limiter
- **Limit**: 100 requests per minute per IP
- **Purpose**: Prevent API abuse
- **Routes**: All `/api/admin/*` routes (optional)

### Upload Rate Limiter
- **Limit**: 10 uploads per minute per user
- **Purpose**: Prevent upload spam
- **Route**: `/api/admin/blog/upload-image`

## 4. Database Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create super admin (production)
npm run create-admin
```

## 5. Security Checklist

Before deploying to production:

- [ ] Set `secure: true` in cookie configuration (login route)
- [ ] Enable HTTPS on your domain
- [ ] Set strong database password
- [ ] Configure Upstash Redis rate limiting
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Review CORS settings if needed
- [ ] Enable database connection pooling
- [ ] Set up database backups
- [ ] Configure monitoring/alerting
- [ ] Review admin user permissions

## 6. Cookie Configuration

Update `/src/app/api/admin/auth/login/route.ts`:

```typescript
res.cookies.set(ADMIN_CONFIG.SESSION_COOKIE_NAME, admin.id, {
  httpOnly: true,
  secure: true, // Set to true in production
  sameSite: "lax",
  path: "/",
  maxAge: ADMIN_CONFIG.SESSION_MAX_AGE,
});
```

## 7. Deployment

### Vercel
1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy

### Other Platforms
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Ensure environment variables are set

## 8. Post-Deployment

1. Test login with rate limiting
2. Verify admin access
3. Test image upload
4. Check audit logs
5. Monitor Upstash Redis dashboard for rate limit hits

## 9. Monitoring

### Upstash Redis Dashboard
- View rate limit analytics
- Monitor request patterns
- Check for abuse attempts

### Application Logs
- Failed login attempts
- Rate limit violations
- Error rates

## 10. Troubleshooting

### Rate Limiting Not Working
- Check `UPSTASH_REDIS_REST_URL` is set correctly
- Verify `UPSTASH_REDIS_REST_TOKEN` is valid
- Check Upstash dashboard for connection errors

### Cookie Issues
- Ensure `secure: true` only in production with HTTPS
- Verify `path: "/"` is set
- Check browser console for cookie warnings

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check database is accessible from deployment server
- Enable connection pooling for production

## Support

For issues or questions:
- Check application logs
- Review Upstash Redis dashboard
- Verify environment variables are set correctly
