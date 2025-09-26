const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Mostra a latência do bot e do websocket'),

    async execute(interaction, client) {
        try {
            // Envia uma resposta inicial "a pensar..." para poder ser editada depois.
            await interaction.deferReply(); // <-- CORRIGIDO AQUI

            // Obter o timestamp da resposta
            const reply = await interaction.fetchReply();
            
            // Calcular a diferença de tempo entre a interação e a resposta
            const ping = reply.createdTimestamp - interaction.createdTimestamp;
            
            // Criar embed com as informações de latência
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🏓 Pong!')
                .addFields(
                    { name: 'Latência do Bot', value: `${ping}ms`, inline: true },
                    { name: 'Latência do WebSocket', value: `${client.ws.ping}ms`, inline: true }
                )
                .setFooter({ text: 'Brasil fivem Host ✅' })
                .setTimestamp();
            
            // Editar a resposta inicial com o embed final
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no comando ping:', error);
            // Se der erro, tenta editar a resposta. Se isso falhar, envia uma nova.
            await interaction.editReply('❌ Ocorreu um erro ao verificar a latência.').catch(() => {
                interaction.reply({ content: '❌ Ocorreu um erro ao verificar a latência.', ephemeral: true });
            });
        }
    },
};