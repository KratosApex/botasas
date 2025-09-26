const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Configuração do Bot
async function showBotConfig(interaction, client) {
  const modal = new ModalBuilder()
    .setCustomId('modal_config_bot')
    .setTitle('Configuração do Bot');

  const tokenInput = new TextInputBuilder()
    .setCustomId('bot_token')
    .setLabel('Token do Bot Discord')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.BOT_TOKEN || '')
    .setPlaceholder('Cole o token do seu bot aqui')
    .setRequired(true);

  const clientIdInput = new TextInputBuilder()
    .setCustomId('client_id')
    .setLabel('ID do Cliente (Application ID)')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.CLIENT_ID || '')
    .setPlaceholder('ID da aplicação do bot')
    .setRequired(true);

  const guildIdInput = new TextInputBuilder()
    .setCustomId('guild_id')
    .setLabel('ID do Servidor Discord')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.GUILD_ID || interaction.guild.id)
    .setPlaceholder('ID deste servidor Discord')
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder().addComponents(tokenInput);
  const secondActionRow = new ActionRowBuilder().addComponents(clientIdInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(guildIdInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

  await interaction.showModal(modal);
}

// Manipulador do Modal de Configuração do Bot
async function handleBotConfigModal(interaction, client) {
  const token = interaction.fields.getTextInputValue('bot_token');
  const clientId = interaction.fields.getTextInputValue('client_id');
  const guildId = interaction.fields.getTextInputValue('guild_id');

  // Atualizar configuração temporária
  client.tempConfig = client.tempConfig || JSON.parse(JSON.stringify(client.config));
  client.tempConfig.BOT_TOKEN = token;
  client.tempConfig.CLIENT_ID = clientId;
  client.tempConfig.GUILD_ID = guildId;

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Configuração do Bot Atualizada')
    .setDescription('As configurações do bot foram atualizadas temporariamente. Clique em "Salvar Configurações" no menu principal para aplicar as mudanças.')
    .addFields(
      { name: 'Token do Bot', value: '••••••••••••••••••••••••••' },
      { name: 'ID do Cliente', value: clientId },
      { name: 'ID do Servidor', value: guildId }
    );

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back')
        .setLabel('Voltar ao Menu Principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
}

// Configuração do Banco de Dados
async function showDatabaseConfig(interaction, client) {
  const modal = new ModalBuilder()
    .setCustomId('modal_config_database')
    .setTitle('Configuração do Banco de Dados');

  const hostInput = new TextInputBuilder()
    .setCustomId('db_host')
    .setLabel('Host do MySQL')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.DB_HOST || 'localhost')
    .setPlaceholder('Endereço do servidor MySQL')
    .setRequired(true);

  const userInput = new TextInputBuilder()
    .setCustomId('db_user')
    .setLabel('Usuário do MySQL')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.DB_USER || 'root')
    .setPlaceholder('Nome de usuário do MySQL')
    .setRequired(true);

  const passwordInput = new TextInputBuilder()
    .setCustomId('db_password')
    .setLabel('Senha do MySQL')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.DB_PASSWORD || '')
    .setPlaceholder('Senha do MySQL')
    .setRequired(false);

  const dbNameInput = new TextInputBuilder()
    .setCustomId('db_name')
    .setLabel('Nome do Banco de Dados')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.DB_NAME || 'fivem_db')
    .setPlaceholder('Nome do banco de dados')
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder().addComponents(hostInput);
  const secondActionRow = new ActionRowBuilder().addComponents(userInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(passwordInput);
  const fourthActionRow = new ActionRowBuilder().addComponents(dbNameInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

  await interaction.showModal(modal);
}

// Manipulador do Modal de Configuração do Banco de Dados
async function handleDatabaseConfigModal(interaction, client) {
  const host = interaction.fields.getTextInputValue('db_host');
  const user = interaction.fields.getTextInputValue('db_user');
  const password = interaction.fields.getTextInputValue('db_password');
  const dbName = interaction.fields.getTextInputValue('db_name');

  // Atualizar configuração temporária
  client.tempConfig = client.tempConfig || JSON.parse(JSON.stringify(client.config));
  client.tempConfig.DB_HOST = host;
  client.tempConfig.DB_USER = user;
  client.tempConfig.DB_PASSWORD = password;
  client.tempConfig.DB_NAME = dbName;

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Configuração do Banco de Dados Atualizada')
    .setDescription('As configurações do banco de dados foram atualizadas temporariamente. Clique em "Salvar Configurações" no menu principal para aplicar as mudanças.')
    .addFields(
      { name: 'Host', value: host },
      { name: 'Usuário', value: user },
      { name: 'Senha', value: '••••••••••' },
      { name: 'Banco de Dados', value: dbName }
    );

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back')
        .setLabel('Voltar ao Menu Principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
}

// Configuração do FiveM
async function showFivemConfig(interaction, client) {
  const modal = new ModalBuilder()
    .setCustomId('modal_config_fivem')
    .setTitle('Configuração do Servidor FiveM');

  const hostInput = new TextInputBuilder()
    .setCustomId('fivem_host')
    .setLabel('Host do Servidor FiveM')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.HOST_FIVEM || 'localhost')
    .setPlaceholder('Endereço IP ou domínio do servidor')
    .setRequired(true);

  const portInput = new TextInputBuilder()
    .setCustomId('fivem_port')
    .setLabel('Porta do Servidor FiveM')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.PORT_FIVEM || '30120')
    .setPlaceholder('Porta do servidor (padrão: 30120)')
    .setRequired(true);

  const cfxCodeInput = new TextInputBuilder()
    .setCustomId('fivem_cfx_code')
    .setLabel('Código CFX do Servidor')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.CFX_CODE || '')
    .setPlaceholder('Código CFX (ex: 537rpz)')
    .setRequired(false);

  const connectDomainInput = new TextInputBuilder()
    .setCustomId('fivem_connect_domain')
    .setLabel('Domínio para Comando Connect')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.CONNECT_DOMAIN || '')
    .setPlaceholder('suacidade.five-m.city')
    .setRequired(false);

  const firstActionRow = new ActionRowBuilder().addComponents(hostInput);
  const secondActionRow = new ActionRowBuilder().addComponents(portInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(cfxCodeInput);
  const fourthActionRow = new ActionRowBuilder().addComponents(connectDomainInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

  await interaction.showModal(modal);
}

// Manipulador do Modal de Configuração do FiveM
async function handleFivemConfigModal(interaction, client) {
  const host = interaction.fields.getTextInputValue('fivem_host');
  const port = interaction.fields.getTextInputValue('fivem_port');
  const cfxCode = interaction.fields.getTextInputValue('fivem_cfx_code');
  const connectDomain = interaction.fields.getTextInputValue('fivem_connect_domain');

  // Atualizar configuração temporária
  client.tempConfig = client.tempConfig || JSON.parse(JSON.stringify(client.config));
  client.tempConfig.HOST_FIVEM = host;
  client.tempConfig.PORT_FIVEM = port;
  client.tempConfig.CFX_CODE = cfxCode;
  client.tempConfig.CONNECT_DOMAIN = connectDomain;

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Configuração do Servidor FiveM Atualizada')
    .setDescription('As configurações do servidor FiveM foram atualizadas temporariamente. Clique em "Salvar Configurações" no menu principal para aplicar as mudanças.')
    .addFields(
      { name: 'Host', value: host },
      { name: 'Porta', value: port },
      { name: 'Código CFX', value: cfxCode || 'Não configurado' },
      { name: 'Domínio Connect', value: connectDomain || 'Não configurado (usando IP:Porta)' }
    );

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back')
        .setLabel('Voltar ao Menu Principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
}

// Configuração de Canais (Atualizada para incluir categoria de tickets)
async function showChannelsConfig(interaction, client) {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('📢 Configuração de Canais')
    .setDescription('Selecione os canais para cada função do bot:')
    .addFields(
      { name: 'Boas-vindas', value: client.config.WELCOME_CHANNEL_ID ? `<#${client.config.WELCOME_CHANNEL_ID}>` : 'Não configurado', inline: true },
      { name: 'Sugestões', value: client.config.SUGGESTION_CHANNEL_ID ? `<#${client.config.SUGGESTION_CHANNEL_ID}>` : 'Não configurado', inline: true },
      { name: 'Logs de Tickets', value: client.config.TICKET_LOGS_CHANNEL_ID ? `<#${client.config.TICKET_LOGS_CHANNEL_ID}>` : 'Não configurado', inline: true },
      { name: 'Backups', value: client.config.BACKUP_CHANNEL_ID ? `<#${client.config.BACKUP_CHANNEL_ID}>` : 'Não configurado', inline: true },
      { name: 'Categoria de Tickets', value: client.config.TICKET_CATEGORY_ID ? `<#${client.config.TICKET_CATEGORY_ID}>` : 'Não configurado', inline: true }
    );

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('select_welcome_channel')
        .setPlaceholder('Selecione o canal de boas-vindas')
        .setChannelTypes([ChannelType.GuildText])
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('select_suggestion_channel')
        .setPlaceholder('Selecione o canal de sugestões')
        .setChannelTypes([ChannelType.GuildText])
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('select_ticket_logs_channel')
        .setPlaceholder('Selecione o canal de logs de tickets')
        .setChannelTypes([ChannelType.GuildText])
    );

  const row4 = new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('select_backup_channel')
        .setPlaceholder('Selecione o canal de backups')
        .setChannelTypes([ChannelType.GuildText])
    );

  const row5 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back')
        .setLabel('Voltar ao Menu Principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({ embeds: [embed], components: [row1, row2, row3, row4, row5], flags: 64 });

  // Enviar um menu adicional para a categoria de tickets
  const rowCategory = new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('select_ticket_category')
        .setPlaceholder('Selecione a categoria para tickets')
        .setChannelTypes([ChannelType.GuildCategory])
    );

  await interaction.followUp({
    content: '**Categoria para criação de tickets:**',
    components: [rowCategory],
    flags: 64
  });
}

// Configuração de Cargos (Atualizada para respeitar o limite de 5 ActionRows)
async function showRolesConfig(interaction, client) {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('👑 Configuração de Cargos')
    .setDescription('Selecione os cargos para cada função do bot:')
    .addFields(
      { name: 'Administrador', value: client.config.ROLES?.ADMIN ? `<@&${client.config.ROLES.ADMIN}>` : 'Não configurado', inline: true },
      { name: 'Staff', value: client.config.ROLES?.STAFF ? `<@&${client.config.ROLES.STAFF}>` : 'Não configurado', inline: true },
      { name: 'Boas-vindas', value: client.config.ROLES?.WELCOME ? `<@&${client.config.ROLES.WELCOME}>` : 'Não configurado', inline: true },
      { name: 'Whitelist', value: client.config.ROLES?.WHITELIST ? `<@&${client.config.ROLES.WHITELIST}>` : 'Não configurado', inline: true },
      { name: 'Remover após WL', value: client.config.ROLES?.REMOVE_AFTER_WL ? `<@&${client.config.ROLES.REMOVE_AFTER_WL}>` : 'Não configurado', inline: true }
    );

  // Primeira mensagem com os primeiros 4 seletores de cargo
  const row1 = new ActionRowBuilder()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('select_admin_role')
        .setPlaceholder('Selecione o cargo de Administrador')
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('select_staff_role')
        .setPlaceholder('Selecione o cargo de Staff')
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('select_welcome_role')
        .setPlaceholder('Selecione o cargo de Boas-vindas')
    );

  const row4 = new ActionRowBuilder()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('select_whitelist_role')
        .setPlaceholder('Selecione o cargo de Whitelist')
    );

  const row5 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back')
        .setLabel('Voltar ao Menu Principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({ embeds: [embed], components: [row1, row2, row3, row4, row5], flags: 64 });

  // Segunda mensagem com o último seletor de cargo
  const row6 = new ActionRowBuilder()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('select_remove_after_wl_role')
        .setPlaceholder('Selecione o cargo a ser removido após WL')
    );

  await interaction.followUp({
    content: '**Cargo a ser removido após whitelist:**',
    components: [row6],
    flags: 64
  });
}

// Configuração de Logs
async function showLogsConfig(interaction, client) {
  const modal = new ModalBuilder()
    .setCustomId('modal_config_webhook')
    .setTitle('Configuração de Webhook para Logs');

  const webhookInput = new TextInputBuilder()
    .setCustomId('webhook_url')
    .setLabel('URL do Webhook para Logs')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(client.config.LOGS?.WEBHOOK_URL || '')
    .setPlaceholder('Cole a URL do webhook aqui')
    .setRequired(false);

  const firstActionRow = new ActionRowBuilder().addComponents(webhookInput);

  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
}

// Manipulador do Modal de Configuração de Webhook
async function handleWebhookConfigModal(interaction, client) {
  const webhookUrl = interaction.fields.getTextInputValue('webhook_url');

  // Atualizar configuração temporária
  client.tempConfig = client.tempConfig || JSON.parse(JSON.stringify(client.config));
  if (!client.tempConfig.LOGS) client.tempConfig.LOGS = {};
  client.tempConfig.LOGS.WEBHOOK_URL = webhookUrl;

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Configuração de Webhook Atualizada')
    .setDescription('A URL do webhook para logs foi atualizada temporariamente. Clique em "Salvar Configurações" no menu principal para aplicar as mudanças.')
    .addFields(
      { name: 'URL do Webhook', value: webhookUrl ? '••••••••••••••••••••••••••' : 'Não configurado' }
    );

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back')
        .setLabel('Voltar ao Menu Principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
}

// Configuração de Redes Sociais
async function showSocialConfig(interaction, client) {
  const modal = new ModalBuilder()
    .setCustomId('modal_config_social')
    .setTitle('Configuração de Redes Sociais');

  const cfxInput = new TextInputBuilder()
    .setCustomId('social_cfx')
    .setLabel('Link do CFX do servidor')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.SOCIAL?.CFX || '')
    .setPlaceholder('https://cfx.re/join/abcdef')
    .setRequired(false);

  const instagramInput = new TextInputBuilder()
    .setCustomId('social_instagram')
    .setLabel('Link do Instagram')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.SOCIAL?.INSTAGRAM || '')
    .setPlaceholder('https://instagram.com/seuservidor')
    .setRequired(false);

  const tiktokInput = new TextInputBuilder()
    .setCustomId('social_tiktok')
    .setLabel('Link do TikTok')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.SOCIAL?.TIKTOK || '')
    .setPlaceholder('https://tiktok.com/@seuservidor')
    .setRequired(false);

  const discordInput = new TextInputBuilder()
    .setCustomId('social_discord')
    .setLabel('Link de convite do Discord')
    .setStyle(TextInputStyle.Short)
    .setValue(client.config.SOCIAL?.DISCORD || '')
    .setPlaceholder('https://discord.gg/seuservidor')
    .setRequired(false);

  const firstActionRow = new ActionRowBuilder().addComponents(cfxInput);
  const secondActionRow = new ActionRowBuilder().addComponents(instagramInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(tiktokInput);
  const fourthActionRow = new ActionRowBuilder().addComponents(discordInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

  await interaction.showModal(modal);
}

// Manipulador do Modal de Configuração de Redes Sociais
async function handleSocialConfigModal(interaction, client) {
  const cfx = interaction.fields.getTextInputValue('social_cfx');
  const instagram = interaction.fields.getTextInputValue('social_instagram');
  const tiktok = interaction.fields.getTextInputValue('social_tiktok');
  const discord = interaction.fields.getTextInputValue('social_discord');

  // Atualizar configuração temporária
  client.tempConfig = client.tempConfig || JSON.parse(JSON.stringify(client.config));
  if (!client.tempConfig.SOCIAL) client.tempConfig.SOCIAL = {};
  client.tempConfig.SOCIAL.CFX = cfx;
  client.tempConfig.SOCIAL.INSTAGRAM = instagram;
  client.tempConfig.SOCIAL.TIKTOK = tiktok;
  client.tempConfig.SOCIAL.DISCORD = discord;

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Configuração de Redes Sociais Atualizada')
    .setDescription('As configurações de redes sociais foram atualizadas temporariamente. Clique em "Salvar Configurações" no menu principal para aplicar as mudanças.')
    .addFields(
      { name: 'CFX', value: cfx || 'Não configurado', inline: true },
      { name: 'Instagram', value: instagram || 'Não configurado', inline: true },
      { name: 'TikTok', value: tiktok || 'Não configurado', inline: true },
      { name: 'Discord', value: discord || 'Não configurado', inline: true }
    );

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back')
        .setLabel('Voltar ao Menu Principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
}

// Configuração do AutoRole
async function showAutoRoleConfig(interaction, client) {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('🔐 Configuração do Sistema de AutoRole')
    .setDescription('Configure o sistema de atribuição automática de cargos:')
    .addFields(
      { name: 'Tipo Atual', value: client.config.roleSystem?.type === 'verification' ? 'Verificação por Botão' : 'Automático', inline: true },
      { name: 'Canal de Verificação', value: client.config.roleSystem?.verificationChannel ? `<#${client.config.roleSystem.verificationChannel}>` : 'Não configurado', inline: true }
    );

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('autorole_type_auto')
        .setLabel('Modo Automático')
        .setStyle(client.config.roleSystem?.type !== 'verification' ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('autorole_type_verification')
        .setLabel('Modo Verificação por Botão')
        .setStyle(client.config.roleSystem?.type === 'verification' ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('select_verification_channel')
        .setPlaceholder('Selecione o canal para mensagem de verificação')
        .setChannelTypes([ChannelType.GuildText])
    );

  const row4 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back')
        .setLabel('Voltar ao Menu Principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({ embeds: [embed], components: [row1, row2, row3, row4], flags: 64 });
}

// Salvar Configuração
async function saveConfig(interaction, client) {
  if (!client.tempConfig) {
    return interaction.reply({
      content: '❌ Não há alterações pendentes para salvar.',
      flags: 64
    });
  }

  try {
    const configPath = path.join(__dirname, '..', 'config', 'config.json');
    
    // Garantir que o diretório config existe
    if (!fs.existsSync(path.join(__dirname, '..', 'config'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'config'), { recursive: true });
    }

    // Salvar configuração
    fs.writeFileSync(configPath, JSON.stringify(client.tempConfig, null, 2));
    
    // Atualizar configuração atual
    client.config = client.tempConfig;
    
    // Limpar configuração temporária
    client.tempConfig = null;

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Configurações Salvas')
      .setDescription('Todas as configurações foram salvas com sucesso!')
      .setFooter({ text: 'Algumas alterações podem exigir reinicialização do bot' });

    await interaction.reply({ embeds: [embed], flags: 64 });
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    await interaction.reply({
      content: `❌ Ocorreu um erro ao salvar as configurações: ${error.message}`,
      flags: 64
    });
  }
}

module.exports = {
  showBotConfig,
  handleBotConfigModal,
  showDatabaseConfig,
  handleDatabaseConfigModal,
  showFivemConfig,
  handleFivemConfigModal,
  showChannelsConfig,
  showRolesConfig,
  showLogsConfig,
  handleWebhookConfigModal,
  showSocialConfig,
  handleSocialConfigModal,
  showAutoRoleConfig, // Adicionar esta linha
  saveConfig
};
