import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function openDb() {
  return open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
  });
}

export async function initDb() {
  const db = await openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS schedulers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,       -- e.g., 'message_text'
      cron TEXT NOT NULL,       -- e.g., '00 08 * * *'
      target_jid TEXT NOT NULL, -- WhatsApp ID (JID)
      payload TEXT,             -- JSON String (Array of messages)
      name TEXT,                -- Display name
      active INTEGER DEFAULT 1
    )
  `);

  console.log('Banco de dados inicializado.');
}