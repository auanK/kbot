import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { onReady } from '../events/onReady.js';
import { onMessage } from '../events/onMessage.js';

const logger = pino({ level: 'silent' });

export async function startWhatsapp(commands) {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

  const sock = makeWASocket({
    auth: state,
    logger,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    retryRequestDelayMs: 250,
  });

  const context = { sock };
  sock.context = context;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', (m) => {
    onMessage(m, context, commands);
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('QR Code recebido, escaneie:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.error('Conexão fechada. Motivo:', lastDisconnect.error);

      if (shouldReconnect) {
        console.log('Reconectando automaticamente...');
        startWhatsapp(commands);
      }
    } else if (connection === 'open') {
      onReady(context);
    }
  });

  return sock;
}