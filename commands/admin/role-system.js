// commands/admin/role-system.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role-system')
    .setDescription('Configura o sistema de atribuição de cargos')
    .addSubcommand(subcommand =>
      subcommand
        .setName('type')
        .setDescription('Define o tipo de sistema de role')
        .addStringOption(option =>
          option.setName('tipo')
            .setDescription('Tipo de sistema de role')
            .setRequired(true)
            .addChoices(
              { name: 'Automático', value: 'auto' },
              { name: 'Verificação por botão', value: 'verification' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup-verification')
        .setDescription('Configura o canal de verificação e cria a mensagem com botão')
        .addChannelOption(option =>
          option.setName('canal')
            .setDescription('Canal onde a mensagem de verificação será exibida')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    // Caminho para o arquivo config.json
    const configPath = path.join(__dirname, '..', '..', 'config', 'config.json');
    
    // Carregar configuração atual
    let config;
    try {
      config = require(configPath);
    } catch (error) {
      return interaction.reply({
        content: `Erro ao carregar o arquivo de configuração: ${error.message}`,
        flags: 64
      });
    }
    
    if (subcommand === 'type') {
      const type = interaction.options.getString('tipo');
      
      // Atualizar configuração
      if (!config.roleSystem) config.roleSystem = {};
      config.roleSystem.type = type;
      
      // Salvar configuração no arquivo
      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        await interaction.reply({
          content: `Sistema de role configurado para: ${type === 'auto' ? 'Automático' : 'Verificação por botão'}`,
          flags: 64
        });
      } catch (error) {
        await interaction.reply({
          content: `Erro ao salvar a configuração: ${error.message}`,
          flags: 64
        });
      }
    } 
    else if (subcommand === 'setup-verification') {
      const channel = interaction.options.getChannel('canal');
      
      // Atualizar canal de verificação na configuração
      if (!config.roleSystem) config.roleSystem = {};
      config.roleSystem.verificationChannel = channel.id;
      
      // Definir valores padrão se não existirem
      if (!config.roleSystem.verificationMessage) {
        config.roleSystem.verificationMessage = "Clique no botão abaixo para verificar sua conta e obter acesso ao servidor.";
      }
      if (!config.roleSystem.verificationButtonLabel) {
        config.roleSystem.verificationButtonLabel = "Verificar";
      }
      if (!config.roleSystem.verificationButtonEmoji) {
        config.roleSystem.verificationButtonEmoji = "✅";
      }
      
      // Salvar configuração no arquivo
      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        // Criar embed para mensagem de verificação
        const embed = new EmbedBuilder()
          .setTitle('Verificação')
          .setDescription(config.roleSystem.verificationMessage)
          .setColor('#2F3136');
        
        // Criar botão de verificação
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('verify-button')
              .setLabel(config.roleSystem.verificationButtonLabel)
              .setEmoji(config.roleSystem.verificationButtonEmoji)
              .setStyle(ButtonStyle.Success)
          );
        
        // Enviar mensagem com botão no canal especificado
        await channel.send({
          embeds: [embed],
          components: [row]
        });
        
        await interaction.reply({
          content: `Mensagem de verificação configurada no canal ${channel}`,
          flags: 64
        });
      } catch (error) {
        await interaction.reply({
          content: `Erro ao configurar a verificação: ${error.message}`,
          flags: 64
        });
      }
    }
  },
};
