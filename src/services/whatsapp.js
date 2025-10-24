import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { onReady } from '../events/onReady.js';

const logger = pino({ level: 'silent' });

export async function startWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

  const sock = makeWASocket({ auth: state, logger });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('QR Code recebido, escaneie:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (lastDisconnect?.error) {
        console.error('Conexão fechada, motivo:', lastDisconnect.error);
      }

      if (shouldReconnect) {
        console.log('Reconectando...');
        startWhatsapp();
      }
    } else if (connection === 'open') {
      onReady(sock.context);
    }
  });

  return sock;
}
