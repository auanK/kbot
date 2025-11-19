import fs from 'fs/promises';
import { URL } from 'url';
import { startWhatsapp } from './services/whatsapp.js';

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
  const commands = await loadCommands();

  await startWhatsapp(commands);
}

process.on('uncaughtException', (err) => {
  console.error('Erro Crítico:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Rejeição de Promessa:', reason);
});

main();