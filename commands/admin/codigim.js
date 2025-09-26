const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'VIVSRJ';
    for (let i = 0; i < 10; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('codigim')
        .setDescription('Gerencia os códigos de aprovação direta.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('gerar')
                .setDescription('Gera um ou mais códigos de aprovação direta.')
                .addIntegerOption(option =>
                    option.setName('quantidade')
                        .setDescription('O número de códigos a serem gerados (padrão: 1, máximo: 20)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(20)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('excluir')
                .setDescription('Exclui um código existente.')
                .addStringOption(option =>
                    option.setName('codigo')
                        .setDescription('O código a ser excluído')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('painel')
                .setDescription('Mostra os códigos gerados e utilizados.')),

    async execute(interaction, client) {
        try {
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS codigim_codes (
                    code VARCHAR(255) PRIMARY KEY,
                    generated_by VARCHAR(255) NOT NULL,
                    is_used BOOLEAN DEFAULT false,
                    used_by VARCHAR(255) NULL,
                    used_at TIMESTAMP NULL
                )
            `);
        } catch (error) {
            await logger.logError('Comando /codigim DB', error);
            return interaction.reply({ content: '❌ Ocorreu um erro de banco de dados.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'gerar') {
            const quantidade = interaction.options.getInteger('quantidade') || 1;
            const generatedCodes = Array.from({ length: quantidade }, () => generateCode());

            try {
                const values = generatedCodes.map(code => [code, interaction.user.id]);
                await pool.query('INSERT INTO codigim_codes (code, generated_by) VALUES ?', [values]);
                await logger.logCommand(interaction, "Códigos Gerados", `Quantidade: ${quantidade}`);
                const replyMessage = `✅ ${quantidade} código(s) gerado(s) com sucesso:\n\`\`\`${generatedCodes.join('\n')}\`\`\``;
                return interaction.reply({ content: replyMessage, ephemeral: true });
            } catch (error) {
                await logger.logError(`Comando /codigim gerar`, error);
                return interaction.reply({ content: '❌ Ocorreu um erro ao gerar os códigos.', ephemeral: true });
            }
        } else if (subcommand === 'excluir') {
            const code = interaction.options.getString('codigo');
            try {
                const [result] = await pool.execute('DELETE FROM codigim_codes WHERE code = ?', [code]);
                if (result.affectedRows > 0) {
                    await logger.logCommand(interaction, "Código Excluído", `Código: ${code}`);
                    return interaction.reply({ content: `✅ Código \`${code}\` excluído com sucesso.`, ephemeral: true });
                } else {
                    return interaction.reply({ content: `❌ Código \`${code}\` não encontrado.`, ephemeral: true });
                }
            } catch (error) {
                await logger.logError(`Comando /codigim excluir`, error);
                return interaction.reply({ content: '❌ Ocorreu um erro ao excluir o código.', ephemeral: true });
            }
        } else if (subcommand === 'painel') {
            try {
                const [availableCodes] = await pool.execute('SELECT code FROM codigim_codes WHERE is_used = false');
                const [usedCodes] = await pool.execute('SELECT code, used_by FROM codigim_codes WHERE is_used = true');

                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('Painel de Códigos (Codigim)')
                    .setTimestamp();

                let availableText = availableCodes.map(row => `\`${row.code}\``).join('\n') || 'Nenhum código disponível.';
                if (availableText.length > 1024) {
                    availableText = availableText.substring(0, 1020) + '...';
                }

                let usedText = usedCodes.map(row => `\`${row.code}\` - <@${row.used_by}>`).join('\n') || 'Nenhum código utilizado.';
                if (usedText.length > 1024) {
                    usedText = usedText.substring(0, 1020) + '...';
                }

                embed.addFields(
                    { name: `Disponíveis (${availableCodes.length})`, value: availableText, inline: false },
                    { name: `Utilizados (${usedCodes.length})`, value: usedText, inline: false }
                );

                return interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                await logger.logError(`Comando /codigim painel`, error);
                return interaction.reply({ content: '❌ Ocorreu um erro ao buscar os códigos.', ephemeral: true });
            }
        }
    },
};