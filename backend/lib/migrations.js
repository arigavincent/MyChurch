const { readdir, readFile } = require('node:fs/promises');
const path = require('node:path');
const { pool } = require('./db');

async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const alreadyApplied = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      );

      if (alreadyApplied.rowCount > 0) {
        continue;
      }

      const sql = await readFile(path.join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
  }
}

module.exports = {
  runMigrations,
};
