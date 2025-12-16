import { openDb } from './db.js';

export async function getWeeklyChampions() {
    const db = await openDb();
    const query = `
        SELECT sd.day, sd.jid, u.nick, sd.count as total
        FROM stats_days sd
        LEFT JOIN users u ON sd.jid = u.jid
        ORDER BY sd.day ASC, total DESC
    `;
    return db.all(query);
}

export async function getHourlyChampions() {
    const db = await openDb();
    const query = `
        SELECT sh.hour, sh.jid, u.nick, sh.count as total
        FROM stats_hours sh
        LEFT JOIN users u ON sh.jid = u.jid
        ORDER BY sh.hour ASC, total DESC
    `;
    return db.all(query);
}

export async function getTodayActivity() {
    const db = await openDb();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const query = `
        SELECT strftime('%H', datetime(timestamp/1000, 'unixepoch', 'localtime')) as hour,
        l.jid, u.nick, COUNT(*) as total
        FROM message_logs l
        LEFT JOIN users u ON l.jid = u.jid
        WHERE timestamp >= ?
        GROUP BY hour, l.jid
        ORDER BY hour ASC, total DESC
    `;
    return db.all(query, [startOfDay.getTime()]);
}

export async function getUserTotal(jid) {
    const db = await openDb();
    const result = await db.get('SELECT msg_count FROM users WHERE jid = ?', [jid]);
    return result ? result.msg_count : 0;
}

export async function getGlobalRanking(limit = 10) {
    const db = await openDb();
    return db.all(`SELECT jid, nick, msg_count as total FROM users ORDER BY msg_count DESC LIMIT ?`, [limit]);
}

export async function getUserTopDay(jid) {
    const db = await openDb();
    return db.get('SELECT day, count as total FROM stats_days WHERE jid = ? ORDER BY count DESC LIMIT 1', [jid]);
}

export async function getUserTopHour(jid) {
    const db = await openDb();
    return db.get('SELECT hour, count as total FROM stats_hours WHERE jid = ? ORDER BY count DESC LIMIT 1', [jid]);
}

export async function getUserTopDayHour(jid) {
    const db = await openDb();
    return db.get('SELECT day, hour, count as total FROM stats_day_hours WHERE jid = ? ORDER BY count DESC LIMIT 1', [jid]);
}
