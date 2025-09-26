const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupwl')
        .setDescription('Configura o painel central de whitelist.')
        .addChannelOption(option => 
            option.setName('canal')
                .setDescription('Canal onde o painel de whitelist será enviado')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const channel = interaction.options.getChannel('canal');

        try {
            const embed = new EmbedBuilder()
                .setColor(0x2b2d31)
                .setTitle('📜 Processo de Allowlist - VIVS Roleplay')
                .setDescription(
                    'Bem-vindo(a) ao nosso processo de allowlist!\n\n' +
                    'Para garantir a qualidade do nosso Roleplay, temos um processo de verificação. Escolha uma das opções abaixo para começar a sua jornada na cidade.'
                )
                .addFields(
                    { name: '1️⃣ Iniciar Allowlist RP', value: 'Clique para começar um questionário sobre regras de Roleplay. Se aprovado no teste, sua solicitação irá para análise da staff.' },
                    { name: '🎟️ Utilizar Código', value: 'Se você possui um código de aprovação direta, clique aqui para pular a etapa do questionário.' }
                )
                .setFooter({ text: 'VIVS Roleplay - A sua história começa aqui.' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('start_interview_button')
                        .setLabel('Iniciar Allowlist RP')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('📝'),
                    new ButtonBuilder()
                        .setCustomId('use_codigim_button')
                        .setLabel('Utilizar Código')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🎟️')
                );

            await channel.send({ embeds: [embed], components: [row] });

            await logger.logCommand(interaction, "Setup de Whitelist Central", `Painel configurado no canal ${channel}`);

            return interaction.reply({ 
                content: `✅ Painel de whitelist central configurado com sucesso no canal ${channel}!`, 
                ephemeral: true 
            });
        } catch (error) {
            console.error(error);
            await logger.logError(`Comando ${interaction.commandName}`, error);
            return interaction.reply({ 
                content: '❌ Ocorreu um erro ao configurar o painel de whitelist.', 
                ephemeral: true 
            });
        }
    },
};