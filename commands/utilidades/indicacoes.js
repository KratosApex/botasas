const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../../config/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('indicacoes')
        .setDescription('Mostra o ranking de membros que mais convidaram pessoas para o servidor.'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            // Busca todos os dados de convites, já calculando o total válido
            const [rows] = await pool.execute(`
                SELECT user_id, username, (regular + bonus - left_users) as total_invites
                FROM user_invites
                WHERE (regular + bonus - left_users) > 0
                ORDER BY total_invites DESC
                LIMIT 10
            `);

            if (rows.length === 0) {
                return interaction.editReply('Ainda não há ninguém no ranking de indicações.');
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🏆 Ranking de Indicações')
                .setTimestamp();

            let description = 'Os membros que mais contribuíram para o crescimento da cidade!\n\n';
            for (let i = 0; i < rows.length; i++) {
                const user = rows[i];
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
                
                description += `${medal} <@${user.user_id}> - **${user.total_invites}** indicações válidas\n`;
            }

            embed.setDescription(description);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro ao buscar ranking de indicações:', error);
            await interaction.editReply({ 
                content: '❌ Ocorreu um erro ao buscar o ranking de indicações.', 
                ephemeral: true 
            });
        }
    },
};