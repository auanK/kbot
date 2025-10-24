export async function onMessage(m, context, commands) {
  const msg = m.messages[0];

  if (!msg.message || !msg.key || msg.key.fromMe) {
    return;
  }

  const { sock } = context;

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
      const cmdContext = {
        ...context,
        msg,
        args,
      };

      const chatJid = msg.key.remoteJid.split('@')[0];
      const senderName = msg.pushName || 'Desconhecido';
      console.log(`${chatJid} - ${senderName} - ${cmd.name}`);

      try {
        cmd.run(cmdContext);
      } catch (e) {
        console.error(`Falha ao executar ${cmd.name}:`, e);
      }
    }
  }
}
