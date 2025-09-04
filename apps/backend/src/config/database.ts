import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Create the connection
const sql = neon(process.env.DATABASE_URL!);

// Create the database instance
export const db = drizzle(sql, { schema });

export type Database = typeof db;
