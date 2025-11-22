import { initDb } from '../services/db.js';
import { startScheduler } from '../services/scheduler.js';

export async function onReady(context) {
  console.log('Bot online!');

  try {
    await initDb();
    await startScheduler(context.sock);
  } catch (error) {
    console.error('Erro ao iniciar o bot:', error);
  }
}