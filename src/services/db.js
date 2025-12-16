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
      type TEXT NOT NULL,
      cron TEXT NOT NULL, 
      target_jid TEXT NOT NULL,
      payload TEXT,       
      name TEXT,            
      active INTEGER DEFAULT 1
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      jid TEXT PRIMARY KEY,
      nick TEXT UNIQUE NOT NULL,
      description TEXT,
      msg_count INTEGER DEFAULT 0
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS message_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jid TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);

  await db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON message_logs(timestamp);`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_jid ON message_logs(jid);`);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS titles (
      slug TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      holder_jid TEXT
    )
  `);

  await db.run(`INSERT OR IGNORE INTO titles (slug, name, description) VALUES ('zuadento', '📢 O Zuadento', 'O membro que mais fala no grupo'),('coruja', '🦉 Coruja da Noite', 'Quem mais fala de madrugada (00h-06h)')`);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS stats_days (
      jid TEXT NOT NULL,
      day INTEGER NOT NULL,
      count INTEGER DEFAULT 0,
      PRIMARY KEY (jid, day))
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS stats_hours (
      jid TEXT NOT NULL,
      hour INTEGER NOT NULL,
      count INTEGER DEFAULT 0,
      PRIMARY KEY (jid, hour)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS stats_day_hours (
    jid TEXT NOT NULL,
    day INTEGER NOT NULL,
    hour INTEGER NOT NULL,
    count INTEGER DEFAULT 0,
    PRIMARY KEY (jid, day, hour)
    )
  `);

  console.log('Banco de dados inicializado.');
}

export async function logMessage(jid, pushName) {
  const db = await openDb();
  let user = await db.get('SELECT 1 FROM users WHERE jid = ?', [jid]);

  if (!user) {
    try {
      await db.run('INSERT INTO users (jid, nick, description, msg_count) VALUES (?, ?, ?, 0)', [jid, pushName, 'Sem descrição']);
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        const fallbackNick = `${pushName}#${jid.substring(0, 4)}`;
        try {
          await db.run('INSERT INTO users (jid, nick, description, msg_count) VALUES (?, ?, ?, 0)', [jid, fallbackNick, 'Sem descrição']);
        } catch (e2) {
          console.error('Falha crítica ao auto-registrar usuário:', e2);
          return; 
        }
      } else {
        console.error('Erro ao criar usuário auto:', error);
        return;
      }
    }
  }

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  await db.exec('BEGIN TRANSACTION');

  try {
    await db.run('INSERT INTO message_logs (jid, timestamp) VALUES (?, ?)', [jid, Date.now()]);
    await db.run('UPDATE users SET msg_count = msg_count + 1 WHERE jid = ?', [jid]);

    await db.run(`INSERT INTO stats_days (jid, day, count) VALUES (?, ?, 1) ON CONFLICT(jid, day) DO UPDATE SET count = count + 1`, [jid, day]);
    await db.run(`INSERT INTO stats_hours (jid, hour, count) VALUES (?, ?, 1) ON CONFLICT(jid, hour) DO UPDATE SET count = count + 1`, [jid, hour]);
    await db.run(`INSERT INTO stats_day_hours (jid, day, hour, count) VALUES (?, ?, ?, 1) ON CONFLICT(jid, day, hour) DO UPDATE SET count = count + 1`, [jid, day, hour]);

    await db.exec('COMMIT');
  } catch (error) {
    console.error('Erro logMessage:', error);
    await db.exec('ROLLBACK');
  }
}