const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupidrelease')
        .setDescription('Configura a mensagem para liberação final de ID no canal correto.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        // Busca o ID do canal de liberação no seu ficheiro config.json
        const channelId = client.config.CHANNELS.ID_RELEASE_CHANNEL_ID;
        if (!channelId) {
            return interaction.reply({ content: '❌ O canal de liberação de ID (`ID_RELEASE_CHANNEL_ID`) não está configurado no `config.json`.', ephemeral: true });
        }
        
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel) {
            return interaction.reply({ content: '❌ Não consegui encontrar o canal de liberação de ID com o ID: ${channelId}. Verifique o `config.json`.', ephemeral: true });
        }

        try {
            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('✅ Liberação de Acesso à Cidade')
                .setDescription(
                    'Parabéns por chegar à etapa final!\n\n' +
                    'Clique no botão abaixo para informar o seu **Steam Hex ID** e nome do personagem. Após isso, você receberá o cargo de Whitelist e poderá entrar na cidade.'
                )
                .setFooter({ text: 'Certifique-se de que os seus dados estão corretos.' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('release_id_button')
                        .setLabel('Liberar Meu Acesso')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🔑')
                );

            await channel.send({ embeds: [embed], components: [row] });
            
            await logger.logCommand(interaction, "Setup de Liberação de ID", `Painel configurado no canal ${channel.name}`);
            
            return interaction.reply({ content: `✅ Mensagem de liberação de ID enviada com sucesso para o canal <#${channelId}>!`, ephemeral: true });

        } catch (error) {
            console.error(error);
            await logger.logError(`Comando ${interaction.commandName}`, error);
            return interaction.reply({ content: '❌ Ocorreu um erro ao configurar a mensagem de liberação.', ephemeral: true });
        }
    },
};