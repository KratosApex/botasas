const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpa mensagens de um canal')
    .addIntegerOption(option => 
      option.setName('quantidade')
        .setDescription('Quantidade de mensagens a serem apagadas (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  
  async execute(interaction, client) {
    const quantidade = interaction.options.getInteger('quantidade');
    
    try {
      // Deletar mensagens
      const deletedMessages = await interaction.channel.bulkDelete(quantidade, true);
      
      await logger.logCommand(
        interaction, 
        "Mensagens apagadas", 
        `Canal: <#${interaction.channelId}>\nQuantidade: ${deletedMessages.size}`
      );
      
      return interaction.reply({ 
        content: `✅ ${deletedMessages.size} mensagens foram apagadas.`, 
        flags: 64 
      });
    } catch (error) {
      console.error(error);
      
      // Mensagem de erro específica para mensagens antigas
      if (error.code === 50034) {
        return interaction.reply({ 
          content: '❌ Não é possível excluir mensagens com mais de 14 dias.', 
          flags: 64 
        });
      }
      
      await logger.logError(`Comando ${interaction.commandName}`, error);
      return interaction.reply({ 
        content: '❌ Ocorreu um erro ao tentar apagar as mensagens.', 
        flags: 64 
      });
    }
  },
};
