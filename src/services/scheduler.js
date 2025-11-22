import cron from 'node-cron';
import { openDb } from './db.js';
import messageTextHandler from '../automations/message_text.js';

const handlers = {
    [messageTextHandler.type]: messageTextHandler,
};

let scheduledTasks = [];

export async function startScheduler(sock) {
    console.log('Carregando agendamentos...');
    const db = await openDb();

    scheduledTasks.forEach(task => task.stop());
    scheduledTasks = [];

    const jobs = await db.all('SELECT * FROM schedulers WHERE active = 1');

    for (const job of jobs) {
        const handler = handlers[job.type];

        if (!handler) {
            console.warn(`Handler não encontrado para o tipo: '${job.type}' (ID: ${job.id})`);
            continue;
        }

        if (!cron.validate(job.cron)) {
            console.error(`Cron inválido: '${job.cron}' (ID: ${job.id})`);
            continue;
        }

        const task = cron.schedule(job.cron, () => {
            handler.execute(sock, job);
        }, {
            scheduled: true,
            timezone: "America/Sao_Paulo"
        });

        scheduledTasks.push(task);
        console.log(`✅ Agendado: "${job.name}" [${job.cron}]`);
    }

    console.log(`Total de ${scheduledTasks.length} agendamentos carregados.`);
}