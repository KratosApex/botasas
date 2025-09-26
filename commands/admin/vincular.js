const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vincular')
    .setDescription('Vincula um usuário do Discord ao ID e nome no servidor FiveM')
    .addUserOption(option => 
      option.setName('usuario')
        .setDescription('Usuário do Discord')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('id')
        .setDescription('ID do jogador no FiveM')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction, client) {
    const user = interaction.options.getUser('usuario');
    const id = interaction.options.getInteger('id');
    
    try {
      // Verificar se o ID existe
      const [rows] = await pool.execute('SELECT * FROM characters WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        await logger.logCommand(
          interaction, 
          "Falha ao vincular usuário", 
          `ID ${id} não encontrado no banco de dados.`
        );
        return interaction.reply({ content: `❌ ID ${id} não encontrado no banco de dados!`, flags: 64 });
      }
      
      // Atualizar discord ID na tabela accounts
      const [accountRows] = await pool.execute('SELECT * FROM summerz_accounts WHERE steam = ?', [id]);
      
      if (accountRows.length > 0) {
        await pool.execute('UPDATE summerz_accounts SET discord = ? WHERE steam = ?', [user.id, id]);
      }
      
      // Atualizar nickname do membro
      const member = await interaction.guild.members.fetch(user.id);
      const novoNickname = `${rows[0].name} ${rows[0].name2}`;
      
      await member.setNickname(novoNickname);
      
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Usuário Vinculado')
        .setDescription(`<@${user.id}> foi vinculado ao ID ${id} com sucesso!`)
        .addFields(
          { name: 'ID', value: `${id}`, inline: true },
          { name: 'Nome', value: novoNickname, inline: true },
          { name: 'Vinculado por', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();
      
      await logger.logCommand(
        interaction, 
        "Usuário vinculado", 
        `Usuário: <@${user.id}> (${user.tag})\nID: ${id}\nNome: ${novoNickname}`
      );
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await logger.logError(`Comando ${interaction.commandName}`, error);
      return interaction.reply({ content: '❌ Ocorreu um erro ao vincular o usuário.', flags: 64 });
    }
  },
};
