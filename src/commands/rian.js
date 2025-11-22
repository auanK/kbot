export default {
  name: 'rian',

  async run({ sock, msg }) {
    const jid = msg.key.remoteJid;
    await sock.sendMessage(jid, { text: '👨‍🌾' }, { quoted: msg });
  },
};
