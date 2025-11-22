export default {
    type: 'message_text',

    async execute(sock, jobData) {
        console.log(`Enviando mensagem: "${jobData.name}"`);

        try {
            let messagesList;
            try {
                messagesList = JSON.parse(jobData.payload);
            } catch (parseError) {
                console.error(`Erro ao ler JSON do payload (ID: ${jobData.id})`, parseError);
                return;
            }

            if (Array.isArray(messagesList) && messagesList.length > 0) {
                const randomIndex = Math.floor(Math.random() * messagesList.length);
                const selectedMessage = messagesList[randomIndex];

                await sock.sendMessage(jobData.target_jid, {
                    text: selectedMessage
                });

            } else {
                console.warn(`Payload vazio ou inválido para: ${jobData.id}`);
            }

        } catch (error) {
            console.error(`Falha crítica ao enviar mensagem (ID: ${jobData.id}):`, error);
        }
    }
};