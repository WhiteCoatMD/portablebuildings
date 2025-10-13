# Database Setup Guide

## Vercel Postgres Setup

1. **Create a Postgres Database in Vercel**
   - Go to your Vercel project dashboard
   - Click "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Choose a name (e.g., "portable-buildings-db")
   - Select region (closest to your users)
   - Click "Create"

2. **Connect to Database**
   - Once created, Vercel will show you connection details
   - Click "Connect" and Vercel will automatically add env variables to your project
   - The following variables will be added:
     - `POSTGRES_URL`
     - `POSTGRES_PRISMA_URL`
     - `POSTGRES_URL_NON_POOLING`
     - `POSTGRES_USER`
     - `POSTGRES_HOST`
     - `POSTGRES_PASSWORD`
     - `POSTGRES_DATABASE`

3. **Run Schema**
   - Install Vercel CLI if you haven't: `npm i -g vercel`
   - Login: `vercel login`
   - Link project: `vercel link`
   - Run the schema:
     ```bash
     vercel env pull .env.local
     ```
   - Then connect to your database using a Postgres client (like TablePlus, pgAdmin, or psql) and run the SQL in `schema.sql`

   OR use the Vercel dashboard:
   - Go to Storage → Your Database → Query
   - Paste and run the contents of `schema.sql`

4. **Install Dependencies**
   ```bash
   npm install @vercel/postgres bcryptjs jsonwebtoken
   npm install --save-dev @types/bcryptjs @types/jsonwebtoken
   ```

## Environment Variables

Add to your `.env.local` file (or Vercel project settings):

```env
# Added automatically by Vercel when you create the database
POSTGRES_URL="your-connection-string"

# Add this manually for JWT authentication
JWT_SECRET="your-super-secret-random-string-here"
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Testing Database Connection

Create a test file `test-db.js`:
```javascript
const { sql } = require('@vercel/postgres');

async function testConnection() {
  const result = await sql`SELECT NOW()`;
  console.log('Database connected:', result.rows[0]);
}

testConnection();
```

Run: `node test-db.js`

## Migration from localStorage

After users log in for the first time, they can optionally import their localStorage data:
- The system will provide an import button
- Reads localStorage data and saves to their database account
- One-time migration per user
