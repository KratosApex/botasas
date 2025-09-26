const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Faz o bot enviar uma mensagem')
    .addStringOption(option => 
      option.setName('mensagem')
        .setDescription('Mensagem a ser enviada')
        .setRequired(true))
    .addChannelOption(option => 
      option.setName('canal')
        .setDescription('Canal onde a mensagem será enviada (padrão: canal atual)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  
  async execute(interaction, client) {
    const mensagem = interaction.options.getString('mensagem');
    const canal = interaction.options.getChannel('canal') || interaction.channel;
    
    try {
      await canal.send(mensagem);
      
      await logger.logCommand(
        interaction, 
        "Mensagem enviada via bot", 
        `Canal: <#${canal.id}>\nConteúdo: ${mensagem.substring(0, 1000)}`
      );
      
      return interaction.reply({ 
        content: `✅ Mensagem enviada com sucesso em <#${canal.id}>.`, 
        flags: 64 
      });
    } catch (error) {
      console.error(error);
      await logger.logError(`Comando ${interaction.commandName}`, error);
      return interaction.reply({ 
        content: '❌ Ocorreu um erro ao enviar a mensagem.', 
        flags: 64 
      });
    }
  },
};
