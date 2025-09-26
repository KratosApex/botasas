const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sugestao')
    .setDescription('Envia uma sugestão para o servidor')
    .addStringOption(option =>
      option.setName('titulo')
        .setDescription('Título da sugestão')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('descricao')
        .setDescription('Descrição detalhada da sugestão')
        .setRequired(true)),

  async execute(interaction, client) {
    const titulo = interaction.options.getString('titulo');
    const descricao = interaction.options.getString('descricao');

    try {
      const suggestionsChannel = client.channels.cache.get(client.config.SUGGESTION_CHANNEL_ID);
      if (!suggestionsChannel) {
        return interaction.reply({
          content: '❌ Canal de sugestões não configurado. Contate um administrador.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Sugestão: ${titulo}`)
        .setDescription(descricao)
        .addFields(
          { name: 'Autor', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Status', value: '⏳ Em análise', inline: true },
          { name: 'Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: 'Use os botões abaixo para votar nesta sugestão' })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('suggestion_upvote')
            .setLabel('👍 A favor')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('suggestion_downvote')
            .setLabel('👎 Contra')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('suggestion_comment')
            .setLabel('💬 Comentar')
            .setStyle(ButtonStyle.Primary)
        );

      const message = await suggestionsChannel.send({ embeds: [embed], components: [row] });

      await message.react('👍');
      await message.react('👎');

      await logger.logCommand(
        interaction,
        "Sugestão enviada",
        `Autor: <@${interaction.user.id}>\nTítulo: ${titulo}\nMensagem: ${message.url}`
      );

      return interaction.reply({
        content: `✅ Sua sugestão foi enviada com sucesso! Você pode vê-la em <#${suggestionsChannel.id}>.`,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await logger.logError(`Comando ${interaction.commandName}`, error);
      return interaction.reply({
        content: '❌ Ocorreu um erro ao enviar sua sugestão.',
        ephemeral: true
      });
    }
  },

  async handleInteraction(interaction, client) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('suggestion_')) {
      try {
        await interaction.deferUpdate();
        const userId = interaction.user.id;
        const messageId = interaction.message.id;

        switch (interaction.customId) {
          case 'suggestion_upvote':
            console.log(`Usuário ${userId} votou a favor da sugestão ${messageId}`);
            await logger.logCommand(
              interaction,
              "Voto positivo em sugestão",
              `Usuário: <@${userId}>\nMensagem: ${interaction.message.url}`
            );
            break;

          case 'suggestion_downvote':
            console.log(`Usuário ${userId} votou contra a sugestão ${messageId}`);
            await logger.logCommand(
              interaction,
              "Voto negativo em sugestão",
              `Usuário: <@${userId}>\nMensagem: ${interaction.message.url}`
            );
            break;

          case 'suggestion_comment':
            try {
              const threads = await interaction.channel.threads.fetchActive();
              const existingThread = threads.threads.find(thread => 
                thread.starterId === interaction.message.id || 
                thread.name.includes(interaction.message.embeds[0].title.substring(0, 30))
              );
              
              if (existingThread) {
                await interaction.followUp({
                  content: `Um tópico de discussão já existe para esta sugestão. [Clique aqui para participar](https://discord.com/channels/${interaction.guild.id}/${existingThread.id})`,
                  ephemeral: true
                });
              } else {
                const threadName = `Discussão: ${interaction.message.embeds[0].title.substring(0, 50)}`;
                const thread = await interaction.message.startThread({
                  name: threadName,
                  autoArchiveDuration: 60,
                  reason: 'Thread criada para discussão da sugestão'
                });
                
                await thread.send({
                  content: `Thread de discussão criada por <@${interaction.user.id}>. Por favor, mantenha a discussão civilizada e relacionada à sugestão.`
                });
                
                await interaction.followUp({
                  content: `✅ Thread de discussão criada com sucesso! [Clique aqui para participar](https://discord.com/channels/${interaction.guild.id}/${thread.id})`,
                  ephemeral: true
                });
                
                await logger.logCommand(
                  interaction,
                  "Thread de sugestão criada",
                  `Usuário: <@${userId}>\nSugestão: ${interaction.message.url}\nThread: ${thread.id}`
                );
              }
            } catch (threadError) {
              console.error('Erro ao criar thread:', threadError);
              await interaction.followUp({
                content: '❌ Ocorreu um erro ao criar o tópico de discussão.',
                ephemeral: true
              });
              await logger.logError("Criação de thread", threadError);
            }
            break;
        }
      } catch (error) {
        console.error(error);
        await logger.logError(`Interação de botão ${interaction.customId}`, error);
        try {
          await interaction.followUp({
            content: '❌ Ocorreu um erro ao processar sua interação.',
            ephemeral: true
          });
        } catch (followUpError) {
          console.error('Erro ao enviar mensagem de erro:', followUpError);
        }
      }
    }
  }
};