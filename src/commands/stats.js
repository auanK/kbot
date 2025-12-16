import * as StatsService from '../services/statsService.js';
import * as UserService from '../services/userService.js';

export default {
    name: 'stats',
    async run({ sock, msg, args }) {
        const jid = msg.key.remoteJid;
        if (args.length === 0) {
            return viewSelfStats(sock, msg, jid);
        }

        const subCommand = args[0].toLowerCase();
        switch (subCommand) {
            case 'week':
                return viewWeekStats(sock, msg, jid);
            case 'hour':
                return viewHourStats(sock, msg, jid);
            case 'today':
                return viewTodayStats(sock, msg, jid);
            case 'rank':
                return viewGeneralRanking(sock, msg, jid);
            default:
                return viewTargetUserStats(sock, msg, args, jid);
        }
    },
};

const getSender = (msg) => msg.key.participant || msg.participant || msg.key.remoteJid;
const formatName = (row) => row.nick || row.jid.split('@')[0];

async function viewSelfStats(sock, msg, jid) {
    const senderJid = getSender(msg);
    try {
        const total = await StatsService.getUserTotal(senderJid);
        return sock.sendMessage(jid, { text: `*Suas Estatísticas*\n\nTotal: *${total}*` }, { quoted: msg });
    } catch (err) {
        return sock.sendMessage(jid, { text: '❌ Erro ao buscar estatísticas.' }, { quoted: msg });
    }
}

async function viewWeekStats(sock, msg, jid) {
    try {
        const weekData = await StatsService.getWeeklyChampions();
        const responseText = formatWeekStats(weekData);
        return sock.sendMessage(jid, { text: responseText }, { quoted: msg });
    } catch (error) {
        console.error(error);
        return sock.sendMessage(jid, { text: '❌ Erro interno.' }, { quoted: msg });
    }
}

async function viewHourStats(sock, msg, jid) {
    try {
        const hourData = await StatsService.getHourlyChampions();
        const responseText = formatHourStats(hourData);
        return sock.sendMessage(jid, { text: responseText }, { quoted: msg });
    } catch (error) {
        console.error(error);
        return sock.sendMessage(jid, { text: '❌ Erro interno.' }, { quoted: msg });
    }
}

async function viewTodayStats(sock, msg, jid) {
    try {
        const todayData = await StatsService.getTodayActivity();
        const responseText = formatHourStats(todayData, `HOJE (${new Date().toLocaleDateString()})`);
        return sock.sendMessage(jid, { text: responseText }, { quoted: msg });
    } catch (error) {
        console.error(error);
        return sock.sendMessage(jid, { text: '❌ Erro interno.' }, { quoted: msg });
    }
}

async function viewGeneralRanking(sock, msg, jid) {
    try {
        const rankingData = await StatsService.getGlobalRanking();

        const responseText = formatGeneralRanking(rankingData);
        return sock.sendMessage(jid, { text: responseText }, { quoted: msg });
    } catch (error) {
        console.error(error);
        return sock.sendMessage(jid, { text: '❌ Erro ao buscar o ranking.' }, { quoted: msg });
    }
}

async function viewTargetUserStats(sock, msg, args, jid) {
    const targetNick = args[0];
    try {
        const user = await UserService.getUserByNick(targetNick);
        if (user) {
            const total = await StatsService.getUserTotal(user.jid);
            return sock.sendMessage(jid, { text: `📊 *${user.nick}*: ${total} mensagens.` }, { quoted: msg });
        } else {
            return sock.sendMessage(jid, { text: '❌ Opção inválida ou usuário não encontrado.' }, { quoted: msg });
        }
    } catch (error) {
        console.error(error);
        return sock.sendMessage(jid, { text: '❌ Erro interno.' }, { quoted: msg });
    }
}

function formatGeneralRanking(rows) {
    if (!rows || rows.length === 0) return "❌ *Sem dados de ranking no momento.*";

    let text = `🏆 *RANKING GERAL DE MENSAGENS*\n\n`;

    const top = rows.slice(0, 10);

    top.forEach((row, index) => {
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        else medal = `${index + 1}º`;

        text += `${medal} *${formatName(row)}*: ${row.total}\n`;
    });

    return text;
}

function formatWeekStats(rows) {
    const daysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    let text = `📅 *ESTATÍSTICAS POR DIA DA SEMANA*\n\n`;
    let hasData = false;

    for (let i = 0; i < 7; i++) {
        const winner = rows.find(r => parseInt(r.day) === i);
        const name = winner ? formatName(winner) : '---';
        const count = winner ? winner.total : 0;
        text += `▫️ *${daysMap[i]}:* ${name} (${count})\n`;
        if (winner) hasData = true;
    }

    if (!hasData) text += "\n_Sem dados._";
    return text;
}

function formatHourStats(rows, title = 'ESTATÍSTICAS POR HORÁRIO (GERAL)') {
    let text = `⏰ *${title}*\n\n`;
    const hoursFound = new Set();

    for (let i = 0; i < 24; i++) {
        const hourStr = i.toString().padStart(2, '0');
        const winner = rows.find(r => r.hour === i || r.hour === hourStr);

        if (winner) {
            hoursFound.add(hourStr);
            text += `🕐 *${hourStr}h:* ${formatName(winner)} (${winner.total})\n`;
        }
    }

    if (hoursFound.size === 0) text += "_Sem dados._";
    return text;
}