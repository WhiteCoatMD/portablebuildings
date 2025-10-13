# Multi-User Authentication Setup Guide

## Overview

This system allows multiple users to have their own isolated portable buildings websites. Each user has their own:
- Account with email/password login
- Custom settings (business name, colors, etc.)
- Building inventory management
- Image uploads
- Facebook auto-posting configuration

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@vercel/postgres` - Database connection
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens for authentication

### 2. Set Up Vercel Postgres Database

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Name it (e.g., "portable-buildings-db")
7. Choose your region
8. Click "Create"

Vercel will automatically add these environment variables to your project:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

#### Option B: Via Vercel CLI

```bash
vercel link
vercel storage create postgres portable-buildings-db
```

### 3. Add JWT Secret

Add this environment variable manually (via Vercel dashboard or `.env.local`):

```env
JWT_SECRET=your-super-secret-random-string
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run Database Schema

#### Option A: Via Vercel Dashboard

1. Go to Storage → Your Database → Query
2. Copy the contents of `db/schema.sql`
3. Paste and run in the query editor

#### Option B: Via Local Tool

If you have a Postgres client (TablePlus, pgAdmin, etc.):
1. Pull environment variables: `vercel env pull .env.local`
2. Connect using the `POSTGRES_URL` from `.env.local`
3. Run `db/schema.sql`

### 5. Deploy

```bash
git add .
git commit -m "Add multi-user authentication system"
git push origin master
```

Vercel will automatically deploy.

## User Flows

### First-Time User

1. Visit `https://your-site.vercel.app/signup.html`
2. Create account with email and password
3. Log in at `https://your-site.vercel.app/login.html`
4. Configure their site in admin panel
5. All settings are saved to their isolated database account

### Existing User

1. Visit `https://your-site.vercel.app/login.html`
2. Log in with email and password
3. Access their admin panel
4. All their settings/data are loaded from database

### Migration from localStorage (Existing Users)

For users who were using the system before authentication was added:

1. They create an account
2. On first login, show migration option
3. Click "Import My Old Data"
4. System reads localStorage and saves to their database account
5. localStorage data is backed up and can be cleared

## API Authentication

All protected API endpoints now require authentication:

### Request Format

```javascript
fetch('/api/some-endpoint', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
```

### Protected Endpoints

These endpoints now require authentication:
- `/api/upload-image` - Scoped to user's buildings
- `/api/images` - Returns only user's images
- `/api/post-to-facebook` - Uses user's Facebook config
- Any future endpoints that manage user data

## Database Schema

### Tables

1. **users** - User accounts
   - `id`, `email`, `password_hash`, `business_name`, `created_at`, `updated_at`

2. **user_settings** - Key-value settings
   - Settings like colors, carousel images, welcome message, etc.
   - Each row: `user_id`, `setting_key`, `setting_value`

3. **building_overrides** - Building status/visibility
   - Per-building settings: status (available/pending/sold), hidden flag, lot location
   - Scoped by: `user_id`, `serial_number`

4. **image_orders** - Image ordering
   - Stores custom image order for each building
   - PostgreSQL array type for URLs

5. **other_lots** - Multi-lot tracking
   - Additional GPB Sales lot configurations
   - Each user can track multiple lot locations

6. **posted_buildings** - Facebook post tracking
   - Tracks which buildings have been auto-posted
   - Prevents duplicate posts

7. **sessions** - Authentication sessions
   - JWT token storage and expiry tracking

## Security Features

✅ **Password Hashing** - bcrypt with salt rounds
✅ **JWT Tokens** - 7-day expiration
✅ **Session Management** - Database-backed sessions
✅ **SQL Injection Protection** - Parameterized queries
✅ **CORS Protection** - Configurable origins
✅ **Token Validation** - Every request verified

## Testing

### Test Account Creation

```bash
curl -X POST https://your-site.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","businessName":"Test Business"}'
```

### Test Login

```bash
curl -X POST https://your-site.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
```

Response includes token:
```json
{
  "success": true,
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test Protected Endpoint

```bash
curl https://your-site.vercel.app/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps (TODO)

- [ ] Update remaining APIs to use authentication
- [ ] Add localStorage → database migration tool
- [ ] Add password reset functionality
- [ ] Add email verification (optional)
- [ ] Add user profile management
- [ ] Add ability to change password
- [ ] Add ability to delete account

## Troubleshooting

### "Database connection failed"
- Check that Vercel Postgres is created and linked
- Verify `POSTGRES_URL` environment variable exists
- Run `vercel env pull` to sync env vars locally

### "JWT_SECRET not found"
- Add JWT_SECRET to environment variables
- Redeploy after adding

### "Table does not exist"
- Run the database schema from `db/schema.sql`
- Check database connection and permissions

## File Structure

```
/api/auth/
  ├── signup.js      # Create account
  ├── login.js       # Authenticate user
  ├── logout.js      # Invalidate session
  └── me.js          # Get current user

/lib/
  └── auth.js        # Authentication utilities

/db/
  ├── schema.sql     # Database schema
  └── README.md      # Database setup guide

login.html           # Login page
signup.html          # Signup page
```

## Support

For issues or questions, refer to:
- Vercel Postgres docs: https://vercel.com/docs/storage/vercel-postgres
- bcryptjs docs: https://github.com/dcodeIO/bcrypt.js
- jsonwebtoken docs: https://github.com/auth0/node-jsonwebtoken
