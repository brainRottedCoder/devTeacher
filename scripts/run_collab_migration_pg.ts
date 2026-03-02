import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Supabase Connection String format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const dbUrl = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

async function runMigration() {
  if (!dbUrl) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
  }

  // NOTE: Depending on env, it might just be the Supabase REST URL, in which case we can't use `pg` directly
  // unless we have the true `DATABASE_URL`. Let's assume we have `DATABASE_URL`.
  if (dbUrl.startsWith('http')) {
      console.log('Cannot use HTTP URL for pg client. Please set DATABASE_URL in .env.local to the postgres:// connection string.');
      process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false } // Required for Supabase usually
  });

  try {
    await client.connect();
    
    const sqlPath = path.join(process.cwd(), 'database/migrations/015_collaboration_comments_versions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL...');
    await client.query(sql);
    console.log('Migration applied successfully.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
