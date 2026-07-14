#!/usr/bin/env node

/**
 * Setup script for Lyrtic database schema
 * Runs: node scripts/setup-schema.js
 */

import {Pool} from "pg"
import {Signer} from "@aws-sdk/rds-signer"
import {awsCredentialsProvider} from "@vercel/functions/oidc"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function setupSchema() {
  const signer = new Signer({
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN,
      clientConfig: { region: process.env.AWS_REGION },
    }),
    region: process.env.AWS_REGION,
    hostname: process.env.PGHOST,
    username: process.env.PGUSER || 'postgres',
    port: 5432,
  });

  const pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE || 'postgres',
    port: 5432,
    user: process.env.PGUSER || 'postgres',
    password: () => signer.getAuthToken(),
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔗 Connecting to Aurora PostgreSQL...');
    const conn = await pool.connect();
    console.log('✅ Connected successfully');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '001-setup-lyrtic-schema.sql');
    console.log(`📋 Reading ${schemaPath}...`)
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('🚀 Executing core schema setup...');
    await conn.query(schema);
    console.log('✅ Core schema completed.');

    const migrationPath = path.join(__dirname, '002-add-customers-unique-constraint.sql');
    if (fs.existsSync(migrationPath)) {
      console.log(`📋 Reading ${migrationPath}...`);
      const migration = fs.readFileSync(migrationPath, 'utf-8');
      
      console.log('🚀 Executing unique constraints migration...');
      await conn.query(migration);
      console.log('✅ Constraints migration completed.');
    }

    console.log('🎉 Database setup completed successfully!');

    conn.release();
  } catch (error) {
    console.error('❌ Error during schema setup:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupSchema();
