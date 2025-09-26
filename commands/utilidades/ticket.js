const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Gerencia o sistema de tickets')
    .addSubcommand(subcommand =>
      subcommand
        .setName('painel')
        .setDescription('Cria um painel de tickets'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(interaction, client) {
    if (interaction.options.getSubcommand() === 'painel') {
      try {
        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle('Sistema de Tickets')
          .setDescription('Selecione uma opção abaixo para abrir um ticket:')
          .addFields(
            { name: '🛒 Donates', value: 'Para realizar compras na loja do servidor', inline: true },
            { name: '🔧 Suporte', value: 'Para solicitar ajuda com problemas técnicos', inline: true },
            { name: '🐛 Bugs', value: 'Para reportar bugs encontrados no servidor', inline: true },
            { name: '🚨 Denúncias', value: 'Para denunciar jogadores que estão quebrando as regras', inline: true }
          )
          .setFooter({ text: 'Seu ticket será atendido assim que possível.' });
          

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_compra')
              .setLabel('Donates')
              .setEmoji('🛒')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('ticket_suporte')
              .setLabel('Suporte')
              .setEmoji('🔧')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('ticket_bug')
              .setLabel('Bugs')
              .setEmoji('🐛')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('ticket_denuncia')
              .setLabel('Denúncias')
              .setEmoji('🚨')
              .setStyle(ButtonStyle.Danger)
          );

        await interaction.reply({ embeds: [embed], components: [row] });
        
        await logger.logCommand(
          interaction, 
          "Painel de tickets criado", 
          `Canal: <#${interaction.channelId}>`
        );
      } catch (error) {
        console.error(error);
        await logger.logError(`Comando ${interaction.commandName}`, error);
        return interaction.reply({ content: '❌ Ocorreu um erro ao criar o painel de tickets.', flags: 64 });
      }
    }
  },
};
