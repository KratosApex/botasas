const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Mostra o ranking de membros do servidor')
        .addSubcommand(subcommand =>
            subcommand
                .setName('top')
                .setDescription('Mostra os membros com maior pontuação'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Mostra a pontuação de um usuário específico')
                .addUserOption(option => 
                    option.setName('usuario')
                        .setDescription('Usuário para verificar')
                        .setRequired(false))),

    async execute(interaction, client) {
        try {
            await interaction.followUp();
            
            const subcommand = interaction.options.getSubcommand();
            
            // Criar tabela se não existir
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS user_ranking (
                    user_id VARCHAR(20) PRIMARY KEY,
                    username VARCHAR(100) NOT NULL,
                    points INT DEFAULT 0,
                    level INT DEFAULT 1,
                    last_message TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            if (subcommand === 'top') {
                // Buscar top 10 usuários
                const [rows] = await pool.execute('SELECT * FROM user_ranking ORDER BY points DESC LIMIT 10');
                
                if (rows.length === 0) {
                    return interaction.editReply('Ainda não há usuários no ranking!');
                }
                
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('🏆 Ranking de Membros')
                    .setDescription('Os membros mais ativos do servidor')
                    .setTimestamp();
                
                // Adicionar campos para cada usuário
                for (let i = 0; i < rows.length; i++) {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
                    embed.addFields({
                        name: `${medal} ${rows[i].username}`,
                        value: `Nível: ${rows[i].level} | Pontos: ${rows[i].points}`,
                        inline: false
                    });
                }
                
                await interaction.editReply({ embeds: [embed] });
                
            } else if (subcommand === 'user') {
                const targetUser = interaction.options.getUser('usuario') || interaction.user;
                
                // Buscar dados do usuário
                const [rows] = await pool.execute('SELECT * FROM user_ranking WHERE user_id = ?', [targetUser.id]);
                
                // Se o usuário não existe no banco, criar entrada
                if (rows.length === 0) {
                    await pool.execute(
                        'INSERT INTO user_ranking (user_id, username, points, level) VALUES (?, ?, ?, ?)',
                        [targetUser.id, targetUser.username, 0, 1]
                    );
                    
                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`Ranking de ${targetUser.username}`)
                        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                        .addFields(
                            { name: 'Nível', value: '1', inline: true },
                            { name: 'Pontos', value: '0', inline: true },
                            { name: 'Ranking', value: 'Novo membro', inline: true }
                        )
                        .setTimestamp();
                    
                    return interaction.editReply({ embeds: [embed] });
                }
                
                // Buscar posição no ranking
                const [rankRows] = await pool.execute('SELECT COUNT(*) as rank FROM user_ranking WHERE points > ?', [rows[0].points]);
                const rank = rankRows[0].rank + 1;
                
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`Ranking de ${rows[0].username}`)
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: 'Nível', value: `${rows[0].level}`, inline: true },
                        { name: 'Pontos', value: `${rows[0].points}`, inline: true },
                        { name: 'Ranking', value: `#${rank}`, inline: true }
                    )
                    .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
            }
            
            await logger.logCommand(
                interaction,
                "Consulta de ranking",
                `Subcomando: ${subcommand}`
            );
        } catch (error) {
            console.error(error);
            await logger.logError(`Comando ${interaction.commandName}`, error);
            await interaction.editReply('❌ Ocorreu um erro ao processar o comando.');
        }
    },
};
