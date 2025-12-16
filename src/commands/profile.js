import * as UserService from '../services/userService.js';
import * as TitleService from '../services/titleService.js';
import * as StatsService from '../services/statsService.js';

export default {
    name: 'profile',
    async run({ sock, msg, args }) {
        const jid = msg.key.remoteJid;
        if (args.length === 0) {
            return viewProfile(sock, msg, args, jid);
        }

        const subCommand = args[0].toLowerCase();
        switch (subCommand) {
            case 'register':
                return registerUser(sock, msg, args.slice(1), jid);
            case 'set':
                return updateUser(sock, msg, args.slice(1), jid);
            default:
                return viewProfile(sock, msg, args, jid);
        }
    },
};

const getSender = (msg) => msg.key.participant || msg.participant || msg.key.remoteJid;
const cleanString = (str) => str ? str.replace(/^["']|["']$/g, '') : '';
const daysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

async function registerUser(sock, msg, args, jid) {
    const senderJid = getSender(msg);
    if (!jid.endsWith('@g.us')) return;

    if (args.length < 2) {
        return sock.sendMessage(jid, { text: 'Use: *!profile register <nick> <desc>*' }, { quoted: msg });
    }

    const nick = args[0];
    const description = cleanString(args.slice(1).join(' '));

    try {
        await UserService.createUser(senderJid, nick, description);
        return sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            return sock.sendMessage(jid, { text: '❌ Nick já existe.' }, { quoted: msg });
        }
        console.error(error);
        return sock.sendMessage(jid, { text: '❌ Erro interno.' }, { quoted: msg });
    }
}

async function updateUser(sock, msg, args, jid) {
    const senderJid = getSender(msg);
    if (args.length < 2) {
        return sock.sendMessage(jid, { text: 'Use: *!profile set <nick|desc> <valor>*' }, { quoted: msg });
    }

    const type = args[0].toLowerCase();
    const newValue = cleanString(args.slice(1).join(' '));
    let dbField = (['nick'].includes(type)) ? 'nick' : (['desc'].includes(type)) ? 'description' : null;

    if (!dbField) {
        return sock.sendMessage(jid, { text: '❌ Use "nick" ou "desc".' }, { quoted: msg });
    }

    try {
        const result = await UserService.updateUserField(senderJid, dbField, newValue);
        if (result.changes === 0) {
            return sock.sendMessage(jid, { text: '❌ Perfil não encontrado.' }, { quoted: msg });
        }

        return sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
    } catch (error) {
        return sock.sendMessage(jid, { text: '❌ Erro.' }, { quoted: msg });
    }
}

async function viewProfile(sock, msg, args, jid) {
    const senderJid = getSender(msg);
    let user = null;
    let targetNick = null;

    try {
        if (args.length > 0) {
            targetNick = args.join(' ').trim();
            user = await UserService.getUserByNick(targetNick);
        } else {
            user = await UserService.getUserByJid(senderJid);

            if (!user) {
                const pushName = msg.pushName || 'Desconhecido';
                try {
                    await UserService.createUser(senderJid, pushName, 'Sem descrição');
                    user = await UserService.getUserByJid(senderJid);
                } catch (e) {
                    console.log('Auto-create falhou ou duplicado');
                }
            }
        }

        if (!user) {
            const text = targetNick
                ? `❌ Usuário *${targetNick}* não encontrado.`
                : '❌ Perfil não encontrado.';
            return sock.sendMessage(jid, { text }, { quoted: msg });
        }

        const [titles, totalMsgs, topDayData, topHourData, topComboData] = await Promise.all([
            TitleService.getUserTitles(user.jid),
            StatsService.getUserTotal(user.jid),
            StatsService.getUserTopDay(user.jid),
            StatsService.getUserTopHour(user.jid),
            StatsService.getUserTopDayHour(user.jid)
        ]);

        let titlesText = '';
        if (titles && titles.length > 0) {
            titlesText = '\n\n🏆 *Conquistas:*\n' + titles.map(t => `• ${t.name}`).join('\n');
        }

        const topDayStr = topDayData ? daysMap[parseInt(topDayData.day)] : '---';
        const topHourStr = topHourData ? `${topHourData.hour.toString().padStart(2, '0')}h` : '---';

        let comboStr = '---';
        if (topComboData) {
            const d = daysMap[parseInt(topComboData.day)];
            const h = topComboData.hour.toString().padStart(2, '0');
            comboStr = `${d} às ${h}h`;
        }

        const statsText = `\n\n*Estatísticas:*\n` +
            `• Total: ${totalMsgs} msgs\n` +
            `• Dia + Ativo: ${topDayStr}\n` +
            `• Hora + Ativa: ${topHourStr}\n` +
            `• Hora/Dia + Ativo: ${comboStr}`;

        const response = `👤 *PERFIL DE ${user.nick}*\n\n` +
            `*Desc:* ${user.description}` +
            statsText +
            titlesText;

        return sock.sendMessage(jid, { text: response }, { quoted: msg });

    } catch (error) {
        console.error(error);
        return sock.sendMessage(jid, { text: '❌ Erro.' }, { quoted: msg });
    }
}