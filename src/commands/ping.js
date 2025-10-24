export default {
  name: 'ping',

  async run({ sock, msg }) {
    const jid = msg.key.remoteJid;
    await sock.sendMessage(jid, { text: 'Pong!' }, { quoted: msg });
  },
};
