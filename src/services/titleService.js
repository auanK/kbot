import { openDb } from './db.js';
import * as UserService from './userService.js';

async function updateTitleHolder(sock, groupJid, titleSlug, newHolderJid) {
    if (!newHolderJid) return;

    const db = await openDb();
    const currentTitle = await db.get('SELECT * FROM titles WHERE slug = ?', [titleSlug]);

    if (!currentTitle) return;

    if (currentTitle.holder_jid !== newHolderJid) {
        await db.run('UPDATE titles SET holder_jid = ? WHERE slug = ?', [newHolderJid, titleSlug]);

        const user = await UserService.getUserByJid(newHolderJid);
        const userName = user ? (user.nick || 'Membro Desconhecido') : newHolderJid.split('@')[0];
        
        const text = `🏆*TÍTULO CONQUISTADO!*🏆\n\n` +
            `O título *${currentTitle.name}* mudou de mãos para *${userName}*\n`;

        await sock.sendMessage(groupJid, { text });
    }
}

export async function checkZuadento(sock, groupJid) {
    const db = await openDb();
    const winner = await db.get('SELECT jid FROM users WHERE msg_count > 0 ORDER BY msg_count DESC LIMIT 1');
    if (winner) await updateTitleHolder(sock, groupJid, 'zuadento', winner.jid);
}

export async function checkCoruja(sock, groupJid) {
    const currentHour = new Date().getHours();
    if (currentHour >= 6) return;

    const db = await openDb();
    const winner = await db.get(`
        SELECT jid, SUM(count) as total 
        FROM stats_hours 
        WHERE hour BETWEEN 0 AND 5
        GROUP BY jid 
        ORDER BY total DESC 
        LIMIT 1
    `);
    if (winner) await updateTitleHolder(sock, groupJid, 'coruja', winner.jid);
}

export async function getUserTitles(jid) {
    const db = await openDb();
    return db.all('SELECT name, description FROM titles WHERE holder_jid = ?', [jid]);
}