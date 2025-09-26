const { EmbedBuilder, WebhookClient } = require('discord.js');
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    // Inicialização adiada do webhook para permitir configuração dinâmica
    this.webhook = null;
    this.configPath = path.join(__dirname, '..', 'config', 'config.json');
    this.initWebhook();
  }

  initWebhook() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        if (config.LOGS && config.LOGS.WEBHOOK_URL) {
          this.webhook = new WebhookClient({ url: config.LOGS.WEBHOOK_URL });
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar webhook de logs:', error);
    }
  }

  async logCommand(interaction, action, details) {
    if (!this.webhook) {
      this.initWebhook();
      if (!this.webhook) return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`Comando Executado: /${interaction.commandName}`)
      .setDescription(`**Ação:** ${action}`)
      .addFields(
        { name: 'Executado por', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
        { name: 'ID do Executor', value: interaction.user.id, inline: true },
        { name: 'Canal', value: `<#${interaction.channelId}>`, inline: true },
        { name: 'Data/Hora', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      )
      .setTimestamp();

    if (details) {
      embed.addFields({ name: 'Detalhes', value: details });
    }

    try {
      await this.webhook.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao enviar log:', error);
    }
  }

  async logDatabase(action, details) {
    if (!this.webhook) {
      this.initWebhook();
      if (!this.webhook) return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(`Operação de Banco de Dados`)
      .setDescription(`**Ação:** ${action}`)
      .addFields(
        { name: 'Data/Hora', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      )
      .setTimestamp();

    if (details) {
      embed.addFields({ name: 'Detalhes', value: details });
    }

    try {
      await this.webhook.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao enviar log de banco de dados:', error);
    }
  }

  async logError(source, error) {
    if (!this.webhook) {
      this.initWebhook();
      if (!this.webhook) return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(`Erro Detectado`)
      .setDescription(`**Origem:** ${source}`)
      .addFields(
        { name: 'Erro', value: `\`\`\`${error.toString().substring(0, 1000)}\`\`\``, inline: false },
        { name: 'Data/Hora', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      )
      .setTimestamp();

    try {
      await this.webhook.send({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao enviar log de erro:', error);
    }
  }
}

module.exports = new Logger();
