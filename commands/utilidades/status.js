const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
// Substituindo fetch por axios
const axios = require('axios');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Mostra o status do servidor FiveM')
    .addBooleanOption(option =>
      option.setName('publico')
        .setDescription('Exibir status publicamente no canal?')
        .setRequired(false))
    // Definir que apenas administradores podem usar este comando
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    // Verificação adicional de permissão
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      await logger.logCommand(
        interaction,
        "Tentativa de acesso não autorizado",
        `Usuário ${interaction.user.tag} tentou usar o comando sem permissão`
      );
      return interaction.reply({
        content: '❌ Você não tem permissão para usar este comando. Apenas administradores podem verificar o status do servidor.',
        flags: 64
      });
    }

    try {
      // Verificar se o status deve ser público ou privado
      const isPublic = interaction.options.getBoolean('publico') || false;
      // Resposta inicial será sempre privada para o comando inicial
      await interaction.deferReply({ flags: isPublic ? 0 : 64 });
      
      // Função para obter e exibir o status
      const fetchAndDisplayStatus = async (editReply = true) => {
        try {
          // Usando axios em vez de fetch
          const response = await axios.get(`http://${client.config.HOST_FIVEM}:${client.config.PORT_FIVEM}/players.json`);
          const serverInfoResponse = await axios.get(`http://${client.config.HOST_FIVEM}:${client.config.PORT_FIVEM}/info.json`);
          
          // Com axios, os dados já estão em response.data, não precisamos chamar .json()
          const players = response.data;
          const serverInfo = serverInfoResponse.data;
          
          // Comando de conexão para o FiveM
          const connectCommand = `connect ${client.config.CONNECT_DOMAIN || client.config.HOST_FIVEM + ':' + client.config.PORT_FIVEM}`;
          
          if (isPublic) {
            // Status público simplificado
            const publicEmbed = new EmbedBuilder()
              .setColor(0x0099FF)
              .setTitle(`Status do Servidor - ${serverInfo.vars.sv_hostname || 'Servidor FiveM'}`)
              .setDescription(`Jogadores Online: **${players.length}**\nRecursos: **${serverInfo.resources ? serverInfo.resources.length : 'N/A'}**`)
              .setImage(serverInfo.vars.logo_url || 'https://i.imgur.com/eYcJFjk.png')
              .setFooter({ text: `Última atualização: ${new Date().toLocaleString()}` })
              .setTimestamp();
              
            const row = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel('Copiar Comando de Conexão')
                  .setStyle(ButtonStyle.Secondary)
                  .setCustomId('copy_connect_command'),
                new ButtonBuilder()
                  .setLabel('Conectar via CFX')
                  .setStyle(ButtonStyle.Link)
                  .setURL(`https://cfx.re/join/${client.config.CFX_CODE || ''}`)
              );
              
            // Adicionar campo com o comando de conexão
            publicEmbed.addFields({
              name: 'Comando Connect',
              value: `\`${connectCommand}\``,
              inline: false
            });
            
            if (editReply) {
              await interaction.editReply({ embeds: [publicEmbed], components: [row] });
            }
            
            return { embed: publicEmbed, components: [row] };
          } else {
            // Status privado detalhado
            const privateEmbed = new EmbedBuilder()
              .setColor(0x0099FF)
              .setTitle(`Status do Servidor - ${serverInfo.vars.sv_hostname || 'Servidor FiveM'}`)
              .setDescription(`Informações atualizadas em <t:${Math.floor(Date.now() / 1000)}:F>`)
              .addFields(
                { name: 'Jogadores Online', value: `${players.length}/${serverInfo.vars.sv_maxClients || 'N/A'}`, inline: true },
                { name: 'Versão', value: `${serverInfo.version || 'N/A'}`, inline: true },
                { name: 'Recursos', value: `${serverInfo.resources ? serverInfo.resources.length : 'N/A'}`, inline: true },
                { name: 'Comando Connect', value: `\`${connectCommand}\``, inline: false }
              )
              .setImage(serverInfo.vars.logo_url || 'https://i.imgur.com/eYcJFjk.png')
              .setFooter({ text: `Última atualização: ${new Date().toLocaleString()}` })
              .setTimestamp();
              
            // Adicionar lista de jogadores se houver
            if (players.length > 0) {
              let playerList = '';
              players.slice(0, 15).forEach(player => {
                playerList += `**ID:** ${String(player.id)} | **Nome:** ${String(player.name)}\n`;
              });
              
              if (players.length > 15) {
                playerList += `*E mais ${String(players.length - 15)} jogadores...*`;
              }
              
              if (playerList !== '') {
                privateEmbed.addFields({ name: 'Jogadores Online', value: playerList });
              }
            }
            
            const row = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel('Copiar Comando de Conexão')
                  .setStyle(ButtonStyle.Secondary)
                  .setCustomId('copy_connect_command'),
                new ButtonBuilder()
                  .setLabel('Conectar via CFX')
                  .setStyle(ButtonStyle.Link)
                  .setURL(`https://cfx.re/join/${client.config.CFX_CODE || ''}`)
              );
              
            if (editReply) {
              await interaction.editReply({ embeds: [privateEmbed], components: [row] });
            }
            
            return { embed: privateEmbed, components: [row] };
          }
        } catch (error) {
          console.error('Erro ao obter status:', error);
          const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Erro')
            .setDescription('Ocorreu um erro ao obter o status do servidor.')
            .setFooter({ text: `Última atualização: ${new Date().toLocaleString()}` })
            .setTimestamp();
            
          if (editReply) {
            await interaction.editReply({ embeds: [errorEmbed], components: [] });
          }
          
          return { embed: errorEmbed, components: [] };
        }
      };
      
      // Exibir status inicial
      const initialStatus = await fetchAndDisplayStatus();
      
      // Se for público, configurar atualizações automáticas
      if (isPublic) {
        // Armazenar a mensagem para atualizações
        const message = await interaction.fetchReply();
        
        // Armazenar informações para atualização
        if (!client.statusMessages) {
          client.statusMessages = new Map();
        }
        
        // Adicionar esta mensagem à lista de mensagens a serem atualizadas
        client.statusMessages.set(message.id, {
          channelId: interaction.channelId,
          messageId: message.id,
          isPublic: isPublic,
          lastUpdate: Date.now()
        });
        
        // Se não houver um intervalo de atualização configurado, criar um
        if (!client.statusUpdateInterval) {
          client.statusUpdateInterval = setInterval(async () => {
            // Atualizar todas as mensagens de status
            for (const [messageId, statusInfo] of client.statusMessages.entries()) {
              try {
                // Verificar se a mensagem existe há mais de 1 hora (3600000 ms)
                if (Date.now() - statusInfo.lastUpdate > 3600000) {
                  client.statusMessages.delete(messageId);
                  continue;
                }
                
                const channel = await client.channels.fetch(statusInfo.channelId);
                if (!channel) {
                  client.statusMessages.delete(messageId);
                  continue;
                }
                
                const message = await channel.messages.fetch(statusInfo.messageId).catch(() => null);
                if (!message) {
                  client.statusMessages.delete(messageId);
                  continue;
                }
                
                // Obter status atualizado
                const { embed, components } = await fetchAndDisplayStatus(false);
                // Atualizar a mensagem
                await message.edit({ embeds: [embed], components });
                // Atualizar timestamp
                statusInfo.lastUpdate = Date.now();
              } catch (error) {
                console.error(`Erro ao atualizar mensagem de status ${messageId}:`, error);
                client.statusMessages.delete(messageId);
              }
            }
          }, 5 * 60 * 1000); // 5 minutos
        }
      }
      
      await logger.logCommand(
        interaction,
        "Consulta de status do servidor",
        `Modo: ${isPublic ? 'Público' : 'Privado'}`
      );
    } catch (error) {
      console.error(error);
      await logger.logError(`Comando ${interaction.commandName}`, error);
      await interaction.editReply({ content: '❌ Ocorreu um erro ao obter o status do servidor.', flags: 64 });
    }
  },
};
