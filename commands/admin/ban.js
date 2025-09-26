const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um usuário do Discord e do servidor FiveM')
    .addUserOption(option => 
      option.setName('usuario')
        .setDescription('Usuário do Discord')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('motivo')
        .setDescription('Motivo do banimento')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('fivem')
        .setDescription('Banir também no servidor FiveM?')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(interaction, client) {
    const user = interaction.options.getUser('usuario');
    const motivo = interaction.options.getString('motivo');
    const banFiveM = interaction.options.getBoolean('fivem') || false;
    
    try {
      // Banir do Discord
      await interaction.guild.members.ban(user, { reason: motivo });
      
      // Banir do FiveM se solicitado
      if (banFiveM) {
        // Buscar licença do usuário
        const [rows] = await pool.execute('SELECT * FROM summerz_accounts WHERE discord = ?', [user.id]);
        
        if (rows.length > 0) {
          const license = rows[0].license;
          const id = rows[0].id;
          
          // Calcular tempo de ban (1 ano em minutos = 525600)
          const banTime = Math.floor(Date.now() / 1000) + 525600;
          
          // Adicionar à tabela de banidos
          await pool.execute('INSERT INTO banneds (license, time) VALUES (?, ?)', [license, banTime]);
          
          const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Usuário Banido')
            .setDescription(`<@${user.id}> foi banido do Discord e do servidor FiveM!`)
            .addFields(
              { name: 'ID', value: `${id}`, inline: true },
              { name: 'Motivo', value: motivo, inline: true },
              { name: 'Banido por', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setTimestamp();
          
          await logger.logCommand(
            interaction, 
            "Usuário banido (Discord + FiveM)", 
            `Usuário: <@${user.id}> (${user.tag})\nID FiveM: ${id}\nMotivo: ${motivo}`
          );
          
          return interaction.reply({ embeds: [embed] });
        }
      }
      
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Usuário Banido')
        .setDescription(`<@${user.id}> foi banido do Discord!`)
        .addFields(
          { name: 'Motivo', value: motivo, inline: true },
          { name: 'Banido por', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();
      
      await logger.logCommand(
        interaction, 
        "Usuário banido (Discord)", 
        `Usuário: <@${user.id}> (${user.tag})\nMotivo: ${motivo}`
      );
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await logger.logError(`Comando ${interaction.commandName}`, error);
      return interaction.reply({ content: '❌ Ocorreu um erro ao processar o comando.', flags: 64 });
    }
  },
};
