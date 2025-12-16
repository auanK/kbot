import { openDb } from './db.js';


export async function createUser(jid, nick, description) {
    const db = await openDb();
    return db.run('INSERT INTO users (jid, nick, description, msg_count) VALUES (?, ?, ?, 0)', [jid, nick, description]);
}

export async function updateUserField(jid, field, value) {
    const db = await openDb();
    const allowedFields = ['nick', 'description'];

    if (!allowedFields.includes(field)) {
        throw new Error(`Campo inválido: ${field}`);
    }

    return db.run(`UPDATE users SET ${field} = ? WHERE jid = ?`, [value, jid]);
}

export async function getUserByJid(jid) {
    const db = await openDb();
    return db.get('SELECT * FROM users WHERE jid = ?', [jid]);
}

export async function getUserByNick(nick) {
    const db = await openDb();
    return db.get('SELECT * FROM users WHERE nick = ? COLLATE NOCASE', [nick]);
}