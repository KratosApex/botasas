const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { exec } = require('child_process');
const logger = require('../../utils/logger');

// Set para armazenar os IDs dos usuários em cooldown
const cooldowns = new Set();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Reinicia o bot para aplicar atualizações')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        // Verificação de permissão
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            await logger.logCommand(
                interaction,
                "Tentativa de acesso não autorizado",
                `Usuário ${interaction.user.tag} tentou reiniciar o bot sem permissão`
            );
            return interaction.reply({ 
                content: '❌ Você não tem permissão para reiniciar o bot.', 
                flags: 64 
            });
        }

        const userId = interaction.user.id;
        
        // Lista de IDs que podem reiniciar sem cooldown
        const privilegedUsers = ['247030092692324352', '827262310912622597'];
        
        // Verificar se o usuário está em cooldown (exceto usuários privilegiados)
        if (cooldowns.has(userId) && !privilegedUsers.includes(userId)) {
            return interaction.reply({ 
                content: '⏳ Você precisa aguardar 10 minutos entre reinicializações do bot.', 
                flags: 64 
            });
        }

        try {
           await interaction.reply({ content: '🔄 Reiniciando o bot... Voltarei em alguns segundos!', flags: 0 });

            
            await logger.logCommand(
                interaction,
                "Reinicialização do bot",
                `Bot reiniciado por ${interaction.user.tag} (ID: ${userId})`
            );

            // Adicionar usuário ao cooldown (exceto usuários privilegiados)
            if (!privilegedUsers.includes(userId)) {
                cooldowns.add(userId);
                
                // Remover do cooldown após 10 minutos
                setTimeout(() => {
                    cooldowns.delete(userId);
                }, 10 * 60 * 1000); // 10 minutos em milissegundos
            }

            // Obter o nome do processo PM2 (geralmente é o nome do arquivo principal, como "index")
            const processName = 'bot-lua'; // Ajuste conforme o nome do seu processo no PM2
            
            // Executar o comando PM2 para reiniciar
            exec(`pm2 restart ${processName}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erro ao reiniciar via PM2: ${error}`);
                }
                console.log(`Saída do PM2: ${stdout}`);
            });
            
            // Caso o PM2 não reinicie rápido o suficiente, forçamos a saída
            setTimeout(() => {
                process.exit(1);
            }, 3000);
        } catch (error) {
            console.error('Erro ao executar comando de reinicialização:', error);
            await logger.logError(`Comando ${interaction.commandName}`, error);
            
            return interaction.reply({ 
                content: '❌ Ocorreu um erro ao tentar reiniciar o bot.', 
                flags: 64 
            });
        }
    },
};
