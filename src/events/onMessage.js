import { logMessage } from '../services/db.js';
import * as TitleService from '../services/titleService.js';

export async function onMessage(m, context, commands) {
  const msg = m.messages[0];

  if (!msg.message || !msg.key || msg.key.fromMe) {
    return;
  }

  const { sock } = context;
  const remoteJid = msg.key.remoteJid;
  const isGroup = remoteJid.endsWith('@g.us');

  const pushName = msg.pushName || 'SemNome';

  if (isGroup) {
    const senderJid = msg.key.participant || msg.participant;

    if (senderJid) {
      try {
        await logMessage(senderJid, pushName);

        TitleService.checkZuadento(sock, remoteJid).catch(console.error);
        TitleService.checkCoruja(sock, remoteJid).catch(console.error);
      } catch (err) {
        console.error('Erro ao processar mensagem:', err);
      }
    }
  }

  try {
    await sock.readMessages([msg.key]);
  } catch (e) {
    console.error('Erro ao enviar confirmação de leitura:', e);
  }

  const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
  if (!text) {
    return;
  }

  if (text.startsWith('!')) {
    const [cmdName, ...args] = text.substring(1).split(' ');
    const cmd = commands.get(cmdName.toLowerCase());

    if (cmd) {
      const cmdContext = { ...context, msg, args };
      const chatJid = remoteJid.split('@')[0];
      const senderName = pushName;
      console.log(`${chatJid} - ${senderName} - ${cmd.name}`);

      try {
        cmd.run(cmdContext);
      } catch (e) {
        console.error(`Falha ao executar ${cmd.name}:`, e);
      }
    }
  }
}