const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../../config/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('convites')
        .setDescription('Mostra seus convites ou de outro usuário')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Usuário para verificar convites')
                .setRequired(false)),

    async execute(interaction, client) {
        const user = interaction.options.getUser('usuario') || interaction.user;
        
        try {
            // Criar tabela se não existir
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS user_invites (
                    user_id VARCHAR(20) PRIMARY KEY,
                    regular INT DEFAULT 0,
                    left_users INT DEFAULT 0,
                    fake INT DEFAULT 0,
                    bonus INT DEFAULT 0
                )
            `);
            
            // Buscar dados do usuário
            const [rows] = await pool.execute('SELECT * FROM user_invites WHERE user_id = ?', [user.id]);
            
            const userData = rows.length > 0 ? rows[0] : { 
                regular: 0, 
                left_users: 0, 
                fake: 0, 
                bonus: 0 
            };
            
            // Calcular total de convites válidos
            const totalValid = userData.regular - userData.left_users + userData.bonus;
            
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Convites de ${user.username}`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Total Válidos', value: `${totalValid}`, inline: true },
                    { name: 'Regulares', value: `${userData.regular}`, inline: true },
                    { name: 'Saíram', value: `${userData.left_users}`, inline: true },
                    { name: 'Bônus', value: `${userData.bonus}`, inline: true }
                )
                .setFooter({ text: 'Sistema de Indicações' })
                .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ Ocorreu um erro ao verificar os convites.', 
                flags: 64 
            });
        }
    },
};
