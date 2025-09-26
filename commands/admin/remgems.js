const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remgems')
    .setDescription('Remove gemas da conta de um jogador')
    .addIntegerOption(option => 
      option.setName('id')
        .setDescription('ID do jogador')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('valor')
        .setDescription('Valor a ser removido')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction, client) {
    const id = interaction.options.getInteger('id');
    const valor = interaction.options.getInteger('valor');

    try {
      // Verificar se o jogador existe
      const [rows] = await pool.execute('SELECT * FROM summerz_accounts WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        await logger.logCommand(interaction, "Falha ao remover gemas", `Jogador com ID ${id} não encontrado.`);
        return interaction.reply({ content: `❌ Jogador com ID ${id} não encontrado!`, flags: 64 });
      }

      // Verificar se tem saldo suficiente
      if (rows[0].gems < valor) {
        await logger.logCommand(
          interaction, 
          "Falha ao remover gemas", 
          `Jogador com ID ${id} não possui saldo suficiente. Saldo: $${rows[0].gems}, Valor solicitado: $${valor}`
        );
        return interaction.reply({ content: `❌ O jogador não possui saldo suficiente! Saldo atual: $${rows[0].gems}`, flags: 64 });
      }

      // Atualizar o saldo bancário
      const novoSaldo = rows[0].gems - valor;
      await pool.execute('UPDATE summerz_accounts SET gems = ? WHERE id = ?', [novoSaldo, id]);
      
      // Registrar log
      await logger.logCommand(
        interaction, 
        "Gemas removido", 
        `ID: ${id}\nValor: $${valor}\nSaldo anterior: $${rows[0].gems}\nNovo saldo: $${novoSaldo}`
      );
      
      return interaction.reply({ content: `✅ Removido $${valor} Gemas do jogador ${id}. Novo saldo: $${novoSaldo}`, flags: 64 });
    } catch (error) {
      console.error(error);
      await logger.logError(`Comando ${interaction.commandName}`, error);
      return interaction.reply({ content: '❌ Ocorreu um erro ao processar o comando.', flags: 64 });
    }
  },
};
