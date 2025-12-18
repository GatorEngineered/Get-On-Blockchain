# PostgreSQL Migration Guide

 

This guide walks you through migrating from SQLite (development) to PostgreSQL (production).

 

## Why PostgreSQL?

 

- **Production-ready**: Built for high concurrency and large datasets

- **ACID compliance**: Better data integrity guarantees

- **JSON support**: Native support for JSON columns (used in Event metadata)

- **Scalability**: Handles millions of records efficiently

- **Managed hosting**: Available on Vercel, Supabase, Railway, Neon, etc.

 

## Prerequisites

 

1. A PostgreSQL database instance (see "Database Providers" below)

2. Database connection string in this format:

   ```

   postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public

   ```

 

## Database Providers

 

Choose one of these PostgreSQL hosting services:

 

### Vercel Postgres (Recommended for Vercel deployments)

- **Pros**: Seamless Vercel integration, automatic connection pooling

- **Setup**: Visit [Vercel Dashboard](https://vercel.com/dashboard) → Storage → Create Database

- **Pricing**: Free tier available (60 hours compute time)

- **Docs**: https://vercel.com/docs/storage/vercel-postgres

 

### Supabase

- **Pros**: Free tier includes 500MB database, built-in auth

- **Setup**: Visit [Supabase](https://supabase.com) → New Project

- **Pricing**: Free tier available (up to 500MB)

- **Connection string**: Found in Settings → Database → Connection String

 

### Railway

- **Pros**: Simple setup, generous free tier

- **Setup**: Visit [Railway](https://railway.app) → New Project → Add PostgreSQL

- **Pricing**: $5/month credit on free tier

- **Connection string**: Automatically added to environment variables

 

### Neon

- **Pros**: Serverless PostgreSQL, instant branching

- **Setup**: Visit [Neon](https://neon.tech) → Create Project

- **Pricing**: Free tier available

- **Connection string**: Found in Connection Details

 

## Migration Steps

 

### Step 1: Update Prisma Schema

 

Edit `prisma/schema.prisma`:

 

```prisma

datasource db {

  provider = "postgresql"  // Change from "sqlite"

  url      = env("DATABASE_URL")

}

```

 

### Step 2: Set Environment Variable

 

Add your PostgreSQL connection string to `.env`:

 

```bash

DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

```

 

**Important**:

- Never commit this to git!

- For Vercel deployments, add this in: Dashboard → Project → Settings → Environment Variables

 

### Step 3: Generate New Migration

 

```bash

# Generate a new migration for PostgreSQL

npx prisma migrate dev --name init_postgresql

 

# This creates a new migration in prisma/migrations/

```

 

**Note**: This creates a fresh migration for PostgreSQL. Your SQLite data will NOT be automatically migrated.

 

### Step 4: Apply Migration to Production

 

```bash

# Deploy migration to production database

npx prisma migrate deploy

 

# Generate Prisma Client

npx prisma generate

```

 

### Step 5: Verify Database Connection

 

```bash

# Open Prisma Studio to verify tables were created

npx prisma studio

 

# Or run a simple query

npx prisma db execute --stdin <<< "SELECT current_database();"

```

 

## Data Migration (Optional)

 

If you need to migrate data from SQLite to PostgreSQL:

 

### Option 1: Manual Export/Import (Recommended for small datasets)

 

```bash

# 1. Export data from SQLite

npx prisma db execute --schema=prisma/schema.prisma --stdin <<< "

SELECT * FROM Merchant;

" > merchants.json

 

# 2. Write a migration script to import into PostgreSQL

# See scripts/migrate-data.ts for template

```

 

### Option 2: Use a Migration Script

 

Create `scripts/migrate-sqlite-to-postgresql.ts`:

 

```typescript

import { PrismaClient as SQLiteClient } from '@prisma/client'

import { PrismaClient as PostgresClient } from '@prisma/client'

 

// Configure clients with different DATABASE_URL values

const sqliteDb = new SQLiteClient({

  datasources: { db: { url: 'file:./dev.db' } }

})

 

const postgresDb = new PostgresClient({

  datasources: { db: { url: process.env.POSTGRES_URL } }

})

 

async function migrate() {

  console.log('Starting data migration...')

 

  // Migrate Merchants

  const merchants = await sqliteDb.merchant.findMany()

  for (const merchant of merchants) {

    await postgresDb.merchant.create({ data: merchant })

  }

  console.log(`Migrated ${merchants.length} merchants`)

 

  // Migrate Members

  const members = await sqliteDb.member.findMany()

  for (const member of members) {

    await postgresDb.member.create({ data: member })

  }

  console.log(`Migrated ${members.length} members`)

 

  // Continue for other tables...

 

  await sqliteDb.$disconnect()

  await postgresDb.$disconnect()

  console.log('Migration complete!')

}

 

migrate().catch(console.error)

```

 

Run with:

```bash

POSTGRES_URL="postgresql://..." npx tsx scripts/migrate-sqlite-to-postgresql.ts

```

 

## Schema Differences: SQLite vs PostgreSQL

 

Some Prisma features work differently between databases:

 

### Auto-incrementing IDs

- **SQLite**: Uses `@default(autoincrement())`

- **PostgreSQL**: Uses `@default(autoincrement())` or `@default(sequence())`

- **Our schema**: Uses `@default(cuid())` (works on both!)

 

### JSON Fields

- **SQLite**: Limited JSON support

- **PostgreSQL**: Native JSONB type with indexing

- **Our schema**: Uses `Json?` type (works on both)

 

### Full-Text Search

- **SQLite**: Basic LIKE queries

- **PostgreSQL**: Powerful full-text search with `@@` operator

- Consider adding indexes for better search performance

 

### Case Sensitivity

- **SQLite**: Case-insensitive by default

- **PostgreSQL**: Case-sensitive by default

- Use `.toLowerCase()` in your app code for consistent behavior

 

## Environment Variables for Deployment

 

### Vercel

 

Add these environment variables in Vercel Dashboard:

 

```bash

DATABASE_URL="postgresql://..." # From Vercel Postgres

RESEND_API_KEY="re_..."

ENCRYPTION_KEY="..."  # Generate with: openssl rand -hex 32

CRON_SECRET="..."     # Generate with: openssl rand -hex 32

NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="..."

FROM_EMAIL="noreply@yourdomain.com"

NODE_ENV="production"

```

 

### Railway

 

Railway automatically injects `DATABASE_URL` when you add PostgreSQL. Add other variables:

 

```bash

RESEND_API_KEY="re_..."

ENCRYPTION_KEY="..."

# ... (other variables)

```

 

## Post-Migration Checklist

 

- [ ] PostgreSQL database created and accessible

- [ ] `DATABASE_URL` environment variable set

- [ ] Prisma schema updated to use `postgresql` provider

- [ ] Migration applied: `npx prisma migrate deploy`

- [ ] Prisma Client regenerated: `npx prisma generate`

- [ ] Environment variables configured in hosting platform

- [ ] Test database connection: `npx prisma studio`

- [ ] Create first merchant account via `/api/signup`

- [ ] Test magic link authentication

- [ ] Test payout flow (if Premium plan)

- [ ] Verify email notifications work

 

## Connection Pooling (Important for Production)

 

PostgreSQL has connection limits. Use connection pooling for serverless deployments:

 

### Vercel Postgres (Built-in)

Automatically handles connection pooling.

 

### Supabase (PgBouncer)

Use the "Connection Pooling" URL from Supabase dashboard:

```

postgresql://user:pass@host:6543/db?pgbouncer=true

```

 

### Prisma Data Proxy (Alternative)

For other providers, consider [Prisma Data Proxy](https://www.prisma.io/data-platform):

```bash

npx prisma generate --data-proxy

```

 

## Troubleshooting

 

### "Too many connections" error

**Solution**: Use connection pooling or reduce `connection_limit` in DATABASE_URL:

```

postgresql://user:pass@host:5432/db?connection_limit=5

```

 

### Migration fails with "relation already exists"

**Solution**: Reset the database (⚠️ destroys all data):

```bash

npx prisma migrate reset

```

 

### SSL certificate errors

**Solution**: Add `?sslmode=require` to DATABASE_URL:

```

postgresql://user:pass@host:5432/db?sslmode=require

```

 

### Prisma Client errors after migration

**Solution**: Regenerate the client:

```bash

npx prisma generate

# For Next.js, may need to restart dev server

npm run dev

```

 

## Backup Strategy

 

Set up automated backups:

 

### Vercel Postgres

- Automatic daily backups included

- Point-in-time recovery available on Pro plan

 

### Supabase

- Automatic daily backups on Pro plan

- Manual backups via Dashboard → Database → Backups

 

### Manual Backup

```bash

# Create a backup

pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

 

# Restore from backup

psql $DATABASE_URL < backup_20250115.sql

```

 

## Performance Optimization

 

### Add Indexes for Common Queries

 

```sql

-- Index for member email lookups (login)

CREATE INDEX idx_member_email ON "Member"(email);

 

-- Index for login token verification

CREATE INDEX idx_login_token ON "MemberLoginToken"(token);

 

-- Index for business member lookups

CREATE INDEX idx_business_member ON "BusinessMember"(businessId, memberId);

 

-- Index for transaction history

CREATE INDEX idx_transactions ON "RewardTransaction"(memberId, createdAt DESC);

```

 

Add to a new migration:

```bash

npx prisma migrate dev --name add_indexes

```

 

### Monitor Query Performance

 

Use `EXPLAIN ANALYZE` in production:

```sql

EXPLAIN ANALYZE

SELECT * FROM "Member" WHERE email = 'user@example.com';

```

 

## Next Steps

 

After successful migration:

 

1. **Set up Redis** for rate limiting (see `REDIS_SETUP.md`)

2. **Configure Sentry** for error monitoring (see `SENTRY_SETUP.md`)

3. **Test on staging** before deploying to production

4. **Monitor performance** using your hosting provider's dashboard

5. **Set up alerts** for database connection issues

 

## Resources

 

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don't_Do_This)

- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)

- [Supabase Database Docs](https://supabase.com/docs/guides/database)

 

---

 

Need help? Check the troubleshooting section or open an issue on GitHub.

 