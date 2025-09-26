const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');
const path = require('path');
const config = require(path.join(__dirname, '..', 'config', 'config.json'));

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, client) {
    try {
      // Definir welcomeRole no escopo mais amplo
      let welcomeRole = null;
      
      // Verificar o tipo de sistema configurado
      if (!config.roleSystem || config.roleSystem.type === 'auto') {
        // Sistema automático - adicionar cargo imediatamente
        welcomeRole = member.guild.roles.cache.get(client.config.ROLES.WELCOME);
        if (welcomeRole) {
          await member.roles.add(welcomeRole);
          console.log(`Cargo ${welcomeRole.name} adicionado automaticamente ao usuário ${member.user.tag}`);
        }
      } else {
        // Sistema de verificação por botão - não adicionar cargo automaticamente
        console.log(`Usuário ${member.user.tag} entrou no servidor. Aguardando verificação por botão.`);
      }

      // Enviar mensagem de boas-vindas (independente do sistema de autorole)
      const welcomeChannel = member.guild.channels.cache.get(client.config.WELCOME_CHANNEL_ID);
      if (!welcomeChannel) return;

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(`Bem-vindo(a) ${member.user.username}!`)
        .setDescription(`Olá <@${member.id}>, seja bem-vindo(a) ao servidor **${member.guild.name}**!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Membro', value: `${member.user.tag}`, inline: true },
          { name: 'ID', value: `${member.id}`, inline: true },
          { name: 'Entrou em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setImage('https://usagif.com/wp-content/uploads/2021/4fh5wi/bemvindo-15.gif')
        .setFooter({ text: `Agora temos ${member.guild.memberCount} membros!` })
        .setTimestamp();

      await welcomeChannel.send({ embeds: [embed] });

      await logger.logDatabase(
        "Novo Membro",
        `Usuário: ${member.user.tag} (${member.id})\nCargo adicionado: ${config.roleSystem && config.roleSystem.type === 'verification' ? 'Aguardando verificação' : (welcomeRole ? welcomeRole.name : 'Nenhum')}`
      );
    } catch (error) {
      console.error('Erro ao processar novo membro:', error);
      await logger.logError("Evento guildMemberAdd", error);
    }
  },
};
