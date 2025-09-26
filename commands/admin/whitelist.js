const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Gerencia a whitelist de um jogador')
    .addSubcommand(subcommand =>
      subcommand
        .setName('aprovar')
        .setDescription('Aprova um jogador na whitelist')
        .addUserOption(option => option.setName('usuario').setDescription('Usuário do Discord').setRequired(true))
        .addIntegerOption(option => option.setName('id').setDescription('ID do jogador').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remover')
        .setDescription('Remove um jogador da whitelist')
        .addUserOption(option => option.setName('usuario').setDescription('Usuário do Discord').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'aprovar') {
      const user = interaction.options.getUser('usuario');
      const id = interaction.options.getInteger('id');
      const member = await interaction.guild.members.fetch(user.id);
      
      try {
        // Verificar se o ID existe
        const [rows] = await pool.execute('SELECT * FROM summerz_accounts WHERE steam = ?', [id]);
        
        if (rows.length === 0) {
          await logger.logCommand(
            interaction, 
            "Falha ao aprovar whitelist", 
            `ID ${id} não encontrado no banco de dados.`
          );
          return interaction.reply({ content: `❌ ID ${id} não encontrado no banco de dados!`, flags: 64 });
        }
        
        // Atualizar whitelist e vincular Discord
        await pool.execute('UPDATE accounts SET whitelist = 1, discord = ? WHERE id = ?', [user.id, id]);
        
        // Adicionar cargo de whitelist
        const whitelistRole = interaction.guild.roles.cache.get(client.config.ROLES.WHITELIST);
        if (whitelistRole) {
          await member.roles.add(whitelistRole);
        }
        
        // Remover cargo após whitelist
        const removeRole = interaction.guild.roles.cache.get(client.config.ROLES.REMOVE_AFTER_WL);
        if (removeRole && member.roles.cache.has(removeRole.id)) {
          await member.roles.remove(removeRole);
        }
        
        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('Whitelist Aprovada')
          .setDescription(`<@${user.id}> foi aprovado na whitelist!`)
          .addFields(
            { name: 'ID', value: `${id}`, inline: true },
            { name: 'Aprovado por', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp();
        
        await logger.logCommand(
          interaction, 
          "Whitelist aprovada", 
          `Usuário: <@${user.id}> (${user.tag})\nID: ${id}`
        );
        
        return interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        await logger.logError(`Comando ${interaction.commandName}`, error);
        return interaction.reply({ content: '❌ Ocorreu um erro ao processar o comando.', flags: 64 });
      }
    } else if (subcommand === 'remover') {
      const user = interaction.options.getUser('usuario');
      
      try {
        // Atualizar whitelist
        await pool.execute('UPDATE accounts SET whitelist = 0 WHERE discord = ?', [user.id]);
        
        // Remover cargo de whitelist
        const member = await interaction.guild.members.fetch(user.id);
        const whitelistRole = interaction.guild.roles.cache.get(client.config.ROLES.WHITELIST);
        if (whitelistRole && member.roles.cache.has(whitelistRole.id)) {
          await member.roles.remove(whitelistRole);
        }
        
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Whitelist Removida')
          .setDescription(`<@${user.id}> teve sua whitelist removida!`)
          .addFields(
            { name: 'Removido por', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp();
        
        await logger.logCommand(
          interaction, 
          "Whitelist removida", 
          `Usuário: <@${user.id}> (${user.tag})`
        );
        
        return interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        await logger.logError(`Comando ${interaction.commandName}`, error);
        return interaction.reply({ content: '❌ Ocorreu um erro ao processar o comando.', flags: 64 });
      }
    }
  },
};
