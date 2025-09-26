const { ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../utils/logger');
const path = require('path');
const config = require(path.join(__dirname, '..', 'config', 'config.json'));


module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Bot iniciado como ${client.user.tag}!`);
    
    // Definir o status personalizado com emoji
    client.user.setPresence({
      activities: [{
        name: 'Bot Desenvolvido por Brasil fivem Host',
        type: ActivityType.Custom, // Tipo 4 para Custom Status
        state: '🤖 Bot Desenvolvido por Brasil fivem Host ✅'
      }],
      status: 'online',
    });
    
    // Registrar no log
    await logger.logDatabase("Bot Iniciado", `Bot iniciado com sucesso como ${client.user.tag}`);
    
    // Exibir informações do bot no console
    console.log(`
╔════════════════════════════════════════════════╗
║                   BOT INICIADO                 ║
╠════════════════════════════════════════════════╣
║ Nome: ${client.user.tag}
║ Servidores: ${client.guilds.cache.size}
║ Usuários: ${client.users.cache.size}
║ Canais: ${client.channels.cache.size}
║ Data: ${new Date().toLocaleString('pt-BR')}
╚════════════════════════════════════════════════╝
`);

    // Configurar sistema de verificação
    if (config.roleSystem && config.roleSystem.type === 'verification' && config.roleSystem.verificationChannel) {
      try {
        // Obter o canal de verificação
        const channel = await client.channels.fetch(config.roleSystem.verificationChannel).catch(() => null);
        
        if (!channel) {
          console.error(`Canal de verificação com ID ${config.roleSystem.verificationChannel} não encontrado`);
          return;
        }
        
        // Verificar se já existe uma mensagem de verificação no canal
        const messages = await channel.messages.fetch({ limit: 50 });
        const existingMessage = messages.find(msg => 
          msg.author.id === client.user.id && 
          msg.components.length > 0 && 
          msg.components[0].components.some(c => c.customId === 'verify-button')
        );
        
        // Se não houver mensagem existente, criar uma nova
        if (!existingMessage) {
          // Criar embed para mensagem de verificação
          const embed = new EmbedBuilder()
            .setTitle('Verificação')
            .setDescription(config.roleSystem.verificationMessage)
            .setColor('#2F3136');
          
          // Criar botão de verificação
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('verify-button')
                .setLabel(config.roleSystem.verificationButtonLabel)
                .setEmoji(config.roleSystem.verificationButtonEmoji)
                .setStyle(ButtonStyle.Success)
            );
          
          // Enviar mensagem com botão no canal especificado
          await channel.send({
            embeds: [embed],
            components: [row]
          });
          
          console.log(`Mensagem de verificação criada no canal ${channel.name}`);
        }
      } catch (error) {
        console.error('Erro ao configurar sistema de verificação:', error);
      }
    }
  },
};
