const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verbanco')
        .setDescription('Verifica o saldo bancário de um jogador')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('ID do jogador')
                .setRequired(true))
        // Definir que apenas administradores podem usar este comando
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        // Verificação adicional de permissão (caso a verificação do Discord falhe)
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            await logger.logCommand(
                interaction,
                "Tentativa de acesso não autorizado",
                `Usuário ${interaction.user.tag} tentou usar o comando sem permissão`
            );
            return interaction.reply({ 
                content: '❌ Você não tem permissão para usar este comando. Apenas administradores podem verificar saldos bancários.', 
                flags: 64 
            });
        }

        const id = interaction.options.getInteger('id');

        try {
            // Verificar se o jogador existe
            const [rows] = await pool.execute('SELECT * FROM characters WHERE id = ?', [id]);
            if (rows.length === 0) {
                await logger.logCommand(interaction, "Consulta de saldo", `Jogador com ID ${id} não encontrado.`);
                return interaction.reply({ content: `❌ Jogador com ID ${id} não encontrado!`, flags: 64 });
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Informações Bancárias - ID: ${id}`)
                .addFields(
                    { name: 'Nome', value: `${rows[0].name} ${rows[0].name2}`, inline: true },
                    { name: 'Saldo Bancário', value: `$${rows[0].bank}`, inline: true },
                    { name: 'Paypal', value: `$${rows[0].paypal || 0}`, inline: true }
                )
                .setTimestamp();

            await logger.logCommand(
                interaction,
                "Consulta de saldo",
                `ID: ${id}\nNome: ${rows[0].name} ${rows[0].name2}\nSaldo: $${rows[0].bank}`
            );

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await logger.logError(`Comando ${interaction.commandName}`, error);
            return interaction.reply({ content: '❌ Ocorreu um erro ao processar o comando.', flags: 64 });
        }
    },
};
