const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wipe')
    .setDescription('Limpa cargos e apelidos dados pelo bot')
    .addRoleOption(option => 
      option.setName('cargo')
        .setDescription('Cargo específico para remover (opcional)')
        .setRequired(false))
    .addBooleanOption(option => 
      option.setName('apelidos')
        .setDescription('Limpar apelidos? (padrão: false)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction, client) {
    await interaction.followUp();
    
    const cargo = interaction.options.getRole('cargo');
    const limparApelidos = interaction.options.getBoolean('apelidos') || false;
    
    try {
      let membrosAfetados = 0;
      let apelidosLimpos = 0;
      
      // Obter todos os membros
      const members = await interaction.guild.members.fetch();
      
      for (const [id, member] of members) {
        // Pular bots
        if (member.user.bot) continue;
        
        // Remover cargo específico se fornecido
        if (cargo && member.roles.cache.has(cargo.id)) {
          await member.roles.remove(cargo);
          membrosAfetados++;
        }
        
        // Limpar apelidos se solicitado
        if (limparApelidos && member.nickname) {
          await member.setNickname(null);
          apelidosLimpos++;
        }
      }
      
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Wipe Concluído')
        .setDescription(`Operação concluída com sucesso!`)
        .addFields(
          { name: 'Membros afetados', value: `${membrosAfetados}`, inline: true },
          { name: 'Apelidos limpos', value: `${apelidosLimpos}`, inline: true }
        )
        .setTimestamp();
      
      await logger.logCommand(
        interaction, 
        "Wipe executado", 
        `Cargo: ${cargo ? cargo.name : 'Nenhum'}\nLimpar apelidos: ${limparApelidos ? 'Sim' : 'Não'}\nMembros afetados: ${membrosAfetados}\nApelidos limpos: ${apelidosLimpos}`
      );
      
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await logger.logError(`Comando ${interaction.commandName}`, error);
      return interaction.editReply('❌ Ocorreu um erro ao executar o wipe.');
    }
  },
};
