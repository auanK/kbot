import fs from 'fs/promises';
import { URL } from 'url';
import { startWhatsapp } from './services/whatsapp.js';
import { onMessage } from './events/onMessage.js';

async function loadCommands() {
  const commands = new Map();
  const cmdDir = new URL('./commands/', import.meta.url);

  try {
    const files = await fs.readdir(cmdDir);

    console.log(`Carregando comandos:`);
    for (const file of files) {
      if (file.endsWith('.js')) {
        const cmdModule = await import(new URL(file, cmdDir.href));
        const cmd = cmdModule.default;

        if (cmd && cmd.name && cmd.run) {
          console.log(` ${cmd.name}`);
          commands.set(cmd.name, cmd);
        }
      }
    }
  } catch (e) {
    console.error('Erro ao carregar comandos:', e);
  }
  return commands;
}

async function main() {
  console.log('Iniciando o bot...');

  const sock = await startWhatsapp();
  const context = {
    sock: sock,
  };

  const commands = await loadCommands();
  sock.context = context;

  sock.ev.on('messages.upsert', (m) => {
    onMessage(m, context, commands);
  });
}

main();
