const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remcarro')
    .setDescription('Remove um veículo da garagem de um jogador')
    .addIntegerOption(option => 
      option.setName('id')
        .setDescription('ID do jogador')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('veiculo')
        .setDescription('Nome do veículo')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction, client) {
    const id = interaction.options.getInteger('id');
    const veiculo = interaction.options.getString('veiculo');

    try {
      // Verificar se o jogador possui este veículo
      const [vehicleRows] = await pool.execute('SELECT * FROM vehicles WHERE Passport = ? AND vehicle = ?', [id, veiculo]);
      
      if (vehicleRows.length === 0) {
        await logger.logCommand(
          interaction, 
          "Falha ao remover veículo", 
          `Jogador com ID ${id} não possui o veículo ${veiculo}.`
        );
        return interaction.reply({ content: `❌ O jogador não possui um veículo ${veiculo} em sua garagem!`, flags: 64 });
      }

      // Remover o veículo
      await pool.execute('DELETE FROM vehicles WHERE Passport = ? AND vehicle = ?', [id, veiculo]);
      
      await logger.logCommand(
        interaction, 
        "Veículo removido", 
        `ID: ${id}\nVeículo: ${veiculo}\nPlaca: ${vehicleRows[0].plate}`
      );
      
      return interaction.reply({ content: `✅ Veículo ${veiculo} removido com sucesso da garagem do jogador ${id}!`, flags: 64 });
    } catch (error) {
      console.error(error);
      await logger.logError(`Comando ${interaction.commandName}`, error);
      return interaction.reply({ content: '❌ Ocorreu um erro ao processar o comando.', flags: 64 });
    }
  },
};
