const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('redes')
    .setDescription('Exibe as redes sociais do servidor'),
  
  async execute(interaction, client) {
    try {
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Redes Sociais')
        .setDescription('Confira nossas redes sociais e fique por dentro de todas as novidades!')
        .setImage('https://usagif.com/wp-content/uploads/2021/4fh5wi/bemvindo-15.gif')
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTimestamp();
        
      
      const row = new ActionRowBuilder();
      
      if (client.config.SOCIAL.CFX) {
        row.addComponents(
          new ButtonBuilder()
            .setLabel('CFX.re')
            .setURL(client.config.SOCIAL.CFX)
            .setStyle(ButtonStyle.Link)
            .setEmoji('🎮')
        );
      }
      
      if (client.config.SOCIAL.INSTAGRAM) {
        row.addComponents(
          new ButtonBuilder()
            .setLabel('Instagram')
            .setURL(client.config.SOCIAL.INSTAGRAM)
            .setStyle(ButtonStyle.Link)
            .setEmoji('📸')
        );
      }
      
      if (client.config.SOCIAL.TIKTOK) {
        row.addComponents(
          new ButtonBuilder()
            .setLabel('TikTok')
            .setURL(client.config.SOCIAL.TIKTOK)
            .setStyle(ButtonStyle.Link)
            .setEmoji('🎵')
        );
      }
      
      if (client.config.SOCIAL.DISCORD) {
        row.addComponents(
          new ButtonBuilder()
            .setLabel('Discord')
            .setURL(client.config.SOCIAL.DISCORD)
            .setStyle(ButtonStyle.Link)
            .setEmoji('💬')
        );
      }
      
      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '❌ Ocorreu um erro ao exibir as redes sociais.', flags: 64 });
    }
  },
};
