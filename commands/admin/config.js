const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configura o bot através de uma interface interativa')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    // Verificar se é o dono do servidor
    if (interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({
        content: '❌ Apenas o dono do servidor pode acessar as configurações do bot.',
        flags: 64
      });
    }

    // Mostrar menu principal de configuração
    await showMainConfigMenu(interaction, client);
  },
};

// Função para mostrar o menu principal
async function showMainConfigMenu(interaction, client) {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('🛠️ Configuração do Bot')
    .setDescription('Selecione uma categoria para configurar:')
    .addFields(
      { name: '🤖 Bot', value: 'Configurações básicas do bot', inline: true },
      { name: '🗄️ Banco de Dados', value: 'Configurações do banco de dados', inline: true },
      { name: '🎮 FiveM', value: 'Configurações do servidor FiveM', inline: true },
      { name: '📢 Canais', value: 'Configurações de canais do Discord', inline: true },
      { name: '👑 Cargos', value: 'Configurações de cargos', inline: true },
      { name: '📊 Logs', value: 'Configurações de logs', inline: true },
      { name: '🌐 Redes Sociais', value: 'Links para redes sociais', inline: true },
      { name: '🔐 AutoRole', value: 'Configurações do sistema de autorole', inline: true }
    )
    .setFooter({ text: 'Configuração interativa do bot' });

  // Dividir os botões em 3 linhas para melhor organização
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_bot')
        .setLabel('Bot')
        .setEmoji('🤖')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('config_database')
        .setLabel('Banco de Dados')
        .setEmoji('🗄️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('config_fivem')
        .setLabel('FiveM')
        .setEmoji('🎮')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_channels')
        .setLabel('Canais')
        .setEmoji('📢')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('config_roles')
        .setLabel('Cargos')
        .setEmoji('👑')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('config_logs')
        .setLabel('Logs')
        .setEmoji('📊')
        .setStyle(ButtonStyle.Secondary)
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_social')
        .setLabel('Redes Sociais')
        .setEmoji('🌐')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('config_autorole')
        .setLabel('AutoRole')
        .setEmoji('🔐')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('config_save')
        .setLabel('Salvar Configurações')
        .setEmoji('💾')
        .setStyle(ButtonStyle.Danger)
    );

  await interaction.reply({
    embeds: [embed],
    components: [row1, row2, row3],
    flags: 64
  });
}

module.exports.showMainConfigMenu = showMainConfigMenu;
